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
// Activación: cualquiera de las keys de resolvePlacesKey() más abajo. Sin
// ninguna, todo esto se salta. Requiere "Places API (New)" habilitada en el
// proyecto de Google Cloud.

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

type MatchResult = { ok: boolean; reason: string };

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
export function matchNames(queried: string, returned: string): MatchResult {
  const q = fold(queried);
  const r = fold(returned);
  if (!q || !r) return { ok: false, reason: "nombre vacío" };
  if (q === r) return { ok: true, reason: "exacto" };
  // Uno contiene al otro: "prado" ⊂ "museo nacional del prado".
  if (q.includes(r) || r.includes(q)) return { ok: true, reason: "inclusión" };

  const qt = significantTokens(queried);
  const rt = significantTokens(returned);
  if (qt.length === 0 || rt.length === 0) {
    return { ok: false, reason: "sin tokens significativos" };
  }

  const rset = new Set(rt);
  const hits = qt.filter((t) => rset.has(t));
  // Dos tercios EXACTOS de los tokens que de verdad identifican el sitio.
  //
  // Ojo con la aritmética: esto era `hits / qt.length >= 0.67`, y 2/3 en coma
  // flotante es 0.6666…, que NO llega a 0.67. Es decir, el caso que el propio
  // comentario decía aceptar —dos de cada tres tokens— se rechazaba siempre.
  // Con enteros no hay epsilon que valga.
  //
  // Con un solo token significativo esto exige el acierto pleno, que es lo que
  // queremos: "Sacromonte" contra "Sacromonte Abbey" ya pasó por la inclusión
  // de arriba, pero "Faro" contra "Bar Pepe" no debe colar por casualidad.
  const ok = hits.length * 3 >= qt.length * 2;
  return {
    ok,
    reason: `${hits.length}/${qt.length} tokens${hits.length ? ` (${hits.join(", ")})` : ""}`,
  };
}

/** Envoltorio booleano. */
export function namesMatch(queried: string, returned: string): boolean {
  return matchNames(queried, returned).ok;
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

/**
 * Key con la que hablar con Places, por orden de preferencia:
 *
 *  1. `GOOGLE_PLACES_KEY` — key server-side dedicada. La preferida: sin
 *     prefijo VITE_ nunca llega al navegador, y al no estar restringida por
 *     referrer funciona desde las funciones de Vercel.
 *  2. `VITE_GOOGLE_MAPS_KEY` — la key de Maps que ya usa el front para el
 *     autocompletado y el mapa del viaje. En Vercel todas las variables del
 *     panel están también en `process.env` dentro de las server functions, así
 *     que se puede reutilizar sin configurar nada nuevo.
 *  3. `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` — mismo fallback
 *     heredado que google-maps-loader.ts, para entornos sin migrar.
 *
 * OJO con 2 y 3: son keys de navegador y lo normal es tenerlas restringidas
 * por referrer HTTP, restricción que una llamada desde el servidor no puede
 * satisfacer — Google responde 403 REQUEST_DENIED. Si pasa eso lo verás en los
 * logs con el aviso de abajo, y la solución es o bien añadir una key
 * server-side en `GOOGLE_PLACES_KEY` (restringida por IP o sin restringir),
 * o bien quitar la restricción por referrer de la key de Maps. Mientras tanto
 * los lugares quedan "unchecked", nunca "not_found": una key mal configurada
 * no puede hacer que el viaje entero se pinte como no confirmado.
 */
function resolvePlacesKey(): string | undefined {
  return (
    process.env.GOOGLE_PLACES_KEY ||
    process.env.VITE_GOOGLE_MAPS_KEY ||
    process.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY ||
    undefined
  );
}

export function isPlaceVerificationEnabled(): boolean {
  return !!resolvePlacesKey();
}

/**
 * Resultado de una búsqueda, distinguiendo dos cosas que NO son lo mismo:
 *
 *  - `ok: true` — Places contestó. `place` es el mejor resultado, o null si de
 *    verdad no hay ninguno. Esto sí es señal sobre el lugar.
 *  - `ok: false` — no pudimos preguntar (red, timeout, key rechazada, cuota).
 *    Esto no dice nada sobre el lugar y debe acabar en "unchecked".
 *
 * Colapsar ambos casos en null haría que una key mal configurada marcase todo
 * el itinerario como "no encontrado", que es justo la mentira que este módulo
 * existe para evitar.
 */
type Lookup = { ok: true; place: PlacesResult | null } | { ok: false; auth: boolean };

type SearchOpts = {
  bias?: [number, number] | null;
  /** Idioma en el que pedimos que Google devuelva los nombres. Ver abajo: es
   *  lo que decide si el filtro de nombres puede llegar a casar algo. */
  lang?: string;
};

async function searchText(textQuery: string, key: string, opts: SearchOpts = {}): Promise<Lookup> {
  const { bias = null, lang } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = { textQuery, maxResultCount: 1 };
    // ESTO es lo que hacía que no se verificara nada. Sin languageCode,
    // Places API (New) responde por defecto en inglés, mientras que el
    // itinerario está escrito en el idioma del viajero. Así que comparábamos
    // "Coliseo" con "Colosseum", "Museos Vaticanos" con "Vatican Museums" y
    // "Basílica de San Pedro" con "St. Peter's Basilica": ningún token en
    // común, cero coincidencias, y todo el viaje marcado como no encontrado.
    // Pidiendo los nombres en el idioma del itinerario, Google devuelve
    // exactamente la forma que el modelo escribió.
    if (lang) body.languageCode = lang;
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
      // 401/403 = key rechazada (restringida por referrer, o Places API (New)
      // sin habilitar); 429 = cuota agotada. Todos son problemas de
      // configuración que deben verse en los logs de Vercel en vez de
      // degradar en silencio.
      const auth = res.status === 401 || res.status === 403;
      console.warn(`[places] ${res.status} for "${textQuery}"`);
      return { ok: false, auth };
    }
    const data = (await res.json()) as { places?: PlacesResult[] };
    return { ok: true, place: data.places?.[0] ?? null };
  } catch {
    // Aborto por timeout o fallo de red: quien llama lo traduce a "unchecked".
    return { ok: false, auth: false };
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
  /** Idioma en el que está escrito el itinerario. Google devuelve los nombres
   *  en este idioma, que es la única forma de que casen con lo que escribió el
   *  modelo. Omitirlo hace que Places responda en inglés y no verifique casi
   *  nada — pásalo siempre que se sepa. */
  lang?: string,
): Promise<VerificationSummary | null> {
  const key = resolvePlacesKey();
  if (!key) return null;

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  // Se levanta en cuanto Google rechaza la key. A partir de ahí no tiene
  // sentido gastar 4 s de timeout por lugar para recibir el mismo 403: el
  // resto queda "unchecked" de inmediato.
  let keyRejected = false;

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
    const destLookup = await searchText(destination, key, { lang });
    if (!destLookup.ok && destLookup.auth) {
      // La primera llamada ya rebota: no hay nada que verificar y avisamos con
      // la causa más probable para que se arregle en vez de quedarse así.
      console.warn(
        "[places] key rejected by Google (401/403). Si estás usando la key de " +
          "Maps del front, lo normal es que esté restringida por referrer HTTP y " +
          "no valga desde el servidor: define GOOGLE_PLACES_KEY con una key " +
          "server-side, o quita esa restricción. Itinerario sin verificar.",
      );
      return null;
    }
    const destPlace = destLookup.ok ? destLookup.place : null;
    let destCoords: [number, number] | null =
      destPlace?.location?.latitude != null && destPlace.location.longitude != null
        ? [destPlace.location.latitude, destPlace.location.longitude]
        : null;

    // El ancla manda sobre TODO el filtro de distancia, así que si Places nos
    // devuelve otra cosa al buscar el destino (un negocio que se llama igual,
    // un homónimo en otro país) cada lugar del viaje sale a miles de km y el
    // itinerario entero se marca como no encontrado. Comprobamos que el ancla
    // se parece al destino pedido y, si no, preferimos quedarnos sin filtro de
    // distancia antes que rechazarlo todo: quien de verdad caza invenciones es
    // el filtro de nombres; la distancia solo desempata homónimos.
    const destName = destPlace?.displayName?.text ?? "";
    if (destCoords && destName && !namesMatch(destination, destName)) {
      console.warn(
        `[places] ancla dudosa para "${destination}": Places devolvió "${destName}" ` +
          `(${destPlace?.formattedAddress ?? "sin dirección"}). Se desactiva el filtro de distancia.`,
      );
      destCoords = null;
    }
    console.log(
      `[places] destino "${destination}" → ${destName || "sin resultado"} ` +
        `${destCoords ? `@ ${destCoords[0].toFixed(4)},${destCoords[1].toFixed(4)}` : "(sin ancla: filtro de distancia desactivado)"}` +
        ` | idioma=${lang ?? "por defecto"}`,
    );

    const toCheck = unique.slice(0, MAX_LOOKUPS_PER_ITINERARY);
    if (unique.length > toCheck.length) {
      console.warn(
        `[places] itinerary has ${unique.length} unique places, checking first ${toCheck.length}`,
      );
    }

    let verified = 0;
    let notFound = 0;
    let checked = 0;
    let unchecked = 0;

    await mapWithConcurrency(toCheck, CONCURRENCY, async ({ name, acts }) => {
      if (keyRejected || Date.now() > deadline) {
        unchecked++;
        for (const a of acts) a.verification = { status: "unchecked" };
        return;
      }

      const lookup = await searchText(`${name}, ${destination}`, key, { bias: destCoords, lang });

      // No pudimos preguntar: eso no es información sobre el lugar. Queda
      // "unchecked" y no cuenta como comprobado ni como no encontrado.
      if (!lookup.ok) {
        if (lookup.auth) keyRejected = true;
        unchecked++;
        for (const a of acts) a.verification = { status: "unchecked" };
        return;
      }

      const result = lookup.place;
      checked++;

      const returnedName = result?.displayName?.text ?? "";
      const lat = result?.location?.latitude;
      const lng = result?.location?.longitude;

      const match: MatchResult =
        result && returnedName
          ? matchNames(name, returnedName)
          : { ok: false, reason: "sin resultados" };
      const distanceKm =
        destCoords && lat != null && lng != null ? haversineKm(destCoords, [lat, lng]) : null;
      const distanceOk = distanceKm == null ? true : distanceKm <= MAX_DISTANCE_KM;

      // Una línea por búsqueda con lo que Google devolvió y, si se descarta,
      // por qué exactamente. Es lo que permite distinguir de un vistazo "el
      // modelo se lo inventó" de "el filtro está mal calibrado", que desde
      // fuera se ven igual.
      const where = distanceKm == null ? "" : ` a ${distanceKm.toFixed(1)} km`;
      const verdict = !result
        ? "✗ sin resultados"
        : !match.ok
          ? `✗ nombre no casa [${match.reason}]`
          : !distanceOk
            ? `✗ demasiado lejos (tope ${MAX_DISTANCE_KM} km)`
            : `✓ ${match.reason}`;
      console.log(
        `[places]   "${name}" → ${result ? `"${returnedName}"${where}` : "—"} ${verdict}` +
          (result?.formattedAddress && !match.ok ? ` | ${result.formattedAddress}` : ""),
      );

      if (result?.id && match.ok && distanceOk) {
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
      unchecked++;
      for (const a of acts) a.verification = { status: "unchecked" };
    }

    // Si no llegamos a comprobar nada, no hay resumen que enseñar: devolver
    // checked: 0 haría que la UI dijese "0 de 0 verificados", que suena peor
    // que no decir nada.
    if (checked === 0) {
      console.warn(`[places] ${destination}: no lookups completed, leaving itinerary unverified`);
      return null;
    }

    console.log(
      `[places] ${destination}: ${verified}/${checked} verified, ${notFound} not found, ${unchecked} unchecked`,
    );

    return {
      checked,
      verified,
      not_found: notFound,
      unchecked,
      checked_at: new Date().toISOString(),
    };
  } catch (e) {
    // Cualquier fallo inesperado deja el itinerario tal cual: la verificación
    // es una mejora de confianza, nunca un motivo para no entregar el viaje.
    console.warn("[places] verification failed, continuing unverified", e);
    return null;
  }
}
