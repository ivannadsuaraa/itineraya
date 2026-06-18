// Seasonal destination inspiration with stable Unsplash photo URLs
export type Inspiration = {
  destination: string;
  country: string;
  image: string;
  tag: string;
};

const W = "?w=800&q=75&auto=format&fit=crop";

const WINTER: Inspiration[] = [
  { destination: "Laponia", country: "Finlandia", image: `https://images.unsplash.com/photo-1551582045-6ec9c11d8697${W}`, tag: "Auroras" },
  { destination: "Marrakech", country: "Marruecos", image: `https://images.unsplash.com/photo-1597212618440-806262de4f6b${W}`, tag: "Sol de invierno" },
  { destination: "Tokio", country: "Japón", image: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf${W}`, tag: "Ciudad" },
  { destination: "Bariloche", country: "Argentina", image: `https://images.unsplash.com/photo-1486890526339-c7f0dba1ad7e${W}`, tag: "Nieve" },
];

const SPRING: Inspiration[] = [
  { destination: "Kioto", country: "Japón", image: `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e${W}`, tag: "Cerezos" },
  { destination: "Ámsterdam", country: "Países Bajos", image: `https://images.unsplash.com/photo-1534351590666-13e3e96c5017${W}`, tag: "Tulipanes" },
  { destination: "Sevilla", country: "España", image: `https://images.unsplash.com/photo-1559682468-a6a29e7d9517${W}`, tag: "Cultura" },
  { destination: "Lisboa", country: "Portugal", image: `https://images.unsplash.com/photo-1555881400-74d7acaacd8b${W}`, tag: "Encanto" },
];

const SUMMER: Inspiration[] = [
  { destination: "Ibiza", country: "España", image: `https://images.unsplash.com/photo-1559628233-100c798642d4${W}`, tag: "Playa" },
  { destination: "Santorini", country: "Grecia", image: `https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff${W}`, tag: "Islas" },
  { destination: "Croacia", country: "Dalmacia", image: `https://images.unsplash.com/photo-1555990538-32220a3aaf57${W}`, tag: "Costa" },
  { destination: "Islandia", country: "Islandia", image: `https://images.unsplash.com/photo-1490080886466-6ea0a78d4f4f${W}`, tag: "Naturaleza" },
];

const AUTUMN: Inspiration[] = [
  { destination: "Nueva York", country: "EE. UU.", image: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9${W}`, tag: "Ciudad" },
  { destination: "Toscana", country: "Italia", image: `https://images.unsplash.com/photo-1523906834658-6e24ef2386f9${W}`, tag: "Vendimia" },
  { destination: "Praga", country: "Chequia", image: `https://images.unsplash.com/photo-1592906209472-a36b1f3782ef${W}`, tag: "Otoño" },
  { destination: "Marruecos", country: "Marruecos", image: `https://images.unsplash.com/photo-1489749798305-4fea3ae63d43${W}`, tag: "Desierto" },
];

export function getSeasonalInspirations(date = new Date()): Inspiration[] {
  const m = date.getMonth(); // 0-11
  if (m === 11 || m <= 1) return WINTER;
  if (m >= 2 && m <= 4) return SPRING;
  if (m >= 5 && m <= 7) return SUMMER;
  return AUTUMN;
}

// Open-Meteo weather (no API key, CORS-enabled)
export async function fetchWeather(destination: string): Promise<{ tempC: number; code: number } | null> {
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
    return { tempC: Math.round(c.temperature_2m), code: c.weather_code };
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
