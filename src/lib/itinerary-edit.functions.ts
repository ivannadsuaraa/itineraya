import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyItineraryPlaces } from "@/lib/place-verification";
import type { ParsedItinerary } from "@/lib/itinerary-shared";
import { z } from "zod";

// No cap existed before this audit — being plan-gated (Viajero/Explorador)
// deters casual abuse but not a compromised or scripted paying account
// hammering the Anthropic API for free. 40/day is generous for legitimate
// iterative editing while bounding worst-case cost.
const DAILY_LIMIT = 40;

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
  category?:
    | "hotel"
    | "restaurant"
    | "activity"
    | "transport"
    | "sight"
    | "nightlife"
    | "shopping"
    | "other";
  tip?: string;
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

    // Plan gate. Traemos también el idioma: la re-verificación de Places de
    // más abajo lo necesita para pedirle a Google los nombres en el idioma del
    // itinerario. Sin él Google responde en inglés, no casaría casi nada y una
    // simple edición borraría los sellos que la generación sí consiguió.
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, language")
      .eq("id", userId)
      .maybeSingle();
    const plan = (profile as { plan?: string } | null)?.plan ?? "free";
    if (plan === "free") {
      throw new Error("Esta función está disponible en los planes Viajero y Explorador.");
    }

    const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
      "check_and_increment_rate_limit" as never,
      { p_scope: "itinerary_edit_user", p_key: userId, p_limit: DAILY_LIMIT } as never,
    );
    if (rlErr) {
      console.error("[itinerary-edit] rate limit check failed", rlErr);
      throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
    }
    if (!allowed) {
      throw new Error(
        `LIMIT_REACHED: Has alcanzado el límite de ${DAILY_LIMIT} ediciones diarias. Inténtalo mañana.`,
      );
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .select(
        "id,destination,itinerary,hero_image_url,start_date,end_date,budget,companion,trip_style",
      )
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !trip || !trip.itinerary) throw new Error("Viaje no encontrado");

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

    const current = trip.itinerary as unknown as Itinerary;

    // Determine if destination is coastal (same logic as main prompt)
    const isCoastalCity = (dest: string): boolean => {
      const inland = new Set([
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
      return !inland.has(dest.toLowerCase().trim());
    };
    const isCoastal = isCoastalCity(trip.destination);

    const coastalRule = isCoastal
      ? `${trip.destination} es una ciudad costera — puedes incluir actividades de playa si la temporada lo permite.`
      : `${trip.destination} NO es una ciudad costera — ABSOLUTAMENTE PROHIBIDO recomendar playa, paseos marítimos, snorkel, kayak o cualquier actividad de costa.`;

    const prompt = `Eres un experto planificador de viajes. Vas a modificar un itinerario existente según la petición del usuario.

Destino: ${trip.destination}
Fechas: ${trip.start_date ?? "flexibles"} a ${trip.end_date ?? "flexibles"}
Compañía: ${trip.companion ?? "no especificado"}
Presupuesto: ${trip.budget ?? "no especificado"}
Estilo: ${trip.trip_style ?? "no especificado"}

${coastalRule}

Itinerario actual (JSON):
${JSON.stringify(current)}

Petición del usuario:
"${data.instruction}"

REGLA CERO — SOLO LUGARES REALES Y VERIFICABLES (manda sobre todas las demás):
Antes de escribir cualquier "place", aplica esta prueba: si el viajero escribiera ese nombre exacto en Google Maps en ${trip.destination} ahora mismo, ¿caería el pin sobre ese local? Si la respuesta no es un sí rotundo, NO escribas ese nombre.
Prohibido: inventarte el nombre de un restaurante, bar, museo, hotel o tienda; fabricar uno que suene auténtico pegando una palabra genérica a un toque local ("Trattoria da Nonna", "Bar Manolo", "Casa del Mar", "Museo del Vino") si ese local concreto no existe de verdad en ${trip.destination}; traer a este destino un local real de otra ciudad; darle a un pueblo barrios, museos o líneas de metro que no tiene; dar horarios, precios o normas de entrada como hechos ciertos (di siempre que son lo habitual y que conviene confirmarlo).
Cuando no estés seguro, usa el RECURSO en vez de adivinar: nombra un sitio real e inconfundible (una calle, plaza, paseo, mercado, barrio, parque o playa) más el tipo de local que buscar allí, y pon en "place" el nombre real de ese sitio. Ej: título "Comida en Trastevere", place "Trastevere, Roma", descripción "una trattoria de las callejuelas al norte de Piazza Santa Maria". Donde más se cuela lo inventado es en restaurantes, bares y tiendas pequeñas: ahí tira del recurso sin complejos. Antes de responder, relee cada "place" nuevo y sustituye por el recurso cualquiera que no puedas garantizar.

REGLAS OBLIGATORIAS:
1. IDIOMA: 100% español peninsular. Prohibido: Breakfast, Lunch, Dinner, Visit, Walk, towards, Morning, Afternoon, Evening. Usa SIEMPRE: Desayuno, Comida, Cena, Visita, Paseo, dirección, Mañana, Tarde, Noche. Nombres propios de lugares se quedan en su idioma original.

2. COHERENCIA GEOGRÁFICA: Cada día se centra en UN solo barrio/zona. No zigzaguees por la ciudad. Actividades consecutivas a ≤1.2 km o conectadas por transporte directo. Comidas en la misma zona del día.

3. TRANSPORTE: Cada actividad tras la primera del día DEBE empezar su "description" con transporte: modo + línea + minutos (ej: "🚶 8 min a pie", "🚇 Metro L4 dirección Trafalgar, 12 min", "🚌 Bus 24, 15 min").

4. HORARIOS: Museo 1.5-2h, comida 1-1.5h, sightseeing 45-60 min. 15-30 min de margen. Formato 24h HH:MM.

5. ENLACES (url): construye una búsqueda de Google Maps: https://www.google.com/maps/search/?api=1&query=NOMBRE+DEL+SITIO+CIUDAD (espacios como +). Si has usado el recurso de la REGLA CERO, enlaza el sitio real que hayas nombrado. Solo pon una web oficial si estás completamente seguro de la URL exacta. Nunca inventes URLs: si dudas, omite "url".

6. EVENTOS LOCALES: incluye un festival, feria o festivo solo si es un evento recurrente conocido que estés seguro de que se celebra en ${trip.destination} en esas fechas. Nunca inventes eventos ni sus fechas.

7. MANTÉN image_url e image_query existentes para días no modificados.

8. MANTÉN el campo "tip" de las actividades que no cambies. Puedes añadir "tip" (consejo local concreto y accionable) a actividades nuevas si conoces uno real.

Devuelve SOLO JSON válido sin markdown, con EXACTAMENTE esta estructura:
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
          "place": "Nombre REAL del establecimiento",
          "description": "1-2 líneas. Si no es primera actividad, EMPIEZA con transporte.",
          "category": "hotel|restaurant|activity|transport|sight|nightlife|shopping|other",
          "url": "https://enlace-directo-al-establecimiento (opcional)",
          "tip": "consejo local específico y accionable (opcional)"
        }
      ]
    }
  ],
  "change_summary": "1-2 frases en español describiendo qué cambiaste"
}

REQUISITOS:
- Mínimo 5-6 actividades/día.
- "time" SIEMPRE 24h HH:MM.
- "emoji" representativo.
- "place" con nombre REAL en ${trip.destination}.
- "category" exactamente uno de los valores listados.
- "url" solo si conoces el enlace directo al establecimiento concreto.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        system: "Devuelves ÚNICAMENTE JSON válido, sin markdown ni texto extra.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

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
    const content = aiJson.content?.[0]?.text;
    if (!content) throw new Error("Respuesta vacía del modelo");

    let parsed: Itinerary & { change_summary?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      const cleaned = content
        .replace(/```json\n?/gi, "")
        .replace(/```/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    }
    if (!Array.isArray(parsed.days) || parsed.days.length === 0)
      throw new Error("El modelo no devolvió un itinerario válido. Vuelve a intentarlo.");

    const { change_summary, ...itineraryOnly } = parsed;

    // Preserve existing image_urls by day number when missing
    itineraryOnly.days = itineraryOnly.days.map((d) => {
      const old = current.days.find((od) => od.day === d.day);
      return { ...d, image_url: d.image_url ?? old?.image_url ?? null };
    });

    // El modelo devuelve el itinerario entero reescrito, así que las marcas de
    // verificación del original se pierden aunque el día no haya cambiado. Sin
    // esto, editar un viaje borraría silenciosamente todos los sellos de
    // "verificado" — y un sello que desaparece daña más la confianza que uno
    // que nunca estuvo. Volvemos a cruzar contra Places (no-op sin key).
    const editLang = ((profile as { language?: string } | null)?.language ?? "")
      .toLowerCase()
      .slice(0, 2);
    const verificationSummary = await verifyItineraryPlaces(
      itineraryOnly as unknown as ParsedItinerary,
      trip.destination,
      // El prompt de edición de arriba es español fijo, así que ese es el
      // idioma real del itinerario cuando el perfil no dice otra cosa.
      editLang || "es",
    );
    if (verificationSummary) {
      (itineraryOnly as unknown as ParsedItinerary).verification_summary = verificationSummary;
    }

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
