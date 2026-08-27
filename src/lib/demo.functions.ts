// Generación demo pública: itinerario real (mismo modelo y mismas reglas de
// calidad que la generación autenticada) pero sin cuenta. El resultado vive en
// localStorage del navegador y se reclama al registrarse (dashboard.tsx).
//
// Coste acotado: máximo 4 días, rate-limit real por IP + tope global diario,
// ambos persistidos en Supabase (ver check_and_increment_rate_limit en
// supabase/migrations/20260712090000_security_audit_fixes.sql) — no en
// memoria del proceso, que en Vercel se reinicia por cada instancia lambda y
// hacía el límite "6/día por IP" trivialmente eludible bajo auto-scaling.

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  destinationPhotoPool,
  destinationFallbackImage,
  isInlandDestination,
  sizeUnsplashUrl,
  itinerarySchema,
  extractJson,
  type ParsedItinerary,
} from "@/lib/itinerary-shared";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DemoInput = z.object({
  destination: z.string().min(2).max(80),
  nDays: z.number().int().min(2).max(4),
  companion: z.enum(["solo", "pareja", "amigos", "familia"]),
  tripTypes: z.array(z.string().max(20)).max(6),
  language: z.string().optional(),
});

const PER_IP_DAILY = 6;
const GLOBAL_DAILY = 400;

// Never store raw IPs — only a truncated hash, purely as a rate-limit key.
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

// x-forwarded-for's FIRST entry is whatever the client itself claims (an
// attacker can send `X-Forwarded-For: 1.2.3.4` and get a fresh IP — and
// therefore a fresh rate-limit bucket — on every request). Vercel appends
// the real, edge-verified client IP as the LAST hop, and also sets
// x-real-ip directly, so prefer those over the spoofable first entry.
function resolveClientIp(request: Request | null): string {
  const xri = request?.headers.get("x-real-ip");
  if (xri) return xri.trim();
  const xff = request?.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const { data: globalOk, error: globalErr } = await supabaseAdmin.rpc(
    "check_and_increment_rate_limit" as never,
    { p_scope: "demo_global", p_key: "global", p_limit: GLOBAL_DAILY } as never,
  );
  if (globalErr) {
    // Fail closed on a broken rate limiter — better to briefly block the
    // public demo than to silently remove the cost cap on the Anthropic API.
    console.error("[demo] rate limit check failed (global)", globalErr);
    return false;
  }
  if (!globalOk) return false;

  const { data: ipOk, error: ipErr } = await supabaseAdmin.rpc(
    "check_and_increment_rate_limit" as never,
    { p_scope: "demo_ip", p_key: hashIp(ip), p_limit: PER_IP_DAILY } as never,
  );
  if (ipErr) {
    console.error("[demo] rate limit check failed (ip)", ipErr);
    return false;
  }
  return !!ipOk;
}

// Reclamar el viaje demo (generado sin cuenta y guardado en localStorage) al
// registrarse. Antes esto era un INSERT directo a `trips` desde el navegador
// con `status: "ready"`: destino, resumen, títulos, descripciones y
// hero_image_url llegaban tal cual desde localStorage, sin validar longitudes
// ni forma, y el viaje se podía publicar después en el feed público. La misma
// razón por la que createTrip dejó de ser un INSERT desde el cliente.
const ClaimActivity = z.object({
  time: z.string().max(10),
  emoji: z.string().max(8).optional(),
  title: z.string().max(160),
  place: z.string().max(200).optional(),
  description: z.string().max(1200),
  category: z.string().max(20).optional(),
  url: z.string().max(500).optional(),
  tip: z.string().max(600).optional(),
});

const ClaimDemoInput = z.object({
  destination: z.string().trim().min(2).max(120),
  companion: z.string().trim().max(40).nullable(),
  tripTypes: z.array(z.string().max(20)).max(15),
  heroImageUrl: z.string().url().max(600).nullable(),
  itinerary: z.object({
    summary: z.string().max(1200).optional(),
    days: z
      .array(
        z.object({
          day: z.number().int().min(1).max(30),
          title: z.string().max(160),
          subtitle: z.string().max(400).optional(),
          image_url: z.string().max(600).nullable().optional(),
          activities: z.array(ClaimActivity).max(20),
        }),
      )
      .min(1)
      .max(14),
  }),
});

export const claimDemoTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ClaimDemoInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        destination: data.destination,
        companion: data.companion,
        trip_types: data.tripTypes,
        itinerary: data.itinerary,
        hero_image_url: data.heroImageUrl,
        status: "ready",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (!trip) throw new Error("No se pudo guardar el viaje");
    return { id: (trip as { id: string }).id };
  });

export const generateDemoItinerary = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DemoInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

    const request = getRequest();
    const ip = resolveClientIp(request ?? null);
    if (!(await checkRateLimit(ip))) {
      throw new Error(
        "DEMO_LIMIT: Has alcanzado el límite de demos por hoy. Crea una cuenta gratis para generar itinerarios completos.",
      );
    }

    const lang = (data.language ?? "es").toLowerCase().slice(0, 2);
    const languageBlocks: Record<string, string> = {
      es: `All user-visible text must be written in Spanish from Spain. Meal naming: "Desayuno", "Comida" (never "almuerzo"), "Cena"; meal titles start with the meal word ("Comida en …").`,
      en: `All user-visible text must be written in English. Meal titles start with the meal word ("Lunch at …").`,
      fr: `All user-visible text must be written in French. Meal titles start with the meal word ("Déjeuner à …").`,
      pt: `All user-visible text must be written in Portuguese. Meal titles start with the meal word ("Almoço em …").`,
    };
    const languageBlock = languageBlocks[lang] ?? languageBlocks.es;

    const companionMap: Record<string, string> = {
      solo: "a solo traveler",
      pareja: "a couple",
      amigos: "a group of friends",
      familia: "a family with kids",
    };
    const interests = data.tripTypes.length > 0 ? data.tripTypes.join(", ") : "a bit of everything";

    const beachRule = isInlandDestination(data.destination)
      ? `${data.destination} is an inland destination — beach, sea and coastal activities are strictly forbidden.`
      : `Include beach or sea time only if ${data.destination} genuinely has a coastline or a nearby beach, and name the specific real beach. A beach is never the only activity of a day.`;

    const prompt = `You are planning a ${data.nDays}-day trip to ${data.destination} for ${companionMap[data.companion]}. This is their FIRST impression of this product: the itinerary must read as if a knowledgeable friend who actually lives in ${data.destination} wrote it — geographically coherent, time-realistic, and built exclusively on places that really exist.

THE TRAVELER
- Profile: ${companionMap[data.companion]}, first time in ${data.destination}.
- Interests: ${interests}.
- Pace: balanced — 5-6 activities/day, days start around 09:00-09:30.
- Getting around: mixed — walk within a zone, public transport or a short taxi between zones; anything under 1.2 km is on foot. Name a transit line only when you are certain it exists in ${data.destination} and serves those stops.

OUTPUT LANGUAGE
${languageBlock}
Exception: "place" must always hold the venue's real name in its local language, written exactly as it appears on its sign or on Google Maps — never translated, never approximated.

═══ RULE ZERO — ONLY REAL, VERIFIABLE PLACES ═══
This rule outranks everything else below. A day with 4 stops that all exist beats a day with 6 where 2 do not. If honouring this rule means a thinner day, write the thinner day.

THE TEST — apply it to every single "place" before you write it: if the traveler typed this exact name into Google Maps in ${data.destination} right now, would the pin land on this venue? Anything short of a confident yes means you may not write that name.

Absolutely forbidden:
- Inventing a venue name, or reconstructing one you only half-remember.
- Manufacturing an authentic-sounding name by gluing a generic word to local flavour — "Trattoria da Nonna", "Bar Manolo", "Casa del Mar", "Café Central", "Museo del Vino" — unless that exact establishment genuinely exists in ${data.destination}.
- Moving a real venue from another city, region or country into this one, or reusing a name that is famous somewhere else.
- Giving a town or village neighbourhoods, museums, metro lines, rooftop bars or landmarks it does not have. Calibrate to what ${data.destination} really is: a big city has districts, a metro and dozens of museums; a town or village has a handful of real landmarks, a promenade, a church, a market, some beaches or trails and a few well-known places to eat.
- Presenting opening hours, prices or ticket rules as hard fact. Plan around what is typical and phrase it as typical.

THE FALLBACK — use it whenever you are not certain, instead of guessing. Name a real, unmistakable anchor (a street, square, promenade, market, neighbourhood, park or beach) plus the kind of place to look for there, and put the anchor's real name in "place". Example: title "Comida en el paseo marítimo", place "Paseo Marítimo, ${data.destination}", description "una arrocería de las de toda la vida — busca la que tenga la paellera a la vista". This reads as local knowledge, not as a hedge, and it is always better than a plausible name that does not exist.

WHERE THIS BITES HARDEST — restaurants, bars, cafés and small shops are where invented names creep in; hidden gems are the second. Landmarks, museums, markets, parks, squares, beaches and stations are safer, so let them carry the backbone of each day and use the fallback freely for food and nightlife.

BEFORE YOU FINISH — re-read every "place" you wrote and apply the test again. Replace with the fallback any name you cannot vouch for.

VOICE & TONE
Write for THIS traveler: a group of friends gets an energetic voice that knows where the night goes; a family gets practical reassurance (short walking legs, early dinners); a couple gets atmosphere and unhurried evenings; a solo traveler gets confident, no-fluff local detail. Every description must be concrete and checkable ("pide el arroz a banda", "sube al atardecer, cuando la luz da de lleno en la fachada") — never filler like "disfruta del ambiente", "empápate de la cultura local" or "un lugar con mucho encanto".

RULES
1. SCALE — If you genuinely lack real material for ${data.nDays} full days, spend one day on a real, named nearby town, natural park or beach within ~40 km and say how to get there. Never pad with invented stops.
2. GEOGRAPHY — Each day focuses on ONE zone (or two adjacent ones), ordered as a logical walking line or loop: consecutive stops ≤1.2 km apart or directly connected by transit, and the whole day within ~3 km unless transit links the points in under 15 min. Meals stay inside the day's zone. Never cross the destination and come back the same day. Give each day a distinct zone so the trip covers the destination without backtracking.
3. BEACH — ${beachRule}
4. SCHEDULE — Chronological order with realistic durations (museum 1.5–2h, meal 1–1.5h, monument 45–60 min, café 20–30 min) and 15–30 min of slack between stops. Respect typical opening hours and closing days (many small museums and shops close Sunday afternoon or Monday). Meal times follow the local dining customs of ${data.destination}.
5. TRANSPORT — Every activity except the first of each day starts its "description" with a transport line (mode + route + minutes from the previous stop), e.g. "🚶 8 min a pie" | "🚇 Metro L4, 12 min" | "🚌 Bus 24, 15 min". Only name a line or route number if that network genuinely exists in ${data.destination} — in a small town everything is on foot, by local bus or by car. Under 1.2 km is always on foot, never a taxi.
6. FOOD — At every meal name 1–2 signature dishes worth ordering: the specific thing a local would tell a friend to get, and where possible the real speciality of this destination's region, not the cuisine in general. RULE ZERO applies — when unsure of the venue, use the fallback.
7. HIDDEN GEMS — Include at least 2 genuine non-obvious experiences locals love and most tourists miss (a viewpoint without crowds, a market bar, a workshop, a stretch of coast or trail). RULE ZERO applies here with full force — a real, slightly obvious spot beats an invented "secret" one.
8. TIPS — Use the optional "tip" field on 1–2 activities per day for a specific, actionable insider tip (best hour to avoid queues, what exactly to order, which entrance to use, where the best photo is). Never generic advice like "lleva calzado cómodo".
9. LINKS — For "url" build a Google Maps search link: https://www.google.com/maps/search/?api=1&query=VENUE+NAME+CITY (spaces as +). When you used the fallback, link the anchor place instead. Never invent URLs; omit "url" when unsure of the venue.
10. EVENTS — Mention a festival, fair or public holiday only if it is a well-known recurring event you are confident really takes place in ${data.destination}. Never invent events or their dates.
11. VOLUME & ARC — Exactly ${data.nDays} days, 5–6 activities each. Day 1 ends with an easy "first wow" (a viewpoint, square or waterfront that makes them feel they have arrived); the final evening closes with a memorable farewell moment.

FIELD GUIDE
- summary: 2 sentences, second person, evocative and specific to THIS trip (destination + their interests) — the first thing they read.
- title (day): short and evocative, anchored on the real name of the day's zone, neighbourhood or landmark (e.g. "Voramar y el paseo de las villas"), never "Día 2". subtitle: one sentence recapping the day's arc.
- image_query: 2–3 English words for a photo of the day's area, always including the real place name (e.g. "benicassim beach promenade").
- time: "HH:MM" 24h. emoji: exactly one emoji. title (activity): 3–6 words. description: 1–2 lines. place: the exact real name (or the real anchor, when using the fallback). tip: only when genuinely useful.`;

    const t0 = Date.now();
    console.log(`[demo] generation start — ${data.destination}, ${data.nDays} days, ip ${ip}`);
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 8000,
        system:
          "You are an expert travel planner. You create geographically coherent, time-realistic itineraries built around real venues, and you respond with a single JSON object that follows the provided schema exactly.",
        output_config: { format: { type: "json_schema", schema: itinerarySchema } },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    console.log(`[demo] generation end — ${Date.now() - t0}ms — status ${aiRes.status}`);

    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
      const text = await aiRes.text();
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

    const parsed = extractJson<ParsedItinerary>(content);
    if (!parsed.days || parsed.days.length === 0)
      throw new Error("El modelo no devolvió ningún día de itinerario. Vuelve a intentarlo.");

    // Un único pool de fotos verificadas del destino para la cabecera y los
    // días. Antes cada imagen era su propia búsqueda ("<destino> travel
    // landscape", "<image_query> <destino>"): Unsplash hace OR de los
    // términos, así que en destinos poco fotografiados los calificativos
    // ganaban al topónimo y salía la playa de otro país en la cabecera.
    const photos = await destinationPhotoPool(data.destination, parsed.days.length + 1);

    const hero =
      photos.length > 0
        ? sizeUnsplashUrl(photos[0], 2000, 1000)
        : destinationFallbackImage(data.destination, 2000, 1000);

    parsed.days = parsed.days.map((d, i) => ({
      ...d,
      // Una foto distinta por día mientras haya; cuando el pool se agota,
      // fallback etiquetado con el destino en vez de repetir la cabecera.
      image_url:
        i + 1 < photos.length
          ? sizeUnsplashUrl(photos[i + 1], 1400, 620)
          : destinationFallbackImage(data.destination, 1400, 620, d.image_query || d.title),
    }));

    return { itinerary: parsed, hero_image_url: hero };
  });
