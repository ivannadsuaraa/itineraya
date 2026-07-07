// Piezas compartidas entre la generación autenticada (itinerary.functions.ts)
// y la generación demo pública (demo.functions.ts): schema JSON del itinerario,
// búsqueda de imágenes en Unsplash y parser tolerante del JSON del modelo.
// Solo se importa desde código de servidor.

export function fallbackImage(query: string): string {
  const q = encodeURIComponent(query.split(",")[0].trim() + ",travel");
  const lock = Math.abs([...query].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 1000;
  return `https://loremflickr.com/1200/800/${q}?lock=${lock}`;
}

// Dimensiona la imagen en el CDN de Unsplash: fit=crop respeta el encuadre,
// auto=format sirve WebP/AVIF cuando el navegador lo soporta y q=80 equilibra
// peso y calidad. Partimos de urls.raw (sin parámetros de tamaño previos).
export function sizeUnsplashUrl(rawUrl: string, w: number, h: number): string {
  const sep = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${sep}w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

export async function unsplashImage(query: string, w = 1600, h = 900): Promise<string | null> {
  const key = process.env.UNSPLASH_KEY;
  if (!key) return fallbackImage(query);
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) {
      // 403 = cuota agotada (key demo: 50 req/hora). Queda registrado para
      // que el problema sea visible en los logs de Vercel, no silencioso.
      console.warn(`[unsplash] ${res.status} for "${query}" — falling back to loremflickr`);
      return fallbackImage(query);
    }
    const data = (await res.json()) as {
      results?: Array<{ urls?: { raw?: string; regular?: string } }>;
    };
    const first = data.results?.[0]?.urls;
    if (first?.raw) return sizeUnsplashUrl(first.raw, w, h);
    return first?.regular ?? fallbackImage(query);
  } catch {
    return fallbackImage(query);
  }
}

// JSON schema enforced server-side via structured outputs (output_config.format).
// Guarantees valid, schema-conformant JSON — extractJson below remains only as a safety net.
export const itinerarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "days"],
  properties: {
    summary: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "title", "subtitle", "image_query", "activities"],
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          subtitle: { type: "string" },
          image_query: { type: "string" },
          activities: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["time", "emoji", "title", "place", "description", "category"],
              properties: {
                time: { type: "string", description: "24h HH:MM" },
                emoji: { type: "string", description: "exactly one emoji" },
                title: { type: "string" },
                place: { type: "string" },
                description: { type: "string" },
                category: {
                  type: "string",
                  enum: [
                    "hotel",
                    "restaurant",
                    "activity",
                    "transport",
                    "sight",
                    "nightlife",
                    "shopping",
                    "other",
                  ],
                },
                url: { type: "string" },
                tip: {
                  type: "string",
                  description:
                    "optional insider tip: best time to go, what to order, how to skip the line",
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export type ParsedActivity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  url?: string;
  tip?: string;
};

export type ParsedItinerary = {
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

export function extractJson<T>(raw: string): T {
  // 1. Strip markdown fences
  let text = raw
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // 2. Extract the outermost JSON object (first { … last })
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  // 3. Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    /* continue to repair */
  }

  // 4. Repair common LLM JSON mistakes
  const repaired = text
    // trailing commas before ] or }
    .replace(/,\s*([}\]])/g, "$1")
    // unescaped newlines inside string values
    .replace(/("(?:[^"\\]|\\.)*")|(\n)/g, (m, str) => (str ? str : " "))
    // single-quoted keys/values → double-quoted (careful: only bare single quotes)
    .replace(/'([^']+)'(\s*:)/g, '"$1"$2')
    .replace(/:\s*'([^']*)'/g, ': "$1"');

  try {
    return JSON.parse(repaired) as T;
  } catch {
    /* continue to truncation recovery */
  }

  // 5. Truncation recovery: close any open arrays/objects and retry
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of repaired) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
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
