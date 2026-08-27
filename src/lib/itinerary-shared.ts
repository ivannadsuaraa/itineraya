// Piezas compartidas entre la generación autenticada (itinerary.functions.ts)
// y la generación demo pública (demo.functions.ts): schema JSON del itinerario,
// búsqueda de imágenes en Unsplash y parser tolerante del JSON del modelo.
// Solo se importa desde código de servidor.

export function fallbackImage(query: string): string {
  const q = encodeURIComponent(query.split(",")[0].trim() + ",travel");
  const lock = Math.abs([...query].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 1000;
  return `https://loremflickr.com/1200/800/${q}?lock=${lock}`;
}

// ── Identidad del destino ──────────────────────────────────────────────────
// El autocompletado devuelve normalmente solo el nombre principal
// ("Benicàssim"), pero un usuario puede escribir "Benicàssim, Castellón" a
// mano: para buscar fotos nos quedamos con el nombre propio del sitio.
export function destinationName(destination: string): string {
  return destination.split(",")[0].replace(/\s+/g, " ").trim().slice(0, 60);
}

// Unsplash indexa mayoritariamente en ASCII: "Benicàssim" aparece etiquetado
// como "benicassim". Comparamos siempre sobre la forma plegada.
export function foldForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Fallback determinista por destino (espejo servidor de `destinationFallback`
 * en SmartImage.tsx). Solo etiqueta con el nombre del destino: meter en la
 * query palabras como "travel landscape" hacía que loremflickr devolviera
 * paisajes genéricos sin ninguna relación con el sitio.
 */
export function destinationFallbackImage(
  destination: string,
  w = 1600,
  h = 900,
  variant = "",
): string {
  const name = destinationName(destination) || "travel";
  const tags = [foldForMatch(name), variant ? foldForMatch(destinationName(variant)) : "", "travel"]
    .filter(Boolean)
    .join(",");
  const seed = `${name}|${variant}`;
  const lock = Math.abs([...seed].reduce((h2, c) => (h2 * 31 + c.charCodeAt(0)) | 0, 0)) % 1000;
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tags)}?lock=${lock}`;
}

// Dimensiona la imagen en el CDN de Unsplash: fit=crop respeta el encuadre,
// auto=format sirve WebP/AVIF cuando el navegador lo soporta y q=80 equilibra
// peso y calidad. Partimos de urls.raw (sin parámetros de tamaño previos).
export function sizeUnsplashUrl(rawUrl: string, w: number, h: number): string {
  const sep = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${sep}w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

type UnsplashPhoto = {
  urls?: { raw?: string; regular?: string };
  description?: string | null;
  alt_description?: string | null;
  tags?: Array<{ title?: string | null }> | null;
  user?: { location?: string | null } | null;
};

async function searchUnsplash(
  query: string,
  key: string,
  perPage: number,
): Promise<UnsplashPhoto[]> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=${perPage}&orientation=landscape&content_filter=high&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) {
      // 403 = cuota agotada (key demo: 50 req/hora). Queda registrado para
      // que el problema sea visible en los logs de Vercel, no silencioso.
      console.warn(`[unsplash] ${res.status} for "${query}"`);
      return [];
    }
    const data = (await res.json()) as { results?: UnsplashPhoto[] };
    return data.results ?? [];
  } catch (e) {
    console.warn(`[unsplash] request failed for "${query}"`, e);
    return [];
  }
}

function photoRawUrl(p: UnsplashPhoto): string | null {
  return p.urls?.raw ?? p.urls?.regular ?? null;
}

/**
 * ¿La foto habla realmente de este destino? Unsplash puntúa por relevancia y
 * hace OR de los términos: buscar "Benicàssim travel" devuelve, tras las pocas
 * fotos del pueblo, fotos de stock genéricas que solo casan con "travel". Este
 * filtro se queda con las que mencionan el destino en su texto o etiquetas.
 */
function mentionsDestination(p: UnsplashPhoto, foldedName: string, tokens: string[]): boolean {
  const haystack = foldForMatch(
    [
      p.alt_description ?? "",
      p.description ?? "",
      p.user?.location ?? "",
      ...(p.tags ?? []).map((t) => t?.title ?? ""),
    ].join(" | "),
  );
  if (!haystack.trim()) return false;
  if (haystack.includes(foldedName)) return true;
  // Destinos de varias palabras ("San Sebastián", "New York"): basta con que
  // aparezcan todos los términos significativos, aunque no sean contiguos.
  return tokens.length > 0 && tokens.every((t) => haystack.includes(t));
}

/**
 * Devuelve hasta `limit` URLs *raw* de Unsplash que son verificablemente del
 * destino, ya deduplicadas y en orden de relevancia. Vacío si no hay key,
 * si Unsplash falla o si nada casa con el destino — en ese caso quien llama
 * usa `destinationFallbackImage`.
 *
 * Una sola llamada a Unsplash en el caso normal (dos si la primera no da
 * ninguna foto verificada), en vez de una por imagen: la key demo son 50
 * peticiones/hora para toda la app.
 */
export async function destinationPhotoPool(destination: string, limit = 8): Promise<string[]> {
  const key = process.env.UNSPLASH_KEY;
  const name = destinationName(destination);
  if (!key || name.length < 2) return [];

  const folded = foldForMatch(name);
  const tokens = folded.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3);

  // 1º el nombre exacto + "travel": acota a fotografía de viaje y descarta
  //    homónimos (marcas, apellidos, festivales). 2º el nombre a secas, por si
  //    el destino tiene tan poca cobertura que el calificador lo desplaza.
  const queries = [`${name} travel`, name];
  let firstResults: UnsplashPhoto[] = [];

  for (const query of queries) {
    const results = await searchUnsplash(query, key, 30);
    if (results.length === 0) continue;
    if (firstResults.length === 0) firstResults = results;
    const verified = results.filter((p) => mentionsDestination(p, folded, tokens));
    const urls = [...new Set(verified.map(photoRawUrl).filter((u): u is string => !!u))];
    if (urls.length > 0) {
      console.log(`[unsplash] "${query}" → ${urls.length} verified photos of ${name}`);
      return urls.slice(0, limit);
    }
  }

  // Nada verificado: los primeros resultados de la búsqueda por nombre siguen
  // siendo mejor apuesta que una foto aleatoria, pero lo dejamos en el log.
  const loose = [...new Set(firstResults.map(photoRawUrl).filter((u): u is string => !!u))];
  console.warn(
    `[unsplash] no photo verifiably of "${name}" — falling back to ${loose.length > 0 ? "unverified top results" : "loremflickr"}`,
  );
  return loose.slice(0, limit);
}

export async function unsplashImage(query: string, w = 1600, h = 900): Promise<string | null> {
  const key = process.env.UNSPLASH_KEY;
  if (!key) return fallbackImage(query);
  const results = await searchUnsplash(query, key, 1);
  const first = results[0]?.urls;
  if (first?.raw) return sizeUnsplashUrl(first.raw, w, h);
  return first?.regular ?? fallbackImage(query);
}

// Destinos de interior conocidos: sirven para prohibir explícitamente playa,
// mar y actividades costeras en el prompt. Compartido entre la generación
// autenticada y la demo pública.
const INLAND_DESTINATION_NAMES = [
  // Un destino entra aquí solo si NO tiene mar ni playa propia: la regla que
  // dispara ("playa, mar o actividades de costa estrictamente prohibidas") es
  // una prohibición dura, así que una ciudad costera mal listada empeora el
  // itinerario en vez de protegerlo.
  //
  // La comparación es exacta contra el primer segmento del destino, ya plegado
  // sin acentos (ver isInlandDestination + destinationName), y el destino llega
  // escrito en el idioma del usuario. Por eso cada ciudad lista también sus
  // exónimos en los cuatro idiomas de la app: sin ellos "Roma", "Praga",
  // "Londres" o "Florencia" —lo que teclea un usuario español— no casaban con
  // "rome", "prague", "london" ni "florence", y la regla de playa quedaba
  // desactivada justo para el mercado principal.
  // España
  "madrid",
  "toledo",
  "tolède",
  "granada",
  "grenade",
  "sevilla",
  "seville",
  "séville",
  "sevilha",
  "córdoba",
  "cordova",
  "cordoue",
  "salamanca",
  "salamanque",
  "valladolid",
  "zaragoza",
  "saragossa",
  "saragosse",
  "saragoça",
  "pamplona",
  "pampelune",
  "burgos",
  "segovia",
  "ségovie",
  "ávila",
  "mérida",
  "cáceres",
  "león",
  // "santiago" a secas se toma como Santiago de Compostela (interior). Ojo:
  // Santiago de Cuba sí es costera; si eso importa, hay que desambiguar aguas
  // arriba, en el autocompletado.
  "santiago",
  "santiago de compostela",
  // Europa
  "london",
  "londres",
  "paris",
  "prague",
  "praga",
  "vienna",
  "viena",
  "vienne",
  "budapest",
  "berlin",
  "munich",
  "munique",
  "milan",
  "milão",
  "rome",
  "roma",
  "florence",
  "florencia",
  "florença",
  "siena",
  "sienne",
  "verona",
  "bologna",
  "bolonia",
  "bologne",
  "turin",
  "torino",
  "york",
  "oxford",
  "cambridge",
  "bath",
  "moscow",
  "moscú",
  "moscou",
  "kyiv",
  "kiev",
  "warsaw",
  "varsovia",
  "varsovie",
  "varsóvia",
  "krakow",
  "cracovia",
  "cracovie",
  "cracóvia",
  "bucharest",
  "bucarest",
  "bucareste",
  "sofia",
  "belgrade",
  "belgrado",
  "luxembourg",
  "luxemburgo",
  "brussels",
  "bruselas",
  "bruxelles",
  "bruxelas",
  "amsterdam",
  "innsbruck",
  "salzburg",
  "salzburgo",
  "zurich",
  "geneva",
  "ginebra",
  "genève",
  "genebra",
  // Resto del mundo
  "luxor",
  "cairo",
  "el cairo",
  "le caire",
  "jaipur",
  "agra",
  "delhi",
  "new delhi",
  "nueva delhi",
  "kathmandu",
  "katmandú",
  "mexico city",
  "ciudad de méxico",
  "cdmx",
  "guadalajara",
  "quito",
  "bogotá",
  "cusco",
  "cuzco",
  "la paz",
  "santiago de chile",
  "buenos aires",
  "asunción",
  // ── Retiradas a propósito de esta lista, por ser ciudades con mar y playa
  // propias: Copenhague (Amager Strandpark), Estocolmo, Oslo (Huk),
  // Helsinki (Hietaniemi), Reikiavik (Nauthólsvík), Dublín (Sandymount),
  // Edimburgo (Portobello), Venecia (Lido) y Lima (Costa Verde). Prohibirles
  // el mar era un error de hecho; ahora caen en la rama prudente del prompt
  // ("solo si el destino tiene costa de verdad y la temporada lo permite").
];

// Se pliegan los acentos en ambos lados: la lista trae "córdoba"/"asunción" y
// el destino puede llegar escrito de cualquier forma.
const INLAND_DESTINATIONS = new Set(INLAND_DESTINATION_NAMES.map((n) => foldForMatch(n)));

export function isInlandDestination(destination: string): boolean {
  return INLAND_DESTINATIONS.has(foldForMatch(destinationName(destination)).trim());
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

// ── Verificación de lugares ────────────────────────────────────────────────
// Estos tipos viven aquí, junto al resto de la forma del itinerario, para que
// tanto el servidor (place-verification.ts) como la UI (my-trip) hablen del
// mismo contrato sin importarse en círculo.

export type VerificationStatus =
  /** Google Places devolvió un sitio con nombre compatible y cerca del destino. */
  | "verified"
  /** Se buscó y no apareció nada que encajase — el nombre es sospechoso. */
  | "not_found"
  /** No se comprobó: sin key, error de red, tope de búsquedas o timeout.
   *  Un itinerario generado antes de existir esta función no trae el campo,
   *  que es exactamente lo mismo que "unchecked". */
  | "unchecked";

export type PlaceVerification = {
  status: VerificationStatus;
  /** ID estable de Google Places (solo si status === "verified"). */
  place_id?: string;
  /** Nombre tal y como lo devuelve Google, por si difiere del nuestro. */
  matched_name?: string;
  lat?: number;
  lng?: number;
};

export type VerificationSummary = {
  /** Lugares distintos que se llegaron a comprobar de verdad (Places contestó).
   *  `verified + not_found === checked`. */
  checked: number;
  verified: number;
  not_found: number;
  /** Lugares distintos que no se pudieron comprobar: tope de búsquedas,
   *  timeout, red o key rechazada. Quedan fuera de `checked` a propósito —
   *  no saber no es lo mismo que no encontrar. Opcional: los itinerarios
   *  verificados antes de existir este campo no lo traen. */
  unchecked?: number;
  /** ISO — permite saber si un itinerario se verificó y cuándo. */
  checked_at: string;
};

export type ParsedActivity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  url?: string;
  tip?: string;
  /** Lo añade verifyItineraryPlaces() después de parsear; nunca lo escribe el
   *  modelo (el schema de structured outputs no lo incluye). */
  verification?: PlaceVerification;
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
  /** Resultado agregado del cruce con Google Places, si se hizo. */
  verification_summary?: VerificationSummary;
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
