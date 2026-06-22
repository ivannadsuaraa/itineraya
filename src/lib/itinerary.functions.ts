import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ tripId: z.string().uuid() });

async function unsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: Array<{ urls?: { regular?: string } }> };
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
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
    const lang: "es" | "en" =
      (profile?.language ?? "").toLowerCase().slice(0, 2) === "en" ? "en" : "es";
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
    const tripTypesLine = tripTypes.length > 0
      ? tripTypes.join(", ")
      : (trip.trip_style ?? "unspecified");

    const accommodationBlock = hasAccommodation
      ? `ACCOMMODATION: The traveler ALREADY HAS a hotel/apartment booked. DO NOT recommend hotels. DO NOT include any "check-in", "hotel suggestion" or "where to stay" activity. Treat the accommodation as a fixed but unknown base — start/end each day from a generic "your accommodation" without naming a specific hotel.`
      : `ACCOMMODATION: The traveler does NOT yet have a place to stay. You MAY include one short "check-in" or accommodation-area note on day 1 if useful, but the focus is the itinerary, not hotel listings.`;

    const prompt = `You are an expert travel planner. Build a personalized, geographically coherent, time-realistic itinerary. Write all user-facing strings in ${langName}.

CONTEXT
Destination: ${trip.destination}
Dates: ${trip.start_date ?? "flexible"} → ${trip.end_date ?? "flexible"} (~${dayCount} days, ${monthName})
${arrivalLine}
${departureLine}
With: ${trip.companion ?? "?"} | Budget: ${trip.budget ?? "?"} | Types: ${tripTypesLine} | Avoid: ${trip.avoid?.trim() || "—"}
${accommodationBlock}
Profile: age ${profile?.age ?? "?"}, type ${profile?.traveler_type ?? "?"}, style ${profile?.travel_style ?? "?"}, budget ${profile?.budget_range ?? "?"}, likes ${profile?.preferred_destinations?.join(", ") || "?"}. History: ${historyLine}

RULES
- Each day focuses on ONE neighborhood/zone (or two adjacent). NEVER zig-zag across the city.
- Realistic travel times. For every activity after the first of the day, include a short transport hint in "description" (mode + minutes), using real local transport (metro lines, tram, vaporetto, etc.). Walk if <1.5 km.
- Respect arrival/departure constraints and climate for ${monthName} (cold/rainy → indoor; hot summer → outdoor early/late, indoor midday).
- Balance pace, indoor/outdoor, iconic/hidden. Mix must reflect the selected trip types.
- Culturally-correct meal hours. In Spanish use peninsular meal naming: Desayuno (07:30–10:00), Comida (13:30–16:00, MAIN midday meal, never "almuerzo"/"lunch"), Cena (20:30–23:00). Meal activity titles MUST start with the meal word ("Comida en …", "Cena en …").

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
      "place": "Real venue name",
      "description": "1-2 lines in ${langName}, with transport hint when chained",
      "category": "hotel|restaurant|activity|transport|sight|nightlife|shopping|other"
    }]
  }]
}

Generate exactly ${dayCount} days. 5–7 activities/day (fewer on tight arrival/departure days). ${hasAccommodation ? 'NEVER use category "hotel".' : ""} Pure JSON only.`;


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
