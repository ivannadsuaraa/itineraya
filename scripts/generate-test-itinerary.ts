// Banco de pruebas de calidad del itinerario.
//
// Construye el prompt REAL de producción (src/lib/itinerary-prompt.ts), lo
// manda a Claude con la misma configuración que usa la app, y opcionalmente
// cruza los lugares resultantes con Google Places. Existe para que "¿ha
// mejorado la calidad?" se pueda contestar mirando un itinerario concreto en
// vez de releyendo el prompt.
//
// Uso:
//   node --experimental-strip-types --import ./scripts/register-alias.mjs \
//     scripts/generate-test-itinerary.ts scripts/scenarios/roma-3d.json
//
// Con --prompt-only imprime el prompt y no llama a la API — útil para revisar
// un cambio del prompt sin gastar tokens, y lo único que funciona sin
// ANTHROPIC_API_KEY.
//
// Variables de entorno:
//   ANTHROPIC_API_KEY  — obligatoria salvo con --prompt-only
//   GOOGLE_PLACES_KEY  — opcional; si está, verifica los lugares generados.
//                        Sirve igual VITE_GOOGLE_MAPS_KEY (ver
//                        resolvePlacesKey en src/lib/place-verification.ts).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { buildItineraryPrompt, type ItineraryPromptInput } from "@/lib/itinerary-prompt";
import { itinerarySchema, extractJson, type ParsedItinerary } from "@/lib/itinerary-shared";
import { verifyItineraryPlaces } from "@/lib/place-verification";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 16000;
const SYSTEM =
  "You are an expert travel planner. You create geographically coherent, time-realistic itineraries built around real venues, and you respond with a single JSON object that follows the provided schema exactly.";

type Scenario = Partial<ItineraryPromptInput> & {
  /** Etiqueta para los ficheros de salida. */
  name: string;
  destination: string;
};

// Mismos defaults que aplica buildItineraryPrompt cuando una columna opcional
// aún no existe en la fila de trips, para que un escenario solo tenga que
// declarar lo que de verdad quiere probar.
function withDefaults(s: Scenario): ItineraryPromptInput {
  return {
    startDate: null,
    endDate: null,
    arrivalTime: null,
    departureTime: null,
    companion: null,
    budget: null,
    tripStyle: null,
    avoid: null,
    tripTypes: null,
    hasAccommodation: null,
    hotelName: null,
    hotelAddress: null,
    hotelLat: null,
    hotelLng: null,
    pace: null,
    transport: null,
    firstVisit: null,
    dietary: null,
    age: null,
    travelerType: null,
    lang: "es",
    historyLine: "no previous trips",
    ...s,
  };
}

async function callClaude(prompt: string, key: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: itinerarySchema } },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    content?: Array<{ text?: string }>;
    stop_reason?: string;
  };
  if (json.stop_reason === "max_tokens") {
    throw new Error("La respuesta se truncó (max_tokens). Reduce los días del escenario.");
  }
  const text = json.content?.[0]?.text;
  if (!text) throw new Error("Respuesta vacía del modelo");
  return text;
}

/** Lista plana de todos los lugares, para revisarlos uno a uno a mano. */
function placeChecklist(itin: ParsedItinerary): string {
  const rows: string[] = [];
  for (const day of itin.days) {
    for (const a of day.activities ?? []) {
      if (!a.place) continue;
      const status = a.verification?.status ?? "unchecked";
      rows.push(`D${day.day}  ${a.time}  [${status.padEnd(9)}]  ${a.place}  — ${a.title}`);
    }
  }
  return rows.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const promptOnly = args.includes("--prompt-only");
  const scenarioPath = args.find((a) => !a.startsWith("--"));
  if (!scenarioPath) {
    console.error("Uso: generate-test-itinerary.ts <escenario.json> [--prompt-only]");
    process.exit(1);
  }

  const scenario = JSON.parse(readFileSync(scenarioPath, "utf-8")) as Scenario;
  const { prompt, dayCount } = buildItineraryPrompt(withDefaults(scenario));

  const outDir = path.join(path.dirname(scenarioPath), "..", "output");
  mkdirSync(outDir, { recursive: true });
  const stem = path.join(outDir, scenario.name);

  writeFileSync(`${stem}.prompt.txt`, prompt);
  console.error(
    `[harness] ${scenario.name}: ${dayCount} días, prompt ${prompt.length} chars → ${stem}.prompt.txt`,
  );

  if (promptOnly) return;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(
      "[harness] Falta ANTHROPIC_API_KEY. Usa --prompt-only para revisar solo el prompt.",
    );
    process.exit(2);
  }

  const t0 = Date.now();
  const raw = await callClaude(prompt, key);
  console.error(`[harness] respuesta en ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const itinerary = extractJson<ParsedItinerary>(raw);
  if (itinerary.days?.length !== dayCount) {
    console.error(
      `[harness] AVISO: se pidieron ${dayCount} días y llegaron ${itinerary.days?.length}`,
    );
  }

  const summary = await verifyItineraryPlaces(itinerary, scenario.destination, scenario.lang);
  if (summary) {
    itinerary.verification_summary = summary;
    console.error(
      `[harness] Places: ${summary.verified}/${summary.checked} verificados, ` +
        `${summary.not_found} no encontrados, ${summary.unchecked ?? 0} sin comprobar`,
    );
  } else {
    console.error(
      "[harness] verificación omitida (sin key de Google, key rechazada o fallo de red)",
    );
  }

  writeFileSync(`${stem}.json`, JSON.stringify(itinerary, null, 2));
  writeFileSync(`${stem}.places.txt`, placeChecklist(itinerary));
  console.error(`[harness] escrito ${stem}.json y ${stem}.places.txt`);
}

main().catch((e) => {
  console.error("[harness] fallo:", e);
  process.exit(1);
});
