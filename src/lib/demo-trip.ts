// Viaje demo generado sin cuenta (/demo): vive en localStorage hasta que el
// usuario se registra y dashboard.tsx lo reclama insertándolo en `trips`.

export const DEMO_TRIP_KEY = "itineraya:demo-trip";

export type DemoActivity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  url?: string;
  tip?: string;
};

export type DemoDay = {
  day: number;
  title: string;
  subtitle?: string;
  image_url?: string | null;
  activities: DemoActivity[];
};

export type DemoTrip = {
  destination: string;
  nDays: number;
  companion: string;
  tripTypes: string[];
  itinerary: { summary?: string; days: DemoDay[] };
  hero_image_url: string | null;
  createdAt: string;
};

export function readDemoTrip(): DemoTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_TRIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoTrip;
    if (!parsed?.itinerary?.days?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDemoTrip(): void {
  try {
    localStorage.removeItem(DEMO_TRIP_KEY);
  } catch {
    // ignore
  }
}
