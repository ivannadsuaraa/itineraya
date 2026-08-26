// Clima actual del destino, vía Open-Meteo (sin key).
export async function fetchWeather(
  destination: string,
): Promise<{ tempC: number; code: number } | null> {
  const cacheKey = `itineraya:weather:${destination.toLowerCase().trim()}:${new Date().toISOString().slice(0, 13)}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as { tempC: number; code: number };
  } catch {
    /* sessionStorage no disponible — seguimos sin caché */
  }
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`,
    ).then((r) => r.json());
    const loc = geo?.results?.[0];
    if (!loc) return null;
    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`,
    ).then((r) => r.json());
    const c = w?.current;
    if (!c) return null;
    const result = { tempC: Math.round(c.temperature_2m), code: c.weather_code };
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      /* ignore */
    }
    return result;
  } catch {
    return null;
  }
}

export function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}
