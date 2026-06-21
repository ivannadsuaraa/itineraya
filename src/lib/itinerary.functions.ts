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
      .select("language, age, travel_style, budget_range, preferred_destinations")
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

    const prompt = `You are the TRAVEL INTELLIGENCE ENGINE — an expert travel planner that does NOT generate generic tourist lists. You build deeply personalized, geographically coherent, time-realistic itineraries. Write all user-facing strings in ${langName}.

============================
USER & TRIP CONTEXT
============================
Destination: ${trip.destination}
Dates: ${trip.start_date ?? "flexible"} to ${trip.end_date ?? "flexible"} (~${dayCount} days)
Travel month: ${monthName}
${arrivalLine}
${departureLine}
Travelling with: ${trip.companion ?? "unspecified"}
Budget: ${trip.budget ?? "unspecified"}
Trip types (multi-select): ${tripTypesLine}
Avoid: ${trip.avoid?.trim() || "nothing in particular"}

${accommodationBlock}

Traveler profile:
- Age: ${profile?.age ?? "unknown"}
- Declared travel style: ${profile?.travel_style ?? "unknown"}
- Declared budget range: ${profile?.budget_range ?? "unknown"}
- Preferred destinations: ${profile?.preferred_destinations?.join(", ") || "unknown"}
- Previous trips (history): ${historyLine}

============================
INTERNAL REASONING — MANDATORY (do this silently before writing JSON)
============================
1. TRAVELER PSYCHOLOGY: Infer the traveler archetype from age, companion, budget, trip types and history. Every activity must fit this archetype (pace, vibe, price tier, kid-friendliness, nightlife level, physical effort).
2. GEOGRAPHIC LOGIC: Mentally cluster the destination into neighborhoods/zones. Each day must focus on ONE coherent zone (or two adjacent ones). NEVER zig-zag.
3. TIME PHYSICS: Every activity must fit realistically. Account for arrival/departure, travel time between stops, opening hours, culturally-correct meal times, rest needs.
4. EXPERIENCE DESIGN: Balance intensity vs rest, indoor vs outdoor, iconic vs hidden. Honor the SELECTED TRIP TYPES (${tripTypesLine}) — the mix of activities should clearly reflect them.

============================
TRANSPORT INTELLIGENCE — MANDATORY
============================
For EACH activity after the first of the day, include in "description" a short transport hint to reach it from the previous stop:
- Mode: walking / metro / bus / taxi / ferry / bike / tram / train (use the modes that actually exist in ${trip.destination}).
- Approximate travel time in minutes (realistic: walking ~5 km/h, metro 15–25 min cross-city, taxi depends on traffic).
- Use real local transport systems when known (e.g. Metro Line 4, Vaporetto line 1, JR Yamanote line, MRT, tube, tram 28).
- NEVER imply instant teleportation between distant zones. If two stops are far, either insert a transport step or keep them on different days.
- Prefer walking when stops are <1.5 km apart; metro/bus for cross-city; taxi only when faster makes sense (late night, with luggage, kids/elderly).
Format example inside description: "🚶 10 min a pie desde la parada anterior" or "🚇 Metro L1 hasta Sol, ~15 min".

============================
CLIMATE & SEASON AWARENESS
============================
- Consider the typical weather of ${trip.destination} in ${monthName}.
- Cold/winter: prioritize indoor. Hot summer: outdoor early/late, indoor midday. Rainy: covered options + backups.

============================
SELF-VALIDATION CHECKLIST (silent; fix and re-check if any fails)
============================
[ ] Geographic coherence per day.
[ ] Travel-time realism with transport hints on chained stops.
[ ] Balanced load for the archetype.
[ ] Logical morning→evening flow with culturally-correct meal hours.
[ ] Every activity justifiable from the traveler profile and selected trip types.
[ ] Arrival/departure constraints respected.
[ ] Climate constraints respected for ${monthName}.
[ ] Accommodation rule respected (${hasAccommodation ? "no hotel suggestions" : "minimal/no hotel listings"}).

============================
HARD RULES
============================
- FORBIDDEN: generic tourist top-10 lists, copy-pasted "must-see" plans, activities with no link to the traveler profile, vague venues.
- Every activity must connect LOCATION + TIME + USER ARCHETYPE + REALISTIC TRANSPORT.
- "place" must be a REAL, specific, named venue in ${trip.destination}.

============================
SPANISH MEAL NAMING — STRICT (only when writing in Spanish)
============================
When ${langName} is Spanish, name meals using PENINSULAR SPANISH conventions:
- "Desayuno" → morning meal (07:30–10:00).
- "Almuerzo" → ONLY a light mid-morning snack/brunch (10:30–12:00). NEVER use "almuerzo" for the midday main meal.
- "Comida" → MAIN midday meal (13:30–16:00). Any meal scheduled between 13:30 and 16:00 MUST be titled "Comida" (never "Almuerzo", never "Lunch").
- "Merienda" → optional afternoon snack (17:00–19:00).
- "Cena" → evening meal (20:30–23:00).
Activity titles for meals MUST start with the correct word (e.g. "Comida en …", "Cena en …"). Do NOT translate "lunch" as "almuerzo" — it is always "comida".

============================
PACING & TRANSITIONS
============================
- Never schedule back-to-back activities in different zones without an explicit transport step in between.
- Respect realistic walking/transit times; leave breathing room between intense activities.
- Keep a logical morning → midday meal → afternoon → evening flow each day.


============================
OUTPUT FORMAT — return ONLY valid JSON, no markdown, no backticks
============================
{
  "summary": "1-2 inspiring sentences (in ${langName}) reflecting the traveler archetype",
  "days": [
    {
      "day": 1,
      "title": "Short day title (in ${langName}) — usually names the zone/theme",
      "subtitle": "1-sentence recap (in ${langName})",
      "image_query": "2-3 English words for a representative photo",
      "activities": [
        {
          "time": "09:00",
          "emoji": "🛬",
          "title": "Short activity name (3-6 words, ${langName})",
          "place": "Real venue name",
          "description": "1-2 lines in ${langName}, INCLUDING transport hint (mode + approx minutes) when relevant.",
          "category": "transport"
        }
      ]
    }
  ]
}

MANDATORY OUTPUT REQUIREMENTS:
- Generate ${dayCount} days.
- 5–7 activities per day for normal travelers; fewer on tight arrival/departure days.
- "time": ALWAYS 24h HH:MM.
- "emoji": ONE emoji per activity.
- "category": EXACTLY one of: "hotel", "restaurant", "activity", "transport", "sight", "nightlife", "shopping", "other".
${hasAccommodation ? '- DO NOT use category "hotel" for any activity.' : ""}

Return pure JSON only.`;


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
