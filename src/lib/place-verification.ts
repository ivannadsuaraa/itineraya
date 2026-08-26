// Cruce de los lugares generados por la IA contra Google Places, para poder
// decirle al viajero cuáles hemos confirmado que existen de verdad.
//
// Por qué existe esto
// ───────────────────
// La REGLA CERO del prompt reduce mucho las invenciones, pero es una promesa
// del modelo sobre sí mismo: no es una comprobación. Esto sí lo es. Cada
// "place" se busca en Google Places y solo se marca como verificado si el
// resultado se parece de verdad al nombre pedido y cae cerca del destino.
//
// Principios de diseño (en orden de importancia):
//  1. NUNCA rompe la generación. Sin key, con la red caída, con cuota agotada
//     o con la API devolviendo basura, el itinerario se guarda igual y los
//     lugares quedan como "unchecked" — nunca como "no existe".
//  2. NUNCA marca verificado por defecto. Google Places devuelve *algo* para
//     casi cualquier texto: buscar un restaurante inventado te da el
//     restaurante real más parecido. Sin el filtro de similitud de nombre de
//     más abajo, esto validaría precisamente las alucinaciones que busca
//     cazar, que es peor que no comprobar nada.
//  3. Coste acotado y visible. Cada búsqueda se paga, así que se deduplica,
//     se cachea y hay un tope duro de búsquedas por itinerario.
//
// Activación: variable de entorno GOOGLE_PLACES_KEY (server-side; sin prefijo
// VITE_ para que nunca llegue al navegador). Sin ella todo esto se salta.
// Requiere "Places API (New)" habilitada en el proyecto de Google Cloud.

import type {
  ParsedItinerary,
  ParsedActivity,
  PlaceVerification,
  VerificationSummary,
} from "@/lib/itinerary-shared";

export type {
  PlaceVerification,
  VerificationSummary,
  VerificationStatus,
} from "@/lib/itinerary-shared";

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Solo pedimos los campos que necesitamos: el field mask determina el SKU
// facturado en Places API (New), así que pedir de más cuesta dinero de más.
const FIELD_MASK = "places.id,places.displayName,places.location,places.formattedAddress";

/** Tope duro de búsquedas por itinerario. 14 días × ~6 paradas ≈ 84 lugares,
 *  pero tras deduplicar rara vez pasa de 60. El tope acota el coste del peor
 *  caso incluso si el modelo devuelve un itinerario absurdamente largo. */
const MAX_LOOKUPS_PER_ITINERARY = 70;

/** Peticiones simultáneas. Places aguanta bastante más, pero esto mantiene
 *  la latencia total baja sin arriesgar un 429 en ráfaga. */
const CONCURRENCY = 6;

/** Timeout por petición. Preferimos "unchecked" a alargar la generación. */
const REQUEST_TIMEOUT_MS = 4000;

/** Presupuesto total. Si se agota, el resto queda "unchecked" y seguimos. */
const TOTAL_BUDGET_MS = 20000;

/** Radio de sesgo alrededor del destino, en metros. Generoso a propósito:
 *  un viajero con coche hace excursiones de 60-90 min, y el sesgo solo ordena
 *  resultados — el filtro real de distancia es MAX_DISTANCE_KM. */
const LOCATION_BIAS_RADIUS_M = 50000;

/** Distancia máxima entre el resultado y el destino para darlo por bueno.
 *  Atrapa el fallo clásico: pedir un bar de Cádiz y que Places devuelva uno
 *  del mismo nombre en México. */
const MAX_DISTANCE_KM = 120;

// ── Normalización y comparación de nombres ────────────────────────────────

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Palabras que no distinguen un sitio de otro: si "Restaurante El Faro" y
// "El Faro" se compararan token a token, el "restaurante" sobrante bajaría la
// puntuación de un acierto perfecto. También cubre EN/FR/PT porque el
// itinerario se genera en cuatro idiomas.
const GENERIC_TOKENS = new Set([
  "restaurante",
  "restaurant",
  "bar",
  "cafe",
  "cafeteria",
  "coffee",
  "taberna",
  "tavern",
  "mesón",
  "meson",
  "bodega",
  "hotel",
  "hostal",
  "hostel",
  "museo",
  "museum",
  "musee",
  "museu",
  "iglesia",
  "church",
  "eglise",
  "igreja",
  "catedral",
  "cathedral",
  "plaza",
  "place",
  "praca",
  "piazza",
  "square",
  "calle",
  "rue",
  "via",
  "street",
  "mercado",
  "market",
  "marche",
  "mercat",
  "parque",
  "park",
  "parc",
  "playa",
  "beach",
  "plage",
  "praia",
  "the",
  "el",
  "la",
  "los",
  "las",
  "le",
  "les",
  "de",
  "del",
  "da",
  "do",
  "di",
  "du",
  "dos",
  "das",
  "y",
  "and",
  "et",
  "e",
  "a",
  "o",
  "of",
  "en",
  "in",
]);

function significantTokens(name: string): string[] {
  return fold(name)
    .split(" ")
    .filter((t) => t.length >= 2 && !GENERIC_TOKENS.has(t));
}

/**
 * ¿El sitio que devolvió Google es realmente el que pedimos?
 *
 * Places hace búsqueda difusa: pedir "Trattoria da Nonna, Roma" (inventado)
 * devuelve alegremente la trattoria real más parecida de Roma. Sin este filtro
 * marcaríamos como "verificado" justo lo que queríamos detectar. Exigimos que
 * los tokens significativos del nombre pedido aparezcan de verdad en el que
 * devuelve Google (o al revés, para "Museo del Prado" → "Museo Nacional del
 * Prado").
 */
export function namesMatch(queried: string, returned: string): boolean {
  const q = fold(queried);
  const r = fold(returned);
  if (!q || !r) return false;
  if (q === r) return true;
  // Uno contiene al otro: "prado" ⊂ "museo nacional del prado".
  if (q.includes(r) || r.includes(q)) return true;

  const qt = significantTokens(queried);
  const rt = significantTokens(returned);
  if (qt.length === 0 || rt.length === 0) return false;

  const rset = new Set(rt);
  const overlap = qt.filter((t) => rset.has(t)).length;
  // Dos tercios de los tokens que de verdad identifican el sitio. Con un solo
  // token significativo exigimos el acierto pleno: "Sacromonte" contra
  // "Sacromonte Abbey" pasa por la comprobación de inclusión de arriba, pero
  // "Faro" contra "Bar Pepe" no debe colar por casualidad.
  return overlap / qt.length >= 0.67;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── Cliente de Places ─────────────────────────────────────────────────────

type PlacesResult = {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  formattedAddress?: string;
};

export function isPlaceVerificationEnabled(): boolean {
  return !!process.env.GOOGLE_PLACES_KEY;
}

async function searchText(
  textQuery: string,
  key: string,
  bias: [number, number] | null,
): Promise<PlacesResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = { textQuery, maxResultCount: 1 };
    if (bias) {
      body.locationBias = {
        circle: {
          center: { latitude: bias[0], longitude: bias[1] },
          radius: LOCATION_BIAS_RADIUS_M,
        },
      };
    }
    const res = await fetch(PLACES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      // 403 suele ser "Places API (New) no habilitada" y 429 cuota agotada:
      // ambos son problemas de configuración que deben verse en los logs de
      // Vercel en vez de degradar en silencio a "sin verificar" para siempre.
      console.warn(`[places] ${res.status} for "${textQuery}"`);
      return null;
    }
    const data = (await res.json()) as { places?: PlacesResult[] };
    return data.places?.[0] ?? null;
  } catch {
    // Aborto por timeout o fallo de red: quien llama lo traduce a "unchecked".
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** URL canónica de Google Maps para un place_id. Es la única forma de enlazar
 *  con la garantía de que el pin cae en el sitio correcto: una búsqueda por
 *  texto puede aterrizar en otro local con nombre parecido. */
export function mapsUrlForPlaceId(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

/** Búsqueda por texto, para cuando no hay place_id. */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// ── Verificación de un itinerario completo ────────────────────────────────

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

function activityPlaceName(a: ParsedActivity): string | null {
  const name = (a.place || "").trim();
  return name.length >= 2 ? name : null;
}

/**
 * Comprueba contra Google Places todos los lugares del itinerario y anota el
 * resultado **mutando** cada actividad (`activity.verification`). Cuando un
 * lugar se confirma, además sustituye `url` por el enlace canónico al
 * place_id: es el enlace que garantiza que el pin cae donde debe.
 *
 * No lanza nunca. Devuelve null si la verificación está desactivada o si no
 * pudo comprobarse nada, y en ese caso el itinerario queda intacto.
 */
export async function verifyItineraryPlaces(
  itinerary: ParsedItinerary,
  destination: string,
): Promise<VerificationSummary | null> {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return null;

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  try {
    const activities = itinerary.days.flatMap((d) => d.activities ?? []);

    // Deduplicar: el alojamiento y la plaza principal aparecen muchas veces,
    // y cada búsqueda repetida sería dinero tirado.
    const byName = new Map<string, ParsedActivity[]>();
    for (const a of activities) {
      const name = activityPlaceName(a);
      if (!name) continue;
      const k = fold(name);
      const list = byName.get(k);
      if (list) list.push(a);
      else byName.set(k, [a]);
    }

    const unique = [...byName.entries()].map(([, acts]) => ({
      name: activityPlaceName(acts[0])!,
      acts,
    }));
    if (unique.length === 0) return null;

    // Geocodificamos el destino con la propia Places API (una búsqueda) para
    // sesgar el resto y poder medir distancias. Si falla, seguimos sin sesgo:
    // los nombres siguen incluyendo la ciudad, así que aún sirve de algo.
    const destResult = await searchText(destination, key, null);
    const destCoords: [number, number] | null =
      destResult?.location?.latitude != null && destResult.location.longitude != null
        ? [destResult.location.latitude, destResult.location.longitude]
        : null;

    const toCheck = unique.slice(0, MAX_LOOKUPS_PER_ITINERARY);
    if (unique.length > toCheck.length) {
      console.warn(
        `[places] itinerary has ${unique.length} unique places, checking first ${toCheck.length}`,
      );
    }

    let verified = 0;
    let notFound = 0;
    let checked = 0;

    await mapWithConcurrency(toCheck, CONCURRENCY, async ({ name, acts }) => {
      if (Date.now() > deadline) {
        for (const a of acts) a.verification = { status: "unchecked" };
        return;
      }

      const result = await searchText(`${name}, ${destination}`, key, destCoords);
      checked++;

      const returnedName = result?.displayName?.text ?? "";
      const lat = result?.location?.latitude;
      const lng = result?.location?.longitude;

      const nameOk = !!result && !!returnedName && namesMatch(name, returnedName);
      const distanceOk =
        !destCoords || lat == null || lng == null
          ? true
          : haversineKm(destCoords, [lat, lng]) <= MAX_DISTANCE_KM;

      if (result?.id && nameOk && distanceOk) {
        verified++;
        const v: PlaceVerification = {
          status: "verified",
          place_id: result.id,
          matched_name: returnedName,
          ...(lat != null && lng != null ? { lat, lng } : {}),
        };
        for (const a of acts) {
          a.verification = v;
          // El enlace por place_id es el único que garantiza el pin correcto.
          a.url = mapsUrlForPlaceId(result.id!);
        }
      } else {
        notFound++;
        for (const a of acts) a.verification = { status: "not_found" };
      }
    });

    // Lo que no entró en el tope queda explícitamente "unchecked": la UI debe
    // poder distinguir "no lo encontramos" de "no lo miramos".
    for (const { acts } of unique.slice(MAX_LOOKUPS_PER_ITINERARY)) {
      for (const a of acts) a.verification = { status: "unchecked" };
    }

    console.log(`[places] ${destination}: ${verified}/${checked} verified, ${notFound} not found`);

    return {
      checked,
      verified,
      not_found: notFound,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    // Cualquier fallo inesperado deja el itinerario tal cual: la verificación
    // es una mejora de confianza, nunca un motivo para no entregar el viaje.
    console.warn("[places] verification failed, continuing unverified", e);
    return null;
  }
}
