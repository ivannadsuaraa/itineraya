// Vocabulario aeroportuario de Itineraya: números de vuelo, puertas, clase de
// pasajero y distancias. Todo determinista a partir del id del viaje para que
// el mismo viaje muestre siempre el mismo vuelo en cualquier pantalla.

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Número de vuelo ficticio estable: IT-1000 … IT-9999. */
export function flightNumber(tripId: string): string {
  return `IT-${1000 + (hashString(tripId) % 9000)}`;
}

/** Puerta de embarque estable: A1 … F24. */
export function gateCode(tripId: string): string {
  const h = hashString(`gate:${tripId}`);
  const letter = "ABCDEF"[h % 6];
  return `${letter}${1 + (h % 24)}`;
}

/** Asiento estable: 1A … 32F (detalle decorativo del boarding pass). */
export function seatCode(tripId: string): string {
  const h = hashString(`seat:${tripId}`);
  return `${1 + (h % 32)}${"ABCDEF"[h % 6]}`;
}

export type TravelClass = { code: string; label: string };

/** Clase según plan: free → Economy, viajero → Business, explorador → First. */
export function travelClassForPlan(plan: string | null | undefined): TravelClass {
  switch (plan) {
    case "explorador":
      return { code: "F", label: "FIRST CLASS" };
    case "viajero":
      return { code: "J", label: "BUSINESS" };
    default:
      return { code: "Y", label: "ECONOMY" };
  }
}

/** Código IATA ficticio del destino: tres letras estables ("Barcelona" → BCN-ish). */
export function destinationCode(destination: string): string {
  const city = destination.split(",")[0].trim().toUpperCase();
  const letters = city.replace(/[^A-ZÀ-ÿ]/g, "");
  if (letters.length >= 3) {
    // Primera + dos consonantes internas si existen — se parece a un IATA real.
    const inner = letters.slice(1).replace(/[AEIOUÀ-ÿ]/g, "");
    const tail = (inner.length >= 2 ? inner : letters.slice(1)).slice(0, 2);
    return (letters[0] + tail).slice(0, 3).padEnd(3, "X");
  }
  return (letters + "XXX").slice(0, 3);
}

/** Distancia gran círculo en kilómetros. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la = (a[0] * Math.PI) / 180;
  const lb = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/** "41.3874° N · 2.1686° E" — detalle de coordenadas para pantallas de vuelo. */
export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns} · ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export type BoardStatus = "upcoming" | "ongoing" | "done" | "planning";

/** Estado del viaje para el panel de salidas. */
export function boardStatus(
  startDate: string | null,
  endDate: string | null,
  ready: boolean,
): BoardStatus {
  if (!ready || !startDate) return "planning";
  const today = new Date(new Date().toDateString());
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
  if (start > today) return "upcoming";
  if (end >= today) return "ongoing";
  return "done";
}

/** Ciudad "base" plausible por idioma para estimar millas voladas. */
export function homeCoordsForLanguage(lang: string): [number, number] {
  const code = lang.toLowerCase().slice(0, 2);
  if (code === "en") return [51.5074, -0.1278]; // London
  if (code === "fr") return [48.8566, 2.3522]; // Paris
  if (code === "pt") return [38.7223, -9.1393]; // Lisbon
  return [40.4168, -3.7038]; // Madrid
}
