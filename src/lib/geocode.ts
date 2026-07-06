// Geocodificación compartida vía Nominatim (OpenStreetMap, sin API key).
// Nominatim exige máximo 1 petición/segundo: todas las llamadas pasan por una
// cola secuencial. Los resultados se cachean en memoria y en localStorage para
// que un destino solo se geocodifique una vez por navegador.

import { supabase } from "@/integrations/supabase/client";

export type GeoPoint = [lat: number, lng: number];

const memoryCache = new Map<string, GeoPoint | null>();

const LS_KEY = "itineraya:geocode:v1";
const NOMINATIM_MIN_INTERVAL_MS = 1100;

function normalize(destination: string): string {
  return destination.toLowerCase().trim();
}

function readLocalStore(): Record<string, GeoPoint | null> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, GeoPoint | null>) : {};
  } catch {
    return {};
  }
}

function writeLocalStore(key: string, coords: GeoPoint | null) {
  try {
    const store = readLocalStore();
    store[key] = coords;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* localStorage lleno o no disponible — la caché en memoria basta */
  }
}

// Cola secuencial: cada fetch a Nominatim espera a que termine el anterior
// y deja pasar al menos NOMINATIM_MIN_INTERVAL_MS entre peticiones.
let queueTail: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queueTail.then(async () => {
    const wait = lastRequestAt + NOMINATIM_MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return job();
  });
  queueTail = run.catch(() => {});
  return run;
}

async function fetchNominatim(destination: string): Promise<GeoPoint | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" }, signal: controller.signal },
    );
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results[0]) return null;
    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return [lat, lng];
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Geocodifica un destino. Devuelve null si Nominatim no lo encuentra o falla
 * la red. Cachea el resultado (incluido el null de "no encontrado" solo en
 * memoria, para reintentar en la próxima sesión).
 */
export async function geocodeDestination(destination: string): Promise<GeoPoint | null> {
  const key = normalize(destination);
  if (!key) return null;

  if (memoryCache.has(key)) return memoryCache.get(key)!;

  const stored = readLocalStore()[key];
  if (stored) {
    memoryCache.set(key, stored);
    return stored;
  }

  const coords = await enqueue(() => fetchNominatim(destination));
  memoryCache.set(key, coords);
  if (coords) writeLocalStore(key, coords);
  return coords;
}

/** Pre-carga la caché con coordenadas ya conocidas (p. ej. leídas de la DB). */
export function primeGeocodeCache(destination: string, coords: GeoPoint) {
  memoryCache.set(normalize(destination), coords);
}

/**
 * Geocodifica y persiste las coordenadas en trips.geo_lat/geo_lng.
 * El update es tolerante: si la migración con las columnas geo aún no está
 * aplicada en prod, el error se ignora y las coordenadas siguen valiendo
 * para la sesión actual (quedan en caché).
 */
export async function geocodeAndPersistTrip(
  tripId: string,
  destination: string,
): Promise<GeoPoint | null> {
  const coords = await geocodeDestination(destination);
  if (coords) {
    void supabase
      .from("trips")
      .update({ geo_lat: coords[0], geo_lng: coords[1] } as never)
      .eq("id", tripId)
      .then(({ error }) => {
        if (error)
          console.warn("[geocode] no se pudieron persistir las coordenadas", error.message);
      });
  }
  return coords;
}
