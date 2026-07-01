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

function extractJson<T>(raw: string): T {
  // 1. Strip markdown fences
  let text = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  // 2. Extract the outermost JSON object (first { … last })
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  // 3. Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {/* continue to repair */}

  // 4. Repair common LLM JSON mistakes
  const repaired = text
    // trailing commas before ] or }
    .replace(/,\s*([}\]])/g, "$1")
    // unescaped newlines inside string values
    .replace(/("(?:[^"\\]|\\.)*")|(\n)/g, (m, str) => str ? str : " ")
    // single-quoted keys/values → double-quoted (careful: only bare single quotes)
    .replace(/'([^']+)'(\s*:)/g, '"$1"$2')
    .replace(/:\s*'([^']*)'/g, ': "$1"');

  try {
    return JSON.parse(repaired) as T;
  } catch {/* continue to truncation recovery */}

  // 5. Truncation recovery: close any open arrays/objects and retry
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of repaired) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
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
      ? `ALOJAMIENTO (ANCLA FIJA): "${hotelName ?? "alojamiento"}"${hotelAddress ? ` (${hotelAddress})` : ""}, coords ${hotelLat!.toFixed(5)},${hotelLng!.toFixed(5)}. TODAS las actividades deben estar a ≤3 km. Cada día empieza y termina aquí. Sin actividades en otra ciudad ni otros hoteles.`
      : hasAccommodation
        ? `ALOJAMIENTO: Ya tiene donde alojarse (sin ubicación). Base en el centro. Sin recomendar otros hoteles. Empezar/terminar cada día desde "tu alojamiento".`
        : `ALOJAMIENTO: Sin confirmar. Puedes incluir "check-in" breve el día 1.`;

    const inlandSet = new Set([
      "madrid","toledo","granada","sevilla","córdoba","salamanca","valladolid","zaragoza",
      "pamplona","burgos","segovia","ávila","mérida","cáceres","león","santiago",
      "london","paris","prague","vienna","budapest","berlin","munich","milan","rome",
      "florence","venice","siena","verona","bologna","turin","dublin","edinburgh",
      "york","oxford","cambridge","bath","moscow","kyiv","warsaw","krakow","bucharest",
      "sofia","belgrade","luxembourg","brussels","amsterdam","copenhagen","stockholm",
      "oslo","helsinki","reykjavik","innsbruck","salzburg","zurich","geneva",
      "luxor","cairo","jaipur","agra","delhi","kathmandu",
      "mexico city","guadalajara","quito","bogotá","cusco","la paz","lima",
      "santiago de chile","buenos aires","asunción",
    ]);
    const isCoastal = !inlandSet.has(trip.destination.toLowerCase().trim());

    const prompt = `Eres un planificador de viajes experto. Genera un itinerario personalizado, geográficamente coherente y realista en tiempos.

IDIOMA (PRIORIDAD MÁXIMA — ABSOLUTA)
Idioma de salida: ${langName} (${lang.toUpperCase()}). El 100% del texto visible (resumen, títulos, descripciones, comidas, transporte) debe estar en ${langName}. Cero excepciones.
${lang === "en"
  ? `PROHIBIDO en inglés usar palabras españolas: Desayuno, Comida, Cena, Visita, Paseo, "a pie", "en metro". Usa SOLO inglés: Breakfast, Lunch, Dinner, Visit, Walk, "on foot", "by metro".`
  : `PROHIBIDO usar palabras inglesas: Breakfast, Lunch, Dinner, Visit, Walk, Morning, Afternoon. Usa SOLO español peninsular: Desayuno, Comida, Cena, Visita, Paseo, Mañana, Tarde, Noche.`}
Los nombres propios reales (locales, calles, monumentos) permanecen en su idioma original. El campo "place" DEBE ser el nombre real del local en su idioma nativo.

COHERENCIA GEOGRÁFICA
- ${trip.destination} es una ciudad ${isCoastal ? "costera — puedes incluir actividades de playa si la época lo permite" : "NO costera — PROHIBIDAS actividades de playa, mar o costa (playa, snorkel, kayak, baño en el mar). Regla estricta."}.
- Cada día se centra en UN barrio/zona (o dos adyacentes). Máx. 3 km entre el punto más lejano del día salvo que el metro los conecte en <15 min.
- Ordena las actividades en línea o bucle lógico: paradas consecutivas ≤1.2 km o con transporte directo. Nunca ir al otro extremo de la ciudad y volver el mismo día.
- Las comidas deben estar dentro de la zona del día.
${isCoastal ? "PLAYA: solo si el mes lo permite. Nunca como única actividad; combinar con otros puntos cercanos. Evitar horas de máximo calor (12–16h) en verano.\n" : ""}
HORARIOS Y DURACIÓN
- Duraciones realistas: museo 1.5–2h, comida 1–1.5h, monumento 45–60 min, café 20–30 min. Deja 15–30 min de margen entre paradas.
- Respeta horarios de apertura y horarios de comidas locales.
- Adapta al clima de ${monthName} (frío/lluvia → interior; calor verano → exterior mañana/tarde, interior mediodía).
- ${arrivalLine}
- ${departureLine}

TRANSPORTE (OBLIGATORIO EN CADA ACTIVIDAD)
Cada actividad (salvo la primera del día) debe empezar su "description" con una línea de transporte: modo + ruta + minutos desde la parada anterior.
Formato: "🚶 8 min a pie" | "🚇 Metro L4 dirección X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Tren, 18 min" | "⛴️ Ferry, 20 min".
Walks <1.2 km → siempre a pie. Nunca taxi para <1.2 km.

EVENTOS LOCALES
Si hay festivales, ferias o festivos en ${trip.destination} entre ${trip.start_date ?? "las fechas del viaje"} y ${trip.end_date ?? "las fechas del viaje"}, inclúyelos como actividad con nombre real, lugar y hora. URL al evento oficial en el campo "url".

COMIDAS
${lang === "es"
  ? 'Usa nomenclatura peninsular: Desayuno (07:30–10:00), Comida (13:30–16:00, comida principal — nunca "almuerzo"/"lunch"), Cena (20:30–23:00). El título DEBE empezar con la palabra de comida ("Comida en …", "Cena en …").'
  : 'Use English meal names only: Breakfast / Lunch / Dinner / Snack. Title MUST start with the meal word ("Lunch at …"). Adapt times to local culture.'}
Cada actividad de categoría "restaurant" debe tener un nombre de local real y específico en "place". Incluye "url" con enlace directo al local (web oficial o Google Maps).

ENLACES (campo "url")
Restaurantes y hoteles: enlace directo al local (web propia, Google Maps, TheFork, etc.). Atracciones con web oficial (museos, monumentos): enlace a la página de visita/tickets. Omite el campo si no conoces el enlace exacto.

SALIDA — devuelve ÚNICAMENTE JSON válido, sin markdown:
{
  "summary": "1-2 frases inspiradoras en ${langName}",
  "days": [{
    "day": 1,
    "title": "Título corto zona/tema en ${langName}",
    "subtitle": "1 frase resumen en ${langName}",
    "image_query": "2-3 palabras en inglés",
    "activities": [{
      "time": "HH:MM (24h)",
      "emoji": "un único emoji",
      "title": "3-6 palabras en ${langName}",
      "place": "Nombre real del local en su idioma",
      "description": "1-2 líneas en ${langName}. Si no es la primera parada, EMPIEZA con la línea de transporte.",
      "category": "hotel|restaurant|activity|transport|sight|nightlife|shopping|other",
      "url": "https://enlace-directo (omitir si desconocido)"
    }]
  }]
}

Genera exactamente ${dayCount} días. 5–7 actividades/día (menos en días con llegada/salida ajustada). ${hasAccommodation ? 'NUNCA uses categoría "hotel".' : ""} Solo JSON puro. Todo en ${langName}.`;


    let aiRes: Response | null = null;
for (let attempt = 1; attempt <= 3; attempt++) {
  const t0 = Date.now();
  console.log(`[itinerary] API call start (attempt ${attempt}) — ${dayCount} days, prompt ~${prompt.length} chars`);
  aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 10000,
      system: "You are a travel planner. You return ONLY valid JSON without markdown, explanations or extra text.",
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
    parsed = extractJson<ParsedItin>(content);


    // Hero + all day images in parallel
    const [hero, ...dayImages] = await Promise.all([
      unsplashImage(`${trip.destination} travel landscape`),
      ...parsed.days.map((d) => unsplashImage(`${d.image_query || trip.destination} ${trip.destination}`)),
    ]);
    parsed.days = parsed.days.map((d, i) => ({ ...d, image_url: dayImages[i] }));

    const { error: updateErr } = await supabase
      .from("trips")
      .update({ itinerary: parsed, hero_image_url: hero, status: "ready" })
      .eq("id", data.tripId);
    if (updateErr) throw updateErr;

    return { itinerary: parsed, hero_image_url: hero };
  });
 
