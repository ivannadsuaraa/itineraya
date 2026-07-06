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

// JSON schema enforced server-side via structured outputs (output_config.format).
// Guarantees valid, schema-conformant JSON — extractJson below remains only as a safety net.
const itinerarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "days"],
  properties: {
    summary: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "title", "subtitle", "image_query", "activities"],
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          subtitle: { type: "string" },
          image_query: { type: "string" },
          activities: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["time", "emoji", "title", "place", "description", "category"],
              properties: {
                time: { type: "string", description: "24h HH:MM" },
                emoji: { type: "string", description: "exactly one emoji" },
                title: { type: "string" },
                place: { type: "string" },
                description: { type: "string" },
                category: {
                  type: "string",
                  enum: [
                    "hotel",
                    "restaurant",
                    "activity",
                    "transport",
                    "sight",
                    "nightlife",
                    "shopping",
                    "other",
                  ],
                },
                url: { type: "string" },
                tip: {
                  type: "string",
                  description:
                    "optional insider tip: best time to go, what to order, how to skip the line",
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function extractJson<T>(raw: string): T {
  // 1. Strip markdown fences
  let text = raw
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // 2. Extract the outermost JSON object (first { … last })
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  // 3. Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    /* continue to repair */
  }

  // 4. Repair common LLM JSON mistakes
  const repaired = text
    // trailing commas before ] or }
    .replace(/,\s*([}\]])/g, "$1")
    // unescaped newlines inside string values
    .replace(/("(?:[^"\\]|\\.)*")|(\n)/g, (m, str) => (str ? str : " "))
    // single-quoted keys/values → double-quoted (careful: only bare single quotes)
    .replace(/'([^']+)'(\s*:)/g, '"$1"$2')
    .replace(/:\s*'([^']*)'/g, ': "$1"');

  try {
    return JSON.parse(repaired) as T;
  } catch {
    /* continue to truncation recovery */
  }

  // 5. Truncation recovery: close any open arrays/objects and retry
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of repaired) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  // Drop incomplete last string or value by trimming to last clean comma/brace
  let truncated = repaired.replace(/,\s*$/, "").replace(/:\s*"[^"]*$/, ': ""');
  while (stack.length) truncated += stack.pop();

  try {
    return JSON.parse(truncated) as T;
  } catch (e) {
    throw new Error(`No se pudo parsear el JSON del modelo: ${(e as Error).message}`);
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
    // Must match the client gate (new-trip.tsx) and the pricing page: 2 / 15 / ∞.
    const planLimit: number | null = plan === "explorador" ? null : plan === "viajero" ? 15 : 2;

    if (planLimit !== null) {
      // Count generated trips (same criterion as the client gate in new-trip.tsx).
      const { count } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "ready")
        .neq("id", data.tripId);

      if ((count ?? 0) >= planLimit) {
        const msg =
          plan === "free"
            ? `LIMIT_REACHED: Has alcanzado el límite de ${planLimit} itinerarios en el plan gratuito. Actualiza al plan Viajero para crear más.`
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
    type ItinLang = "es" | "en" | "fr" | "pt";
    const SUPPORTED_ITIN_LANGS: readonly ItinLang[] = ["es", "en", "fr", "pt"];
    const clientLang = (data.language ?? "").toLowerCase().slice(0, 2);
    const profileLang = (profile?.language ?? "").toLowerCase().slice(0, 2);
    const lang: ItinLang = (SUPPORTED_ITIN_LANGS as readonly string[]).includes(clientLang)
      ? (clientLang as ItinLang)
      : (SUPPORTED_ITIN_LANGS as readonly string[]).includes(profileLang)
        ? (profileLang as ItinLang)
        : "es";

    // Trip history for personalization (last 5 ready trips, excluding current)
    const { data: history } = await supabase
      .from("trips")
      .select("destination, trip_style, companion, budget")
      .eq("user_id", userId)
      .eq("status", "ready")
      .neq("id", data.tripId)
      .order("created_at", { ascending: false })
      .limit(5);

    const historyLine =
      history && history.length > 0
        ? history
            .map(
              (t) =>
                `${t.destination} (${t.trip_style ?? "—"}, ${t.companion ?? "—"}, ${t.budget ?? "—"})`,
            )
            .join("; ")
        : "no previous trips";

    const dayCount = (() => {
      if (!trip.start_date || !trip.end_date) return 5;
      const a = new Date(trip.start_date).getTime();
      const b = new Date(trip.end_date).getTime();
      const d = Math.max(1, Math.round((b - a) / 86400000) + 1);
      return Math.min(d, 14);
    })();

    const budgetBlock = (() => {
      const raw = (trip as { budget?: string | null }).budget;
      const match = raw?.match(/^(\d+)-(\d+)$/);
      if (!match) return "";
      const lo = Number(match[1]);
      const hi = Number(match[2]);
      const mid = (lo + hi) / 2;
      const tier =
        mid < 300
          ? "backpacker (hostels, public transport, street food)"
          : mid < 800
            ? "budget (basic hotels, mixed transport, local restaurants)"
            : mid < 2000
              ? "comfortable (3-star hotels, varied restaurants)"
              : mid < 4000
                ? "premium (4-star hotels, exclusive experiences)"
                : mid < 7000
                  ? "luxury (5-star hotels, private transfers, VIP experiences)"
                  : "ultra-luxury (suites, exclusive experiences, no spending limit)";
      const dailyLo = Math.round(lo / dayCount);
      const dailyHi = Math.round(hi / dayCount);
      return `- Budget: ${lo}€–${hi}€ total (~${dailyLo}€–${dailyHi}€/day). Spending style: ${tier}. Match accommodation, restaurants and activities to this level — never suggest options far above or below it.`;
    })();

    const monthName = (() => {
      if (!trip.start_date) return "unspecified";
      const d = new Date(trip.start_date);
      const names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
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

    const tripTypes = (trip as { trip_types?: string[] | null }).trip_types ?? [];
    const hasAccommodation = !!(trip as { has_accommodation?: boolean | null }).has_accommodation;
    const hotelName = (trip as { hotel_name?: string | null }).hotel_name ?? null;
    const hotelAddress = (trip as { hotel_address?: string | null }).hotel_address ?? null;
    const hotelLatRaw = (trip as { hotel_lat?: number | string | null }).hotel_lat;
    const hotelLngRaw = (trip as { hotel_lng?: number | string | null }).hotel_lng;
    const hotelLat = hotelLatRaw != null ? Number(hotelLatRaw) : null;
    const hotelLng = hotelLngRaw != null ? Number(hotelLngRaw) : null;
    const hasHotelCoords =
      hotelLat != null && hotelLng != null && !Number.isNaN(hotelLat) && !Number.isNaN(hotelLng);
    const tripTypesLine =
      tripTypes.length > 0 ? tripTypes.join(", ") : (trip.trip_style ?? "unspecified");

    const accommodationBlock = hasHotelCoords
      ? `- Accommodation (FIXED ANCHOR): "${hotelName ?? "hotel"}"${hotelAddress ? ` (${hotelAddress})` : ""}, coordinates ${hotelLat!.toFixed(5)},${hotelLng!.toFixed(5)}. Every activity must be within ~3 km of it. Each day starts and ends here. No activities in other cities; never recommend other hotels.`
      : hasAccommodation
        ? `- Accommodation: already booked (exact location unknown). Assume a central base. Never recommend other hotels; each day starts and ends at "your accommodation".`
        : `- Accommodation: not booked yet. You may include a brief hotel check-in on day 1.`;

    const inlandSet = new Set([
      "madrid",
      "toledo",
      "granada",
      "sevilla",
      "córdoba",
      "salamanca",
      "valladolid",
      "zaragoza",
      "pamplona",
      "burgos",
      "segovia",
      "ávila",
      "mérida",
      "cáceres",
      "león",
      "santiago",
      "london",
      "paris",
      "prague",
      "vienna",
      "budapest",
      "berlin",
      "munich",
      "milan",
      "rome",
      "florence",
      "venice",
      "siena",
      "verona",
      "bologna",
      "turin",
      "dublin",
      "edinburgh",
      "york",
      "oxford",
      "cambridge",
      "bath",
      "moscow",
      "kyiv",
      "warsaw",
      "krakow",
      "bucharest",
      "sofia",
      "belgrade",
      "luxembourg",
      "brussels",
      "amsterdam",
      "copenhagen",
      "stockholm",
      "oslo",
      "helsinki",
      "reykjavik",
      "innsbruck",
      "salzburg",
      "zurich",
      "geneva",
      "luxor",
      "cairo",
      "jaipur",
      "agra",
      "delhi",
      "kathmandu",
      "mexico city",
      "guadalajara",
      "quito",
      "bogotá",
      "cusco",
      "la paz",
      "lima",
      "santiago de chile",
      "buenos aires",
      "asunción",
    ]);
    const isKnownInland = inlandSet.has(trip.destination.toLowerCase().trim());

    const weekdayName = trip.start_date
      ? new Date(trip.start_date).toLocaleDateString("en-US", { weekday: "long" })
      : null;
    const datesLine =
      trip.start_date && trip.end_date
        ? `${trip.start_date} to ${trip.end_date} (day 1 is a ${weekdayName})`
        : "not specified";

    const companion = (trip as { companion?: string | null }).companion ?? null;

    // ── Personalización profunda (columnas opcionales; null si la migración
    // trip_personalization aún no está aplicada) ──
    const pace = (trip as { pace?: string | null }).pace ?? "balanced";
    const firstVisit = (trip as { first_visit?: boolean | null }).first_visit;
    const dietaryRaw = (trip as { dietary?: string | null }).dietary ?? null;

    const paceMap: Record<string, string> = {
      relaxed:
        "RELAXED pace: 4-5 activities/day, first activity never before 10:00, long unhurried meals, at least one café/terrace break per day, evenings end early or with a calm plan.",
      balanced:
        "BALANCED pace: 5-6 activities/day, days start around 09:00-09:30, a good mix of sights and downtime.",
      intense:
        "INTENSE pace: 6-7 activities/day, early starts (08:30-09:00), full days — this traveler wants to squeeze every hour; still keep transitions realistic.",
    };
    const paceLine = paceMap[pace] ?? paceMap.balanced;

    const firstVisitLine =
      firstVisit === false
        ? "The traveler has BEEN HERE BEFORE: skip the obvious top-3 tourist clichés (or give them a fresh twist), and lean into neighborhoods, local life and lesser-known spots."
        : "FIRST TIME in this destination: the iconic must-sees belong in the plan, ordered sensibly — but balance them with authentic local moments.";

    const dietaryDescMap: Record<string, string> = {
      vegetarian: "vegetarian",
      vegan: "vegan",
      glutenFree: "gluten-free (celiac)",
      halal: "halal",
      allergies: "food allergies (details in the AVOID notes)",
    };
    const dietaryLine = dietaryRaw
      ? dietaryRaw
          .split(",")
          .map((d) => dietaryDescMap[d.trim()] ?? d.trim())
          .join(", ")
      : null;

    const age = (profile as { age?: number | null } | null)?.age ?? null;
    const travelerType =
      (profile as { traveler_type?: string | null } | null)?.traveler_type ?? null;

    const travelerProfileLine = [
      age ? `${age} years old` : null,
      travelerType ? `self-described as "${travelerType}"` : null,
      companion ? `traveling ${companion}` : "solo traveler",
    ]
      .filter(Boolean)
      .join(", ");

    const beachRule = isKnownInland
      ? `${trip.destination} is an inland city — beach, sea or coastal activities (beach time, snorkeling, sea kayaking, swimming in the sea) are strictly forbidden.`
      : `Only include beach or sea activities if ${trip.destination} genuinely has a coastline or nearby beach AND the season allows it. A beach is never the only activity of a day; combine it with nearby stops and avoid peak-heat hours (12:00–16:00) in summer.`;

    const languageBlocks: Record<ItinLang, string> = {
      es: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in Spanish from Spain (peninsular). Meal naming: "Desayuno", "Comida" (the main midday meal — never "almuerzo" or "lunch") and "Cena". Meal activity titles must start with the meal word ("Comida en …", "Cena en …").`,
      en: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in English. Meal naming: Breakfast, Lunch, Dinner, Snack. Meal activity titles must start with the meal word ("Lunch at …", "Dinner at …").`,
      fr: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in French. Meal naming: "Petit-déjeuner", "Déjeuner", "Dîner". Meal activity titles must start with the meal word ("Déjeuner à …", "Dîner à …").`,
      pt: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in Portuguese. Meal naming: "Café da manhã", "Almoço", "Jantar". Meal activity titles must start with the meal word ("Almoço em …", "Jantar em …").`,
    };
    const languageBlock = languageBlocks[lang];

    const transportExampleMap: Record<ItinLang, string> = {
      es: `"🚶 8 min a pie" | "🚇 Metro L4 dirección X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Tren, 18 min" | "⛴️ Ferry, 20 min"`,
      en: `"🚶 8 min walk" | "🚇 Metro Line 4 towards X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Train, 18 min" | "⛴️ Ferry, 20 min"`,
      fr: `"🚶 8 min à pied" | "🚇 Métro L4 direction X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Train, 18 min" | "⛴️ Ferry, 20 min"`,
      pt: `"🚶 8 min a pé" | "🚇 Metrô L4 sentido X, 12 min" | "🚌 Ônibus 24, 15 min" | "🚕 Táxi ~10 min" | "🚆 Trem, 18 min" | "⛴️ Balsa, 20 min"`,
    };
    const transportExamples = transportExampleMap[lang];

    const avoidText = (trip as { avoid?: string | null }).avoid?.trim() ?? "";
    const styleText = (trip.trip_style ?? "").trim();

    const travelerBlock = [
      `- Profile: ${travelerProfileLine}.`,
      `- ${firstVisitLine}`,
      `- ${paceLine}`,
      `- Interests: ${tripTypesLine}.${styleText ? ` In their own words: "${styleText.slice(0, 400)}".` : ""}`,
      dietaryLine
        ? `- Dietary requirements: ${dietaryLine}. EVERY restaurant and food stop must genuinely work for this — if unsure a venue fits, choose one that clearly does.`
        : "",
      avoidText
        ? `- The traveler explicitly wants to AVOID: ${avoidText.slice(0, 500)}. Never schedule anything matching this.`
        : "",
      `- Previous trips (calibrate their travel experience; never repeat these destinations' style blindly): ${historyLine}.`,
    ]
      .filter(Boolean)
      .join("\n");

    const logisticsBlock = [
      `- Destination: ${trip.destination}`,
      `- Dates: ${datesLine} — ${dayCount} days, month: ${monthName}`,
      `- ${arrivalLine}`,
      `- ${departureLine}`,
      accommodationBlock,
      budgetBlock,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are planning a ${dayCount}-day trip to ${trip.destination} for one specific traveler. The goal: an itinerary so well-fitted, geographically coherent and locally informed that it reads like a knowledgeable friend who lives there planned it personally.

THE TRAVELER
${travelerBlock}

TRIP LOGISTICS
${logisticsBlock}

OUTPUT LANGUAGE
${languageBlock}
Exception: "place" must always hold the venue's real name in its native language, and real proper nouns (streets, monuments, venues) keep their original names inside the text.

VOICE & TONE
Write for THIS traveler. A young group of friends gets an energetic, casual voice that knows where the night goes; a family with kids gets practical reassurance (short walking legs, early dinners, plan-B for meltdowns); a couple gets atmosphere, views and unhurried evenings; an experienced solo traveler gets confident, no-fluff local detail. Descriptions must be concrete and specific ("order the lampredotto", "come at sunset when the facade lights up") — never generic filler like "enjoy the atmosphere" or "soak in the culture".

RULES
1. GEOGRAPHY — Each day focuses on ONE neighborhood/zone (or two adjacent ones). Order the stops as a logical walking line or loop: consecutive stops ≤1.2 km apart or directly connected by transit, and the whole day within ~3 km unless the metro connects points in under 15 min. Never cross to the other side of the city and come back the same day. Meals stay inside the day's zone. Give each day a distinct zone so the trip progressively covers the destination without backtracking.
2. BEACH — ${beachRule}
3. SCHEDULE — Activities in chronological order with realistic durations: museum 1.5–2h, meal 1–1.5h, monument 45–60 min, café 20–30 min; leave 15–30 min of slack between stops. Respect opening hours AND weekly closing days: work out the weekday of every itinerary day from the dates above and never schedule a venue on a day it is typically closed (e.g. many museums close on Mondays). Meal times follow the local dining customs of ${trip.destination}, not those of the traveler's home country. The day's density and start time follow the traveler's pace above.
4. SEASON — It is ${monthName} in ${trip.destination}: plan around the real season. Typical weather (cold/rain → indoor priority; summer heat → outdoor mornings and evenings, indoor at midday), daylight hours (sunset time changes what an "evening walk" means), high/low season (book-ahead warnings in tips during peak months), and seasonal closures or seasonal specialties (dishes, markets, blooms) that only exist in this month.
5. TRANSPORT — Every activity except the first of each day must start its "description" with a transport line (mode + route + minutes from the previous stop): ${transportExamples}. Distances under 1.2 km are always on foot — never taxi.
6. REAL PLACES — Only real, well-established venues you are confident exist, and every restaurant must match BOTH the budget tier and the dietary requirements above. If you are not sure a specific restaurant exists, name the dining area or venue type instead (e.g. "Trattoria in Trastevere") — never fabricate a venue name.
7. HIDDEN GEMS — Include at least 2–3 genuine non-obvious experiences across the trip: places locals love and most tourists miss (a viewpoint without crowds, a market bar, a workshop, a lesser-known museum wing). They must be real and fit the traveler's interests — surprise them, don't pad the plan.
8. TIPS — Use the optional "tip" field on 1–2 activities per day for a specific, actionable insider tip: the best hour to avoid queues, what exactly to order, which entrance to use, where the best photo is. Never generic advice ("wear comfortable shoes").
9. LINKS — For the "url" field build a Google Maps link: https://www.google.com/maps/search/?api=1&query=VENUE+NAME+CITY (replace spaces with +). Use an official website instead only when you are completely certain of the exact URL. Never invent URLs; omit "url" when unsure.
10. EVENTS — Include a local festival, fair or public holiday only if it is a well-known recurring event you are confident takes place in ${trip.destination} within the trip dates. Never invent events or their URLs.
11. VOLUME — Exactly ${dayCount} days. Activities per day follow the traveler's pace (see THE TRAVELER); always fewer on days constrained by arrival or departure.${hasAccommodation ? ' Never use the "hotel" category.' : ""}

FIELD GUIDE
- summary: 2 sentences, second person, evocative and specific to THIS trip (destination + season + their interests) — it is the first thing they read when the itinerary appears.
- title (day): short and evocative — the day's zone or theme, not "Day 3". subtitle: a one-sentence recap of the day's arc.
- image_query: 2–3 English words for a photo of the day's area (e.g. "montmartre paris street").
- time: "HH:MM" 24h. emoji: exactly one emoji. title (activity): 3–6 words. description: 1–2 lines. tip: only when you have a genuinely useful insider tip.`;

    let aiRes: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const t0 = Date.now();
      console.log(
        `[itinerary] API call start (attempt ${attempt}) — ${dayCount} days, prompt ~${prompt.length} chars`,
      );
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
          system:
            "You are an expert travel planner. You create geographically coherent, time-realistic itineraries built around real venues, and you respond with a single JSON object that follows the provided schema exactly.",
          output_config: { format: { type: "json_schema", schema: itinerarySchema } },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      console.log(`[itinerary] API call end — ${Date.now() - t0}ms — status ${aiRes.status}`);
      if (aiRes.status !== 429) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
    if (!aiRes) throw new Error("Error al conectar con la IA.");

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
      throw new Error(`Error Claude ${aiRes.status}: ${text.slice(0, 200)}`);
    }

    const aiJson = (await aiRes.json()) as {
      content?: Array<{ text?: string }>;
      stop_reason?: string;
    };
    if (aiJson.stop_reason === "max_tokens")
      throw new Error("La respuesta del modelo se truncó. Vuelve a intentarlo.");
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
    const parsed: ParsedItin = extractJson<ParsedItin>(content);
    if (!parsed.days || parsed.days.length === 0)
      throw new Error("El modelo no devolvió ningún día de itinerario. Vuelve a intentarlo.");
    if (parsed.days.length !== dayCount)
      console.warn(`[itinerary] expected ${dayCount} days, model returned ${parsed.days.length}`);

    // Hero + all day images in parallel
    const [hero, ...dayImages] = await Promise.all([
      unsplashImage(`${trip.destination} travel landscape`),
      ...parsed.days.map((d) =>
        unsplashImage(`${d.image_query || trip.destination} ${trip.destination}`),
      ),
    ]);
    parsed.days = parsed.days.map((d, i) => ({ ...d, image_url: dayImages[i] }));

    const { error: updateErr } = await supabase
      .from("trips")
      .update({ itinerary: parsed, hero_image_url: hero, status: "ready" })
      .eq("id", data.tripId);
    if (updateErr) throw updateErr;

    return { itinerary: parsed, hero_image_url: hero };
  });
