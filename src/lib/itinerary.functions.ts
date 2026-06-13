import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ tripId: z.string().uuid() });

const UNSPLASH_KEY = "czoq8W7s7ZJy_tslF57tAB-lQS_y_u6TDTiG0vFtwds";

async function unsplashImage(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
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

    if (trip.status === "ready" && trip.itinerary) {
      return { itinerary: trip.itinerary, hero_image_url: trip.hero_image_url };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

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
Trip style: ${trip.trip_style ?? "unspecified"}
Avoid: ${trip.avoid?.trim() || "nothing in particular"}

Traveler profile:
- Age: ${profile?.age ?? "unknown"}
- Declared travel style: ${profile?.travel_style ?? "unknown"}
- Declared budget range: ${profile?.budget_range ?? "unknown"}
- Preferred destinations: ${profile?.preferred_destinations?.join(", ") || "unknown"}
- Previous trips (history): ${historyLine}

============================
INTERNAL REASONING — MANDATORY (do this silently before writing JSON)
============================
1. TRAVELER PSYCHOLOGY: Infer the traveler archetype from age, companion, budget, style and history. Young solo on a tight budget ≠ family with kids ≠ couple on a luxury escape ≠ group of friends partying. Every activity must fit this archetype (pace, vibe, price tier, kid-friendliness, nightlife level, physical effort).
2. GEOGRAPHIC LOGIC: Mentally cluster the destination into neighborhoods/zones. Each day must focus on ONE coherent zone (or two adjacent ones). NEVER jump across the city/region back and forth in the same day. Order activities so consecutive stops are walking distance or one short transit hop apart.
3. TIME PHYSICS: Every activity must fit realistically in the day. Account for: arrival/departure times, travel time between stops (walking ~5 km/h, metro/taxi 15–30 min between zones), opening hours of typical venues, meal times appropriate for the destination's culture, and human rest needs. No day should overflow or leave huge unexplained gaps.
4. EXPERIENCE DESIGN: Balance intensity vs rest, indoor vs outdoor, iconic vs hidden, active vs contemplative, food vs sightseeing. Avoid two museums in a row, two heavy meals back to back, or three nightlife stops in one evening (unless the archetype demands it).

============================
CLIMATE & SEASON AWARENESS
============================
- Consider the typical weather of ${trip.destination} in ${monthName}.
- Cold/winter: prioritize indoor (museums, cafés, spas, thermal baths, covered markets). NO beach/pool/long hikes/rooftops.
- Hot summer in hot destinations: outdoor sightseeing 08:00–11:00 and 17:00+; midday for indoor/lunch/siesta/pool.
- Rainy season: covered options + flexible indoor backups.
- Add brief practical weather tips in descriptions when relevant.

============================
SELF-VALIDATION CHECKLIST (run silently before finalizing JSON; if ANY check fails, FIX the plan and re-check)
============================
[ ] Geographic coherence: each day stays in one zone or adjacent zones; no zig-zag across the map.
[ ] Travel-time realism: consecutive activities reachable in the implied time gap.
[ ] Balanced load: sensible number of activities per day for the archetype.
[ ] Logical flow: morning → midday → afternoon → evening; meals at culturally appropriate hours; rest blocks where needed.
[ ] Personalization: every activity justifiable from the traveler profile. Remove anything generic or off-archetype.
[ ] Arrival/departure constraints respected on day 1 and last day.
[ ] Climate constraints respected for ${monthName}.
Only output the JSON AFTER the checklist passes.

============================
HARD RULES
============================
- FORBIDDEN: generic tourist top-10 lists, copy-pasted "must-see" plans, activities with no link to the traveler profile, vague venues.
- Every activity must connect LOCATION + TIME + USER ARCHETYPE.
- "place" must be a REAL, specific, named venue in ${trip.destination}. Never invent generic names.

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
          "description": "1-2 lines in ${langName} — concrete tip tied to this traveler.",
          "category": "transport"
        }
      ]
    }
  ]
}

MANDATORY OUTPUT REQUIREMENTS:
- Generate ${dayCount} days.
- 5–7 activities per day for normal travelers; fewer on tight arrival/departure days or slow-travel archetypes; more only for high-intensity archetypes.
- "time": ALWAYS 24h HH:MM. NEVER use "Morning/Afternoon/Evening".
- "emoji": ONE emoji per activity.
- "category": EXACTLY one of: "hotel", "restaurant", "activity", "transport", "sight", "nightlife", "shopping", "other".

Return pure JSON only.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a travel planner. You return ONLY valid JSON without markdown, explanations or extra text.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
      if (aiRes.status === 402) throw new Error("Créditos de IA agotados. Recarga tu plan.");
      throw new Error(`Error IA ${aiRes.status}: ${text.slice(0, 200)}`);
    }

    const aiJson = (await aiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = aiJson.choices?.[0]?.message?.content;
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
