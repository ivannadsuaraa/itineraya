import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
};
type Day = {
  day: number;
  title: string;
  activities: Activity[];
};

interface Props {
  destination: string;
  days: Day[];
  tripId: string;
}

type Geo = { lat: number; lng: number };
type Pin = {
  geo: Geo;
  day: number;
  dayTitle: string;
  index: number; // activity order within day (1-based)
  activity: Activity;
};

// Pastel blue palette (extends gracefully if there are many days)
const DAY_COLORS = [
  "#7CB9E8", // baby blue
  "#5BA4D8", // sky
  "#3B8FCC", // cobalt soft
  "#A7D3F0", // powder
  "#4F8FBF", // steel blue
  "#8FC1E3", // light denim
  "#2E78B5", // deep ocean
  "#BFE0F5", // mist
  "#6BAAD4", // cornflower
  "#9CC7E6", // hydrangea
];

const GEO_CACHE_KEY = (tripId: string) => `itineraya:geo:${tripId}`;

async function geocode(query: string): Promise<Geo | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { "Accept-Language": "es" } },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function FitBounds({ pins }: { pins: Pin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.geo.lat, p.geo.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
  }, [pins, map]);
  return null;
}

function makeIcon(color: string, label: string | number): L.DivIcon {
  return L.divIcon({
    className: "itineraya-marker",
    html: `<div style="
      width:34px;height:34px;border-radius:9999px;
      background:${color};
      border:3px solid #ffffff;
      box-shadow:0 4px 12px rgba(30,107,154,0.35), 0 0 0 1px rgba(30,107,154,0.15);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:13px;
      font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
      letter-spacing:-0.02em;
      transition:transform .15s ease;
    " onmouseover="this.style.transform='scale(1.12)'" onmouseout="this.style.transform='scale(1)'">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

export function TripMap({ destination, days, tripId }: Props) {
  const { t } = useTranslation();
  const [pins, setPins] = useState<Pin[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [center, setCenter] = useState<Geo | null>(null);
  const cancelled = useRef(false);

  const tasks = useMemo(() => {
    return days.flatMap((d) =>
      d.activities.map((a, idx) => ({
        day: d.day,
        dayTitle: d.title,
        index: idx + 1,
        activity: a,
      })),
    );
  }, [days]);

  useEffect(() => {
    cancelled.current = false;
    setProgress({ done: 0, total: tasks.length });
    setPins([]);

    let cache: Record<string, Geo> = {};
    try {
      const raw = localStorage.getItem(GEO_CACHE_KEY(tripId));
      if (raw) cache = JSON.parse(raw) as Record<string, Geo>;
    } catch {
      // ignore
    }

    const collected: Pin[] = [];
    const pushPin = (
      g: Geo,
      item: (typeof tasks)[number],
    ) => {
      collected.push({
        geo: g,
        day: item.day,
        dayTitle: item.dayTitle,
        index: item.index,
        activity: item.activity,
      });
      setPins([...collected]);
    };

    // Track how many pins already exist at each lat/lng so we can spread
    // overlapping activity markers in a small spiral. Without this, several
    // activities that geocode to the same city center collapse into a single
    // visible marker per day.
    const occupancy = new Map<string, number>();
    const spread = (g: Geo): Geo => {
      const key = `${g.lat.toFixed(4)}|${g.lng.toFixed(4)}`;
      const n = occupancy.get(key) ?? 0;
      occupancy.set(key, n + 1);
      if (n === 0) return g;
      // ~12m per 0.0001deg lat; spiral with growing radius
      const angle = n * 2.39996; // golden angle
      const r = 0.00045 * Math.sqrt(n);
      return { lat: g.lat + r * Math.cos(angle), lng: g.lng + r * Math.sin(angle) };
    };

    const pushUnique = (g: Geo, item: (typeof tasks)[number]) => pushPin(spread(g), item);

    (async () => {
      // 1. Resolve destination + flush cached pins instantly (no waiting)
      const destGeo = cache["__dest__"] ?? (await geocode(destination));
      if (cancelled.current) return;
      if (destGeo) {
        cache["__dest__"] = destGeo;
        setCenter(destGeo);
      }

      const pending: typeof tasks = [];
      for (const item of tasks) {
        const key = `${item.activity.place || item.activity.title}|${destination}`;
        const cached = cache[key];
        if (cached) {
          pushUnique(cached, item);
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
        } else {
          pending.push(item);
        }
      }

      // 2. Fetch missing geocodes with a small concurrency window so the UI
      //    keeps updating progressively without blocking.
      const CONCURRENCY = 3;
      let cursor = 0;
      const worker = async () => {
        while (!cancelled.current && cursor < pending.length) {
          const i = cursor++;
          const item = pending[i];
          const key = `${item.activity.place || item.activity.title}|${destination}`;
          // Try the most specific query first, fall back to title + destination
          const specific = `${item.activity.place || item.activity.title}, ${destination}`;
          let g = await geocode(specific);
          if (!g && item.activity.place && item.activity.title && item.activity.place !== item.activity.title) {
            g = await geocode(`${item.activity.title}, ${destination}`);
          }
          if (!g) {
            // fall back to destination center so the activity is still represented
            g = destGeo ?? null;
          }
          if (cancelled.current) return;
          if (g) {
            cache[key] = g;
            pushUnique(g, item);
          }
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
          // small breather to stay polite with Nominatim
          await new Promise((r) => setTimeout(r, 300));
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, Math.max(pending.length, 1)) }, worker),
      );

      try {
        localStorage.setItem(GEO_CACHE_KEY(tripId), JSON.stringify(cache));
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [tasks, destination, tripId]);

  const fallbackCenter: Geo = center ?? { lat: 40.4168, lng: -3.7038 };
  const loading = progress.total > 0 && progress.done < progress.total;

  return (
    <div className="overflow-hidden rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60">
      <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
        <div>
          <h3 className="font-display text-base font-bold text-sky-900">{t("trip.mapTitle")}</h3>
          <p className="text-xs text-sky-600">
            {loading
              ? t("trip.mapLoading", { done: progress.done, total: progress.total })
              : t("trip.mapReady", { count: pins.length })}
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-sky-500" />}
      </div>

      <div style={{ height: "70vh", minHeight: 480 }} className="relative">
        <MapContainer
          center={[fallbackCenter.lat, fallbackCenter.lng]}
          zoom={12}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%", background: "#EAF3FA" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          {pins.map((p, i) => {
            const color = DAY_COLORS[(p.day - 1) % DAY_COLORS.length];
            const q = encodeURIComponent(`${p.activity.place || p.activity.title}, ${destination}`);
            return (
              <Marker key={i} position={[p.geo.lat, p.geo.lng]} icon={makeIcon(color, p.index)}>
                <Popup>
                  <div className="min-w-[210px]">
                    <div
                      className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {t("trip.dayLabel", { n: p.day })} · {p.dayTitle}
                    </div>
                    <div className="font-bold text-sky-900">
                      {p.activity.emoji ?? "📍"} {p.activity.title}
                    </div>
                    {p.activity.place && (
                      <div className="text-xs text-sky-700">{p.activity.place}</div>
                    )}
                    <div className="mt-1 text-xs font-semibold text-[#1E6B9A]">{p.activity.time}</div>
                    <div className="mt-1 text-xs text-sky-700">{p.activity.description}</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-[#1E6B9A] hover:underline"
                    >
                      {t("trip.maps")} →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          <FitBounds pins={pins} />
        </MapContainer>

        {/* Floating legend */}
        {days.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] max-w-[60%]">
            <div className="pointer-events-auto rounded-2xl bg-white/90 px-3 py-2 shadow-lg ring-1 ring-sky-100 backdrop-blur">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                {t("trip.mapTitle")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {days.map((d) => (
                  <div
                    key={d.day}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-50/80 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                      style={{ background: DAY_COLORS[(d.day - 1) % DAY_COLORS.length] }}
                    />
                    {t("trip.dayLabel", { n: d.day })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
