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

    const prompt = `You are planning a ${data.nDays}-day trip to ${data.destination} for ${companionMap[data.companion]}. This is their FIRST impression of this product: the itinerary must read as if a knowledgeable friend who actually lives in ${data.destination} planned it — geographically coherent, time-realistic, and built exclusively on places that really exist.

THE TRAVELER
- Profile: ${companionMap[data.companion]}, first time in ${data.destination}.
- Interests: ${interests}.
- Pace: balanced — 5-6 activities/day, days start around 09:00-09:30.

OUTPUT LANGUAGE
${languageBlock}
Exception: "place" must always hold the venue's real name in its local language, written exactly as it appears on its sign or on Google Maps — never translated, never approximated.

VOICE & TONE
Write for THIS traveler: a group of friends gets an energetic voice that knows where the night goes; a family gets practical reassurance (short walking legs, early dinners); a couple gets atmosphere and unhurried evenings; a solo traveler gets confident, no-fluff local detail. Every description must be concrete and checkable ("pide el arroz a banda", "sube al atardecer, cuando la luz da de lleno en la fachada") — never filler like "disfruta del ambiente", "empápate de la cultura local" or "un lugar con mucho encanto".

RULES
1. REAL PLACES — the rule that matters most. Every "place" must be a real, currently open venue in or around ${data.destination} that you could point at on a map. Before writing each stop ask yourself: would this exact name come up on Google Maps in ${data.destination}? If it is not a clear yes, do NOT write it — replace it with something you are sure of (a real street, square, promenade, beach, market or park) plus the type of venue, e.g. "arrocería en el paseo marítimo". Never invent names for restaurants, bars, hotels, museums or shops; never manufacture a plausible-sounding one by gluing a local word onto "Museo/Casa/Bar de…"; never move a real venue from another city into this one. A day with 4 real stops is far better than a day with 6 where 2 do not exist.
2. SCALE — Calibrate to what ${data.destination} really is. A big city has neighbourhoods, a metro and dozens of museums; a town or village has a handful of real landmarks, a promenade, a church, a market, some beaches or trails and a few well-known places to eat — do not hand it invented neighbourhoods, invented museums or a transit network it does not have. If you genuinely lack real material for ${data.nDays} full days, spend one day on a real, named nearby town, natural park or beach within ~40 km and say how to get there.
3. GEOGRAPHY — Each day focuses on ONE zone (or two adjacent ones), ordered as a logical walking line or loop: consecutive stops ≤1.2 km apart or directly connected by transit, and the whole day within ~3 km unless transit links the points in under 15 min. Meals stay inside the day's zone. Never cross the destination and come back the same day. Give each day a distinct zone so the trip covers the destination without backtracking.
4. BEACH — ${beachRule}
5. SCHEDULE — Chronological order with realistic durations (museum 1.5–2h, meal 1–1.5h, monument 45–60 min, café 20–30 min) and 15–30 min of slack between stops. Respect typical opening hours and closing days (many small museums and shops close Sunday afternoon or Monday). Meal times follow the local dining customs of ${data.destination}.
6. TRANSPORT — Every activity except the first of each day starts its "description" with a transport line (mode + route + minutes from the previous stop), e.g. "🚶 8 min a pie" | "🚇 Metro L4, 12 min" | "🚌 Bus 24, 15 min". Only name a line or route number if that network genuinely exists in ${data.destination} — in a small town everything is on foot, by local bus or by car. Under 1.2 km is always on foot, never a taxi.
7. FOOD — At every meal name 1–2 signature dishes worth ordering: the specific thing a local would tell a friend to get, and where possible the real speciality of this destination's region, not the cuisine in general.
8. HIDDEN GEMS — Include at least 2 genuine non-obvious experiences locals love and most tourists miss (a viewpoint without crowds, a market bar, a workshop, a stretch of coast or trail). They must be real and fit the traveler's interests.
9. TIPS — Use the optional "tip" field on 1–2 activities per day for a specific, actionable insider tip (best hour to avoid queues, what exactly to order, which entrance to use, where the best photo is). Never generic advice like "lleva calzado cómodo".
10. LINKS — For "url" build a Google Maps link: https://www.google.com/maps/search/?api=1&query=VENUE+NAME+CITY (spaces as +). Never invent URLs; omit "url" when unsure of the venue.
11. EVENTS — Mention a festival, fair or public holiday only if it is a well-known recurring event you are confident really takes place in ${data.destination}. Never invent events or their dates.
12. VOLUME & ARC — Exactly ${data.nDays} days, 5–6 activities each. Day 1 ends with an easy "first wow" (a viewpoint, square or waterfront that makes them feel they have arrived); the final evening closes with a memorable farewell moment.

FIELD GUIDE
- summary: 2 sentences, second person, evocative and specific to THIS trip (destination + their interests) — the first thing they read.
- title (day): short and evocative, anchored on the real name of the day's zone, neighbourhood or landmark (e.g. "Voramar y el paseo de las villas"), never "Día 2". subtitle: one sentence recapping the day's arc.
- image_query: 2–3 English words for a photo of the day's area, always including the real place name (e.g. "benicassim beach promenade").
- time: "HH:MM" 24h. emoji: exactly one emoji. title (activity): 3–6 words. description: 1–2 lines. place: the exact real name. tip: only when genuinely useful.`;

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
