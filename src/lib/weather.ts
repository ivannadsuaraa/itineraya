// Clima vía OpenWeatherMap (tiempo actual + forecast de 5 días/3h). La key es
// pública (prefijo VITE_) igual que la de Google Maps: OpenWeatherMap está
// pensado para uso desde el navegador. Sin key configurada, todo devuelve
// null/[] y la UI simplemente no muestra el bloque de clima.
//
// Cachea por coordenada (redondeada a 2 decimales) en localStorage durante
// CACHE_TTL_MS para no repetir llamadas en cada visita.

export type WeatherNow = {
  temp: number;
  main: string; // "Clear" | "Rain" | ... (grupo OWM)
  icon: string; // código de icono OWM, p. ej. "10d"
};

export type WeatherDay = {
  date: string; // "yyyy-MM-dd"
  tempMin: number;
  tempMax: number;
  main: string;
  icon: string;
  isRain: boolean;
};

type CacheEntry = {
  fetchedAt: number;
  current: WeatherNow | null;
  forecast: WeatherDay[];
};

const LS_KEY = "itineraya:weather:v1";
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3h — ventana de refresco del forecast de OWM

const RAINY_GROUPS = new Set(["Rain", "Drizzle", "Thunderstorm", "Snow"]);

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function readStore(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    return {};
  }
}

function writeStore(key: string, entry: CacheEntry) {
  try {
    const store = readStore();
    store[key] = entry;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* localStorage lleno o no disponible — la caché en memoria basta */
  }
}

const memoryCache = new Map<
  string,
  Promise<{ current: WeatherNow | null; forecast: WeatherDay[] }>
>();

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchOwm(
  lat: number,
  lng: number,
): Promise<{ current: WeatherNow | null; forecast: WeatherDay[] }> {
  const key = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
  if (!key) return { current: null, forecast: [] };

  type OwmCurrent = { weather?: Array<{ main: string; icon: string }>; main?: { temp: number } };
  type OwmForecast = {
    list?: Array<{
      dt_txt?: string;
      main: { temp: number };
      weather?: Array<{ main: string; icon: string }>;
    }>;
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const [current, forecast] = (await Promise.all([
      fetchJson(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`,
        controller.signal,
      ),
      fetchJson(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${key}&units=metric`,
        controller.signal,
      ),
    ])) as [OwmCurrent | null, OwmForecast | null];

    const currentNow: WeatherNow | null =
      current?.weather?.[0] && typeof current.main?.temp === "number"
        ? {
            temp: Math.round(current.main.temp),
            main: current.weather[0].main,
            icon: current.weather[0].icon,
          }
        : null;

    const byDate = new Map<string, { temps: number[]; mains: string[]; icons: string[] }>();
    for (const item of forecast?.list ?? []) {
      const date = String(item.dt_txt ?? "").slice(0, 10);
      if (!date) continue;
      const entry = byDate.get(date) ?? { temps: [], mains: [], icons: [] };
      entry.temps.push(item.main.temp);
      entry.mains.push(item.weather?.[0]?.main ?? "Clouds");
      entry.icons.push(item.weather?.[0]?.icon ?? "02d");
      byDate.set(date, entry);
    }

    const forecastDays: WeatherDay[] = [...byDate.entries()].map(([date, entry]) => {
      // Moda de las condiciones del día (la más repetida entre las franjas de 3h).
      const counts = new Map<string, number>();
      entry.mains.forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1));
      const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const midday = Math.floor(entry.icons.length / 2);
      return {
        date,
        tempMin: Math.round(Math.min(...entry.temps)),
        tempMax: Math.round(Math.max(...entry.temps)),
        main,
        icon: entry.icons[midday] ?? entry.icons[0],
        isRain: entry.mains.some((m) => RAINY_GROUPS.has(m)),
      };
    });

    return { current: currentNow, forecast: forecastDays };
  } finally {
    clearTimeout(timer);
  }
}

/** Clima actual + forecast de 5 días para unas coordenadas. Cachea 3h. */
export function getWeather(
  lat: number,
  lng: number,
): Promise<{ current: WeatherNow | null; forecast: WeatherDay[] }> {
  const key = coordKey(lat, lng);
  const stored = readStore()[key];
  if (stored && Date.now() - stored.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve({ current: stored.current, forecast: stored.forecast });
  }

  const inFlight = memoryCache.get(key);
  if (inFlight) return inFlight;

  const promise = fetchOwm(lat, lng)
    .then((result) => {
      writeStore(key, { fetchedAt: Date.now(), ...result });
      return result;
    })
    .finally(() => memoryCache.delete(key));
  memoryCache.set(key, promise);
  return promise;
}

/** Condición del forecast para una fecha concreta, si cae dentro de los 5 días disponibles. */
export function weatherForDate(forecast: WeatherDay[], date: string): WeatherDay | null {
  return forecast.find((d) => d.date === date) ?? null;
}

export function weatherEmoji(main: string): string {
  switch (main) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "☁️";
    case "Rain":
    case "Drizzle":
      return "🌧️";
    case "Thunderstorm":
      return "⛈️";
    case "Snow":
      return "❄️";
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
    case "Dust":
    case "Sand":
    case "Ash":
      return "🌫️";
    case "Squall":
    case "Tornado":
      return "💨";
    default:
      return "🌤️";
  }
}
