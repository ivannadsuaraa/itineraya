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

    const dayCount = (() => {
      if (!trip.start_date || !trip.end_date) return 5;
      const a = new Date(trip.start_date).getTime();
      const b = new Date(trip.end_date).getTime();
      const d = Math.max(1, Math.round((b - a) / 86400000) + 1);
      return Math.min(d, 14);
    })();

    const prompt = `Eres un experto planificador de viajes. Crea un itinerario detallado en español.

Destino: ${trip.destination}
Fechas: ${trip.start_date ?? "flexibles"} a ${trip.end_date ?? "flexibles"} (~${dayCount} días)
Con quién: ${trip.companion ?? "no especificado"}
Presupuesto: ${trip.budget ?? "no especificado"}
Estilo: ${trip.trip_style ?? "no especificado"}
Evitar: ${trip.avoid?.trim() || "nada en particular"}

Devuelve SOLO JSON válido sin markdown con esta forma exacta:
{
  "summary": "1-2 frases inspiradoras",
  "days": [
    {
      "day": 1,
      "title": "Título corto del día",
      "subtitle": "Resumen de 1 frase",
      "image_query": "2-3 palabras en inglés para foto representativa",
      "activities": [
        { "time": "Mañana", "title": "Actividad", "description": "Detalle útil con consejos" }
      ]
    }
  ]
}

Genera ${dayCount} días. 3-5 actividades por día (Mañana, Tarde, Noche). NO uses markdown, devuelve JSON puro.`;

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
              "Eres un planificador de viajes. Devuelves ÚNICAMENTE JSON válido sin markdown, sin explicaciones, sin texto adicional.",
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

    let parsed: { summary?: string; days: Array<{ day: number; title: string; subtitle?: string; image_query?: string; activities: Array<{ time: string; title: string; description: string }> }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      const cleaned = content
        .replace(/```json\n?/gi, "")
        .replace(/```/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
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
