// Generación demo pública: itinerario real (mismo modelo y mismas reglas de
// calidad que la generación autenticada) pero sin cuenta. El resultado vive en
// localStorage del navegador y se reclama al registrarse (dashboard.tsx).
//
// Coste acotado: máximo 4 días, rate-limit best-effort por IP (memoria del
// lambda) y tope global diario por instancia.

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  unsplashImage,
  itinerarySchema,
  extractJson,
  type ParsedItinerary,
} from "@/lib/itinerary-shared";

const DemoInput = z.object({
  destination: z.string().min(2).max(80),
  nDays: z.number().int().min(2).max(4),
  companion: z.enum(["solo", "pareja", "amigos", "familia"]),
  tripTypes: z.array(z.string().max(20)).max(6),
  language: z.string().optional(),
});

// Rate limit en memoria: por instancia de lambda, así que es best-effort — su
// objetivo es acotar el coste ante abuso casual, no ser un WAF.
const ipHits = new Map<string, { day: string; count: number }>();
let globalHits = { day: "", count: 0 };
const PER_IP_DAILY = 6;
const GLOBAL_DAILY = 400;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(ip: string): boolean {
  const day = todayKey();
  if (globalHits.day !== day) globalHits = { day, count: 0 };
  if (globalHits.count >= GLOBAL_DAILY) return false;
  const rec = ipHits.get(ip);
  if (!rec || rec.day !== day) {
    ipHits.set(ip, { day, count: 1 });
    globalHits.count++;
    return true;
  }
  if (rec.count >= PER_IP_DAILY) return false;
  rec.count++;
  globalHits.count++;
  return true;
}

export const generateDemoItinerary = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DemoInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

    const request = getRequest();
    const ip =
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request?.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
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

    const prompt = `You are planning a ${data.nDays}-day trip to ${data.destination} for ${companionMap[data.companion]}. This is their FIRST impression of this product: the itinerary must feel like a knowledgeable friend who lives there planned it personally — geographically coherent, time-realistic, and full of specific local detail.

THE TRAVELER
- Profile: ${companionMap[data.companion]}, first time in ${data.destination}.
- Interests: ${interests}.
- Pace: balanced — 5-6 activities/day, days start around 09:00-09:30.

OUTPUT LANGUAGE
${languageBlock}
Exception: "place" must always hold the venue's real name in its native language.

RULES
1. GEOGRAPHY — Each day focuses on ONE neighborhood/zone (or two adjacent ones), ordered as a logical walking line or loop: consecutive stops ≤1.2 km apart or directly connected by transit. Never cross the city and come back the same day. Give each day a distinct zone.
2. SCHEDULE — Chronological order with realistic durations (museum 1.5–2h, meal 1–1.5h, monument 45–60 min) and 15–30 min of slack between stops. Meal times follow the local dining customs of ${data.destination}.
3. TRANSPORT — Every activity except the first of each day starts its "description" with a transport line (mode + route + minutes), e.g. "🚶 8 min a pie" | "🚇 Metro L4, 12 min". Under 1.2 km is always on foot.
4. REAL PLACES — Only real, well-established venues you are confident exist. If unsure of a specific restaurant, name the dining area or venue type instead — never fabricate a venue name. At every meal, name 1–2 signature dishes worth ordering.
5. HIDDEN GEMS — Include at least 2 genuine non-obvious experiences locals love and most tourists miss.
6. TIPS — Use the optional "tip" field on 1–2 activities per day for a specific, actionable insider tip (best hour to avoid queues, what to order, where the best photo is). Never generic advice.
7. LINKS — For "url" build a Google Maps link: https://www.google.com/maps/search/?api=1&query=VENUE+NAME+CITY (spaces as +). Never invent URLs; omit when unsure.
8. VOLUME — Exactly ${data.nDays} days. Day 1 ends with an easy "first wow" (viewpoint, square or waterfront); the final evening closes with a memorable farewell moment.

FIELD GUIDE
- summary: 2 sentences, second person, evocative and specific to THIS trip.
- title (day): short and evocative, anchored on the real name of the day's neighborhood or zone, never "Day 2". subtitle: one-sentence recap of the day's arc.
- image_query: 2–3 English words for a photo of the day's area.
- time: "HH:MM" 24h. emoji: exactly one emoji. title (activity): 3–6 words. description: 1–2 lines.`;

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

    const [hero, ...dayImages] = await Promise.all([
      unsplashImage(`${data.destination} travel landscape`, 2000, 1000),
      ...parsed.days.map((d) =>
        unsplashImage(`${d.image_query || data.destination} ${data.destination}`, 1400, 620),
      ),
    ]);
    parsed.days = parsed.days.map((d, i) => ({ ...d, image_url: dayImages[i] }));

    return { itinerary: parsed, hero_image_url: hero };
  });
