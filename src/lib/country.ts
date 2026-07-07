// Datos de país vía REST Countries v5 (api.restcountries.com) — v3.1
// (restcountries.com, sin auth) quedó deprecada; v5 requiere Bearer token,
// de ahí VITE_RESTCOUNTRIES_API_KEY. La key es pública (prefijo VITE_) igual
// que las de Google Maps/OpenWeatherMap: pensada para llamarse desde el navegador.
//
// Los datos de un país no cambian — se cachean en localStorage sin TTL.

export type CountryInfo = {
  flagEmoji: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  languages: string[];
  utcOffsetHours: number | null; // p. ej. 9 para "UTC+09:00"
  cca3: string;
};

const LS_KEY = "itineraya:country:v1";
const memoryCache = new Map<string, CountryInfo | null>();

function normalize(name: string): string {
  return name.toLowerCase().trim();
}

function readStore(): Record<string, CountryInfo | null> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CountryInfo | null>) : {};
  } catch {
    return {};
  }
}

function writeStore(key: string, info: CountryInfo | null) {
  try {
    const store = readStore();
    store[key] = info;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* localStorage lleno o no disponible — la caché en memoria basta */
  }
}

function parseUtcOffset(tz: string | undefined): number | null {
  if (!tz) return null;
  const m = /^UTC([+-])(\d{2}):(\d{2})/.exec(tz);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) + Number(m[3]) / 60);
}

type ApiCountry = {
  flag?: { emoji?: string };
  currencies?: Array<{ code?: string; name?: string; symbol?: string }>;
  languages?: Array<{ name?: string }>;
  timezones?: string[];
  codes?: { alpha_3?: string };
};

async function fetchCountry(name: string): Promise<CountryInfo | null> {
  const key = import.meta.env.VITE_RESTCOUNTRIES_API_KEY as string | undefined;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(name)}` +
        `?response_fields=names.common,flag.emoji,currencies,languages,timezones,codes.alpha_3`,
      { headers: { Authorization: `Bearer ${key}` }, signal: controller.signal },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { objects?: ApiCountry[] } };
    const country = json.data?.objects?.[0];
    if (!country) return null;
    const currency = country.currencies?.[0];
    return {
      flagEmoji: country.flag?.emoji ?? "",
      currencyCode: currency?.code ?? "",
      currencySymbol: currency?.symbol ?? "",
      currencyName: currency?.name ?? "",
      languages: (country.languages ?? []).map((l) => l.name).filter((n): n is string => !!n),
      utcOffsetHours: parseUtcOffset(country.timezones?.[0]),
      cca3: country.codes?.alpha_3 ?? "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Bandera, moneda, idiomas y offset UTC de un país. Cachea indefinidamente. */
export async function getCountryInfo(countryName: string): Promise<CountryInfo | null> {
  const key = normalize(countryName);
  if (!key) return null;

  if (memoryCache.has(key)) return memoryCache.get(key)!;

  const stored = readStore()[key];
  if (stored) {
    memoryCache.set(key, stored);
    return stored;
  }

  const info = await fetchCountry(countryName);
  memoryCache.set(key, info);
  if (info) writeStore(key, info);
  return info;
}

/** Horas de diferencia del país respecto a la hora actual de España (positivo = por delante). */
export function timezoneDiffFromSpain(utcOffsetHours: number | null): number | null {
  if (utcOffsetHours === null) return null;
  const madridOffset = madridUtcOffsetNow();
  return Math.round((utcOffsetHours - madridOffset) * 2) / 2;
}

function madridUtcOffsetNow(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    timeZoneName: "shortOffset",
  }).formatToParts(new Date());
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const m = /GMT([+-]\d+)/.exec(tzPart);
  return m ? Number(m[1]) : 1;
}
