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

    // Load user language preference (es | en). Default es.
    const { data: profile } = await supabase
      .from("profiles")
      .select("language")
      .eq("id", userId)
      .maybeSingle();
    const lang: "es" | "en" =
      (profile?.language ?? "").toLowerCase().slice(0, 2) === "en" ? "en" : "es";
    const langName = lang === "en" ? "English" : "Spanish";

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

    const prompt = `You are an expert travel planner. Create a VERY detailed itinerary written in ${langName}.

Destination: ${trip.destination}
Dates: ${trip.start_date ?? "flexible"} to ${trip.end_date ?? "flexible"} (~${dayCount} days)
Travel month: ${monthName}
${arrivalLine}
${departureLine}
Travelling with: ${trip.companion ?? "unspecified"}
Budget: ${trip.budget ?? "unspecified"}
Style: ${trip.trip_style ?? "unspecified"}
Avoid: ${trip.avoid?.trim() || "nothing in particular"}

CLIMATE & SEASON AWARENESS (CRITICAL):
- Consider the typical weather of ${trip.destination} in ${monthName} and adapt every activity to it.
- Cold/winter conditions: prioritize indoor activities (museums, galleries, cafés, spas, covered markets, thermal baths), warm food, short outdoor walks. NEVER recommend beach, swimming, open-air pools, long hikes or rooftop bars when it would be cold or rainy.
- Hot summer in hot destinations: schedule outdoor sightseeing early morning (08:00-11:00) and late afternoon/evening (17:00 onwards); reserve midday (12:00-16:00) for indoor activities, long lunches, siesta or pool/beach. Avoid long outdoor walks at noon.
- Rainy season: favor covered options and have flexible indoor alternatives.
- Mild seasons: balance freely.
- Always mention practical clothing/weather tips in the description when relevant (e.g. "bring a coat", "go early to beat the heat").


Return ONLY valid JSON without markdown, with this EXACT shape (write user-facing strings — summary/title/subtitle/place/description — in ${langName}):
{
  "summary": "1-2 inspiring sentences",
  "days": [
    {
      "day": 1,
      "title": "Short day title",
      "subtitle": "1-sentence recap",
      "image_query": "2-3 English words for a representative photo",
      "activities": [
        {
          "time": "09:00",
          "emoji": "🛬",
          "title": "Airport arrival",
          "place": "[real airport name]",
          "description": "1-2 lines with a useful tip or detail.",
          "category": "transport"
        }
      ]
    }
  ]
}

MANDATORY REQUIREMENTS:
- Generate ${dayCount} days.
- MINIMUM 5-6 activities per day spread across morning, midday, afternoon and evening.
- "time": ALWAYS 24h HH:MM (e.g. "09:00", "13:30", "20:00"). NEVER use "Morning/Afternoon/Evening".
- "emoji": ONE emoji representing the activity (🛬 flight, 🏨 hotel, 🍜🍣🍝🥐 food, 🌅 viewpoint, 🏛️ museum, 🚶 walk, 🚲 bike, 🍹 drinks, 🎭 show, 🏖️ beach, etc).
- "title": short activity name (3-6 words) in ${langName}.
- "place": REAL name of the venue or specific spot (real hotel, real restaurant, museum, viewpoint, etc) in ${trip.destination}. NEVER invent generic names.
- "description": 1-2 lines in ${langName} with a useful tip — what to order/see/do.
- "category": EXACTLY one of: "hotel", "restaurant", "activity", "transport", "sight", "nightlife", "shopping", "other".

Return pure JSON, no markdown, no backticks.`;

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
