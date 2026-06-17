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
  activity: Activity;
};

const DAY_COLORS = [
  "#1E6B9A", "#3B92C2", "#7BB3D6", "#F4A261",
  "#E76F51", "#2A9D8F", "#8E7DBE", "#D4A5A5",
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
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [pins, map]);
  return null;
}

function makeIcon(color: string, dayNum: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);color:white;font-weight:700;font-size:13px;font-family:system-ui">${dayNum}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
}

export function TripMap({ destination, days, tripId }: Props) {
  const { t } = useTranslation();
  const [pins, setPins] = useState<Pin[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [center, setCenter] = useState<Geo | null>(null);
  const cancelled = useRef(false);

  const allActivities = useMemo(() => {
    return days.flatMap((d) =>
      d.activities.map((a) => ({ day: d.day, dayTitle: d.title, activity: a })),
    );
  }, [days]);

  useEffect(() => {
    cancelled.current = false;
    setProgress({ done: 0, total: allActivities.length });

    let cache: Record<string, Geo> = {};
    try {
      const raw = localStorage.getItem(GEO_CACHE_KEY(tripId));
      if (raw) cache = JSON.parse(raw) as Record<string, Geo>;
    } catch {
      // ignore
    }

    (async () => {
      const destGeo = cache["__dest__"] ?? (await geocode(destination));
      if (destGeo) {
        cache["__dest__"] = destGeo;
        setCenter(destGeo);
      }

      const collected: Pin[] = [];
      for (const item of allActivities) {
        if (cancelled.current) return;
        const key = `${item.activity.place || item.activity.title}|${destination}`;
        let g = cache[key];
        if (!g) {
          const q = `${item.activity.place || item.activity.title}, ${destination}`;
          const result = await geocode(q);
          if (result) {
            g = result;
            cache[key] = result;
          }
          // throttle to be polite with Nominatim (1 req/s)
          await new Promise((r) => setTimeout(r, 1100));
        }
        if (g) {
          collected.push({
            geo: g,
            day: item.day,
            dayTitle: item.dayTitle,
            activity: item.activity,
          });
          setPins([...collected]);
        }
        setProgress((p) => ({ done: p.done + 1, total: p.total }));
      }

      try {
        localStorage.setItem(GEO_CACHE_KEY(tripId), JSON.stringify(cache));
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, [allActivities, destination, tripId]);

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

      <div style={{ height: "70vh", minHeight: 480 }}>
        <MapContainer
          center={[fallbackCenter.lat, fallbackCenter.lng]}
          zoom={12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((p, i) => {
            const color = DAY_COLORS[(p.day - 1) % DAY_COLORS.length];
            const q = encodeURIComponent(`${p.activity.place || p.activity.title}, ${destination}`);
            return (
              <Marker key={i} position={[p.geo.lat, p.geo.lng]} icon={makeIcon(color, p.day)}>
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
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
      </div>

      <div className="flex flex-wrap gap-2 border-t border-sky-100 px-4 py-3">
        {days.map((d) => (
          <div key={d.day} className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: DAY_COLORS[(d.day - 1) % DAY_COLORS.length] }}
            />
            {t("trip.dayLabel", { n: d.day })}
          </div>
        ))}
      </div>
    </div>
  );
}
