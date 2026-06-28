import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  tripId: z.string().uuid(),
  language: z.string().optional(),
});

function fallbackImage(query: string): string {
  const q = encodeURIComponent(query.split(",")[0].trim() + ",travel");
  const lock = Math.abs([...query].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 1000;
  return `https://loremflickr.com/1200/800/${q}?lock=${lock}`;
}

async function unsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_KEY;
  if (!key) return fallbackImage(query);
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return fallbackImage(query);
    const data = (await res.json()) as { results?: Array<{ urls?: { regular?: string } }> };
    return data.results?.[0]?.urls?.regular ?? fallbackImage(query);
  } catch {
    return fallbackImage(query);
  }
}

export const generateItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: trip, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !trip) throw new Error("Viaje no encontrado");
    // Plan-based itinerary limit
    const { data: planProfile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    const plan = (planProfile?.plan ?? "free") as "free" | "viajero" | "explorador";
    const planLimit: number | null =
      plan === "explorador" ? null : plan === "viajero" ? 10 : 1;

    if (planLimit !== null) {
      // Count ALL existing trips (any status) except the one being generated.
      const { count } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("id", data.tripId);

      if ((count ?? 0) >= planLimit) {
        const msg =
          plan === "free"
            ? "LIMIT_REACHED: Has alcanzado el límite de 1 itinerario en el plan gratuito. Actualiza al plan Viajero para crear más."
            : `LIMIT_REACHED: Has alcanzado el límite de ${planLimit} itinerarios del plan Viajero. Actualiza a Explorador para itinerarios ilimitados.`;
        throw new Error(msg);
      }
    }


    if (trip.status === "ready" && trip.itinerary) {
      return { itinerary: trip.itinerary, hero_image_url: trip.hero_image_url };
    }

    const key = process.env.ANTHROPIC_API_KEY;
if (!key) throw new Error("Missing ANTHROPIC_API_KEY");


    // Load user profile (language, age, travel_style, budget_range, preferred_destinations)
    const { data: profile } = await supabase
      .from("profiles")
      .select("language, age, travel_style, budget_range, preferred_destinations, traveler_type")
      .eq("id", userId)
      .maybeSingle();
    // Prefer language passed from the client (current UI language) over stored profile.
    const clientLang = (data.language ?? "").toLowerCase().slice(0, 2);
    const profileLang = (profile?.language ?? "").toLowerCase().slice(0, 2);
    const lang: "es" | "en" =
      clientLang === "en" || clientLang === "es"
        ? (clientLang as "es" | "en")
        : profileLang === "en" ? "en" : "es";
    const langName = lang === "en" ? "English" : "Spanish";

    // Trip history for personalization (last 5 ready trips, excluding current)
    const { data: history } = await supabase
      .from("trips")
      .select("destination, trip_style, companion, budget")
      .eq("user_id", userId)
      .eq("status", "ready")
      .neq("id", data.tripId)
      .order("created_at", { ascending: false })
      .limit(5);

    const historyLine = history && history.length > 0
      ? history.map((t) => `${t.destination} (${t.trip_style ?? "—"}, ${t.companion ?? "—"}, ${t.budget ?? "—"})`).join("; ")
      : "no previous trips";

    const dayCount = (() => {
      if (!trip.start_date || !trip.end_date) return 5;
      const a = new Date(trip.start_date).getTime();
      const b = new Date(trip.end_date).getTime();
      const d = Math.max(1, Math.round((b - a) / 86400000) + 1);
      return Math.min(d, 14);
    })();

    const monthName = (() => {
      if (!trip.start_date) return "unspecified";
      const d = new Date(trip.start_date);
      const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      return `${names[d.getMonth()]} (month ${d.getMonth() + 1})`;
    })();

    const arrivalTime = (trip as { arrival_time?: string | null }).arrival_time ?? null;
    const departureTime = (trip as { departure_time?: string | null }).departure_time ?? null;

    const arrivalLine = arrivalTime
      ? `Day 1 arrival time: ${arrivalTime}. Do NOT schedule activities before this time on day 1. If arrival is late (after 20:00) plan only check-in and a light dinner nearby; if arrival is after 22:00 plan ONLY check-in / rest.`
      : `Day 1 arrival: unknown — assume a normal morning start.`;
    const departureLine = departureTime
      ? `Last day (day ${dayCount}) departure time: ${departureTime}. Do NOT schedule activities after this time on the last day; leave at least 2-3h before departure for transfer to airport/station. If departure is early morning (before 10:00) plan ONLY transfer; if morning (before 13:00) keep it to breakfast + a single light activity.`
      : `Last day departure: unknown — assume a normal evening end.`;

    const tripTypes = ((trip as { trip_types?: string[] | null }).trip_types) ?? [];
    const hasAccommodation = !!(trip as { has_accommodation?: boolean | null }).has_accommodation;
    const hotelName = (trip as { hotel_name?: string | null }).hotel_name ?? null;
    const hotelAddress = (trip as { hotel_address?: string | null }).hotel_address ?? null;
    const hotelLatRaw = (trip as { hotel_lat?: number | string | null }).hotel_lat;
    const hotelLngRaw = (trip as { hotel_lng?: number | string | null }).hotel_lng;
    const hotelLat = hotelLatRaw != null ? Number(hotelLatRaw) : null;
    const hotelLng = hotelLngRaw != null ? Number(hotelLngRaw) : null;
    const hasHotelCoords = hotelLat != null && hotelLng != null && !Number.isNaN(hotelLat) && !Number.isNaN(hotelLng);
    const tripTypesLine = tripTypes.length > 0
      ? tripTypes.join(", ")
      : (trip.trip_style ?? "unspecified");

    const accommodationBlock = hasHotelCoords
      ? `ACCOMMODATION (FIXED ANCHOR): The traveler is staying at "${hotelName ?? "their accommodation"}"${hotelAddress ? ` (${hotelAddress})` : ""}, coordinates ${hotelLat!.toFixed(5)}, ${hotelLng!.toFixed(5)}. This is the MANDATORY center of every day. EVERY activity, restaurant and meeting point MUST be within ~3 km (walking + short transit). Each day must START and END at the hotel. NEVER suggest activities in a different city/region. DO NOT recommend any other hotels. Order activities to minimize distance from the hotel.`
      : hasAccommodation
        ? `ACCOMMODATION: The traveler ALREADY HAS a place to stay but did not pin its location. Treat it as a generic base in the city center. DO NOT recommend other hotels. Start/end each day from "your accommodation".`
        : `ACCOMMODATION: The traveler does NOT yet have a place to stay. You MAY include one short "check-in" or accommodation-area note on day 1; the focus is the itinerary, not hotel listings.`;

    const isCoastalCity = (dest: string): boolean => {
          const inland = new Set([
            "madrid", "toledo", "granada", "sevilla", "córdoba", "salamanca", "valladolid",
            "zaragoza", "pamplona", "burgos", "segovia", "ávila", "mérida", "cáceres",
            "león", "santiago", "london", "paris", "prague", "vienna", "budapest", "berlin",
            "munich", "milan", "rome", "florence", "venice", "siena", "verona", "bologna",
            "turin", "dublin", "edinburgh", "york", "oxford", "cambridge", "bath",
            "moscow", "kyiv", "warsaw", "krakow", "bucharest", "sofia", "belgrade",
            "luxembourg", "brussels", "amsterdam", "copenhagen", "stockholm", "oslo",
            "helsinki", "reykjavik", "innsbruck", "salzburg", "zurich", "geneva",
            "luxor", "cairo", "jaipur", "agra", "delhi", "kathmandu",
            "mexico city", "guadalajara", "quito", "bogotá", "cusco", "la paz",
            "lima", "santiago de chile", "buenos aires", "asunción",
          ]);
          return !inland.has(dest.toLowerCase().trim());
        };
        const isCoastal = isCoastalCity(trip.destination);

        const prompt = `You are an expert travel planner. Build a personalized, geographically coherent, time-realistic itinerary.

LANGUAGE LOCK (ABSOLUTE — HIGHEST PRIORITY)
Output language: ${langName} (${lang.toUpperCase()}). 100% of user-facing strings (summary, title, subtitle, activity title, place, description, meal labels, transport hints, day themes) MUST be in ${langName}. Zero exceptions.
${lang === "en"
  ? `FORBIDDEN Spanish words (NEVER use): Desayuno, Almuerzo, Comida, Merienda, Cena, "a pie", "en metro", "en bus", dirección, Visita, Paseo, Tarde, Mañana, Noche, "y luego". Use ONLY English: Breakfast, Lunch, Dinner, Snack, "on foot", "by metro", "by bus", "towards", Visit, Walk, Afternoon, Morning, Evening, "and then". Transport hints in English: "🚶 8 min walk", "🚇 Metro Line 4 towards Trafalgar, 12 min", "🚌 Bus 24, 15 min", "🚕 Taxi 10 min".`
  : `FORBIDDEN English words (NEVER use): Breakfast, Lunch, Dinner, Visit, Walk, towards, Morning, Afternoon, Evening. Use ONLY Spanish (peninsular): Desayuno, Comida, Cena, Visita, Paseo, dirección, Mañana, Tarde, Noche.`}
Proper nouns (real venue/street/neighborhood names) stay in their native form — that is the ONLY allowed non-${langName} text.
The "place" field MUST be the real venue name in its native language (e.g. "Museo del Prado" not "Prado Museum" in Spanish; "Eiffel Tower" not "Torre Eiffel" in English).

GEOGRAPHIC COHERENCE — STRICT
- ${trip.destination} is a ${isCoastal ? "coastal city with beaches — you MAY include beach/coastal activities if seasonally appropriate" : "NON-COASTAL city — ABSOLUTELY NO beach, seaside, or coastal activities. No 'beach day', 'sunbathing', 'swimming at the beach', 'playa', 'spiaggia', 'kayak', 'snorkel', or any water/coastal activity. This is a hard rule."}
- Each day focuses on EXACTLY ONE neighborhood/zone (or two adjacent). The distance between the furthest activities in a single day MUST be under 3 km unless a metro/train connects them in <15 min.
- Order activities to form a logical LOOP or LINE: consecutive stops should be ≤1.2 km apart (walkable) or connected by direct transit.
- NEVER send the traveler to a neighborhood on one side of the city and then back to the other side later the same day. Group meals within the same zone.
- Meals MUST be within the day's zone — no crossing the city for lunch/dinner.
- The day's first activity sets the anchor zone; all subsequent activities stay in or adjacent to that zone.

${isCoastal ? "BEACH ACTIVITIES — ONLY include beaches if the month and weather are suitable. Never list a beach as the sole activity of a day; pair with nearby sights/restaurants. Avoid peak-heat hours (12:00–16:00) for beach in summer.\n" : ""}TEMPORAL COHERENCE
- Realistic durations: museum 1.5–2h, lunch 1–1.5h, sight 45–60 min, shopping 45 min, cafe 20–30 min. Leave 15–30 min buffer between stops for transit + photos.
- Respect opening hours and local meal times. Do NOT schedule activities back-to-back without travel time.
- Respect arrival/departure constraints and climate for ${monthName} (cold/rainy → indoor; hot summer → outdoor early/late, indoor midday).

TRANSPORT — MANDATORY EVERY ACTIVITY
- EVERY activity after the first of each day MUST begin its "description" with a transport hint on its own line: transport mode + route info + estimated minutes from the PREVIOUS stop.
- Use REAL local transport networks with line numbers/names (e.g. "🚶 8 min walk", "🚇 Metro L4 dirección Trafalgar, 12 min", "🚌 Bus 24, 15 min", "🚕 Taxi ~10 min", "🚆 Renfe C3, 18 min", "🚋 Tram 2, 8 min", "⛴️ Ferry, 20 min").
- Walks under 1.2 km: always "🚶 X min walk". Never use taxi for <1.2 km. For longer walks, mention "pleasant walk" or "scenic route" if applicable.
- Include official transport site in the day subtitle or first activity when relevant (e.g. tmb.cat for Barcelona, ratp.fr for Paris, mta.info for NYC, atac.roma.it for Rome, bvg.de for Berlin, tfl.gov.uk for London).

LOCAL EVENTS & FESTIVALS
- Research and verify real events, festivals, and public holidays overlapping EXACTLY with ${trip.start_date ?? "the trip dates"} through ${trip.end_date ?? "the trip dates"}. Include at least one if the destination has a known event during that window.
- Consider: Carnaval, Semana Santa, San Juan (23 Jun), Fallas, La Mercè, Oktoberfest, Carnevale di Venezia, Holi, Sakura/Cherry Blossom, Christmas markets, Diwali, Lunar New Year, local patron saint festivals (fiestas patronales), national holidays, music festivals, food festivals, sporting events.
- When a real event overlaps, INCLUDE it as a dedicated activity on the correct day with the real event name, the actual venue/route, and realistic time. In the "url" field, link to the official event page or official tourism site.

MEALS
- Culturally-correct meal hours. ${lang === "es" ? 'In Spanish use peninsular naming: Desayuno (07:30–10:00), Comida (13:30–16:00, MAIN midday meal — never "almuerzo"/"lunch"), Cena (20:30–23:00). Titles MUST start with the meal word ("Comida en …", "Cena en …").' : 'Use ONLY English meal names: Breakfast / Lunch / Dinner / Snack. Titles MUST start with the meal word ("Lunch at …", "Dinner at …"). Never write "Desayuno", "Comida", "Cena". Adapt times to local culture (Spain lunch 13:30-16:00, dinner 20:30-23:00; Italy similar; UK lunch 12:30, dinner 19:00; Japan dinner 18:30).'}
- Every "restaurant" category activity MUST have a real, specific venue name in the "place" field (e.g. "Casa Lucio" not just "tapas restaurant"). Include the "url" field with a direct link to the establishment.

LINKS (url FIELD) — CRITICAL QUALITY RULE
- For EVERY activity with category "restaurant" or "hotel", provide a "url" field with a DIRECT link to that SPECIFIC establishment (not the homepage).
  - Restaurants: direct link to the restaurant's official website, their Google Maps page (https://maps.google.com/?q=Restaurant+Name+City), or a specific page on TheFork/TripAdvisor/OpenTable. NEVER just thecity or generic tourism site.
  - Hotels: direct link to the hotel's official booking page, or a specific Booking.com/Agoda/etc. listing for THAT hotel.
  - Events: link to the official event or festival page.
- For sights/activities with a prominent official website (major museums, landmarks), include a "url" with the official ticket/visit page.
- If no specific URL is known, omit the field.

OUTPUT — return ONLY valid JSON, no markdown:
{
  "summary": "1-2 inspiring sentences in ${langName}",
  "days": [{
    "day": 1,
    "title": "Short zone/theme title in ${langName}",
    "subtitle": "1-sentence recap in ${langName}",
    "image_query": "2-3 English words",
    "activities": [{
      "time": "HH:MM (24h)",
      "emoji": "single emoji",
      "title": "3-6 words in ${langName}",
      "place": "Real venue name — native language",
      "description": "1-2 lines in ${langName}. If not the first stop, BEGIN with transport hint on its own line.",
      "category": "hotel|restaurant|activity|transport|sight|nightlife|shopping|other",
      "url": "https://direct-link-to-establishment-or-event (omit if unknown)"
    }]
  }]
}

Generate exactly ${dayCount} days. 5–7 activities/day (fewer on tight arrival/departure days). ${hasAccommodation ? 'NEVER use category "hotel".' : ""} Pure JSON only. Remember: 100% ${langName}. ALL rules above are mandatory — do not skip any.`;


    let aiRes: Response | null = null;
for (let attempt = 1; attempt <= 3; attempt++) {
  aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 16000,
      system: "You are a travel planner. You return ONLY valid JSON without markdown, explanations or extra text.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (aiRes.status !== 429) break;
  if (attempt < 3) await new Promise((r) => setTimeout(r, 5000 * attempt));
}
if (!aiRes) throw new Error("Error al conectar con la IA.");

if (!aiRes.ok) {
  const text = await aiRes.text();
  if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
  throw new Error(`Error Claude ${aiRes.status}: ${text.slice(0, 200)}`);
}

const aiJson = (await aiRes.json()) as { content?: Array<{ text?: string }> };
const content = aiJson.content?.[0]?.text ?? "";
if (!content) throw new Error("Respuesta vacía del modelo");


    type ParsedActivity = {
      time: string;
      emoji?: string;
      title: string;
      place?: string;
      description: string;
      category?: string;
    };
    type ParsedItin = {
      summary?: string;
      days: Array<{
        day: number;
        title: string;
        subtitle?: string;
        image_query?: string;
        image_url?: string | null;
        activities: ParsedActivity[];
      }>;
    };
    let parsed: ParsedItin;
    try {
      parsed = JSON.parse(content) as ParsedItin;
    } catch {
      const cleaned = content.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned) as ParsedItin;
    }


    // Hero image
    const hero = await unsplashImage(`${trip.destination} travel landscape`);

    // Day images in parallel
    const dayImages = await Promise.all(
      parsed.days.map((d) => unsplashImage(`${d.image_query || trip.destination} ${trip.destination}`)),
    );
    parsed.days = parsed.days.map((d, i) => ({ ...d, image_url: dayImages[i] }));

    const { error: updateErr } = await supabase
      .from("trips")
      .update({ itinerary: parsed, hero_image_url: hero, status: "ready" })
      .eq("id", data.tripId);
    if (updateErr) throw updateErr;

    return { itinerary: parsed, hero_image_url: hero };
  });
 
