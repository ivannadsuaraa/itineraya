import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  tripId: z.string().uuid(),
  instruction: z.string().min(1).max(2000),
});

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: "hotel" | "restaurant" | "activity" | "transport" | "sight" | "nightlife" | "shopping" | "other";
};
type Day = {
  day: number;
  title: string;
  subtitle?: string;
  image_url?: string | null;
  image_query?: string;
  activities: Activity[];
};
type Itinerary = { summary?: string; days: Day[] };

export const editItineraryWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Plan gate
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    const plan = (profile as { plan?: string } | null)?.plan ?? "free";
    if (plan === "free") {
      throw new Error("Esta función está disponible en los planes Viajero y Explorador.");
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .select("id,destination,itinerary,hero_image_url,start_date,end_date,budget,companion,trip_style")
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !trip || !trip.itinerary) throw new Error("Viaje no encontrado");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const current = trip.itinerary as unknown as Itinerary;

    const prompt = `Eres un experto planificador de viajes. Vas a modificar un itinerario existente según la petición del usuario.

Destino: ${trip.destination}
Fechas: ${trip.start_date ?? "flexibles"} a ${trip.end_date ?? "flexibles"}
Compañía: ${trip.companion ?? "no especificado"}
Presupuesto: ${trip.budget ?? "no especificado"}
Estilo: ${trip.trip_style ?? "no especificado"}

Itinerario actual (JSON):
${JSON.stringify(current)}

Petición del usuario:
"${data.instruction}"

Devuelve SOLO JSON válido sin markdown, con EXACTAMENTE esta estructura, conservando los días no modificados tal cual y respetando los campos image_url e image_query existentes:
{
  "summary": "string",
  "days": [
    {
      "day": 1,
      "title": "string",
      "subtitle": "string",
      "image_query": "2-3 palabras en inglés",
      "image_url": "URL o null (mantén la existente si no cambias el día)",
      "activities": [
        {
          "time": "09:00",
          "emoji": "🛬",
          "title": "string",
          "place": "Nombre real del lugar",
          "description": "1-2 líneas con consejo útil",
          "category": "hotel|restaurant|activity|transport|sight|nightlife|shopping|other"
        }
      ]
    }
  ],
  "change_summary": "1-2 frases en español describiendo qué cambiaste"
}

REQUISITOS:
- Mantén MÍNIMO 5-6 actividades por día.
- "time" SIEMPRE en formato 24h HH:MM (nunca "Mañana/Tarde/Noche").
- "emoji" representativo de la actividad.
- "place" con nombre REAL (hotel/restaurante/museo) en ${trip.destination}.
- "category" exactamente uno de los valores listados.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Devuelves ÚNICAMENTE JSON válido, sin markdown ni texto extra." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
      if (aiRes.status === 402) throw new Error("Créditos de IA agotados.");
      throw new Error(`Error IA ${aiRes.status}: ${text.slice(0, 200)}`);
    }

    const aiJson = (await aiRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) throw new Error("Respuesta vacía del modelo");

    let parsed: Itinerary & { change_summary?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    const { change_summary, ...itineraryOnly } = parsed;

    // Preserve existing image_urls by day number when missing
    itineraryOnly.days = itineraryOnly.days.map((d) => {
      const old = current.days.find((od) => od.day === d.day);
      return { ...d, image_url: d.image_url ?? old?.image_url ?? null };
    });

    const { error: updateErr } = await supabase
      .from("trips")
      .update({ itinerary: itineraryOnly, status: "ready" })
      .eq("id", data.tripId);
    if (updateErr) throw updateErr;

    return {
      itinerary: itineraryOnly,
      change_summary: change_summary ?? "He actualizado tu itinerario.",
    };
  });
