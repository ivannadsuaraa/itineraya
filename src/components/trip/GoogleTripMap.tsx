/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  loadGoogleMapsCoreLibraries,
  onGoogleMapsAuthFailure,
  reportGoogleMapsFailure,
} from "@/lib/google-maps-loader";

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  url?: string;
};
type Day = { day: number; title: string; activities: Activity[] };

interface Props {
  destination: string;
  days: Day[];
  tripId: string;
  onError?: () => void;
  geo_lat?: number | null;
  geo_lng?: number | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  hotel: "#7C3AED", // purple
  restaurant: "#EF4444", // red
  sight: "#3B82F6", // blue
  activity: "#10B981", // green
  nightlife: "#EC4899", // pink
  transport: "#6B7280", // gray
  shopping: "#F59E0B", // amber
  other: "#1E6B9A", // sky
};

type Geo = { lat: number; lng: number };
type Pin = { geo: Geo; activity: Activity; day: number; dayTitle: string; index: number };

const GEO_CACHE_KEY = (id: string) => `itineraya:geo:${id}`;

// `critical` marks the single, well-formed destination-level geocode — a
// reliable systemic health check. Per-activity geocodes (many per itinerary,
// fired in a loop) are NOT critical: a REQUEST_DENIED on one AI-generated
// place string among dozens doesn't mean Google Maps is broken, and treating
// it as such used to nuke the entire map (Leaflet fallback, session-wide,
// unrecoverable) over a single skippable pin. Those just resolve null and
// fall back to the destination center further down.
async function geocode(
  query: string,
  geocoder: google.maps.Geocoder,
  critical = false,
): Promise<Geo | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        if (status === "REQUEST_DENIED") {
          if (critical) {
            reportGoogleMapsFailure();
          } else {
            console.warn(
              `[GoogleTripMap] Geocode denied for "${query}" — skipping this pin only, not treated as a global failure.`,
            );
          }
        }
        resolve(null);
      }
    });
  });
}

function pinSvg(color: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
    <path d="M18 0C8 0 0 8 0 18c0 13 18 28 18 28s18-15 18-28C36 8 28 0 18 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="18" cy="18" r="11" fill="#fff"/>
    <text x="18" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${color}">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function GoogleTripMap({ destination, days, tripId, onError, geo_lat, geo_lng }: Props) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const cancelled = useRef(false);
  const initialCenter =
    geo_lat && geo_lng ? { lat: geo_lat, lng: geo_lng } : { lat: 40.4168, lng: -3.7038 };

  // Google's auth-failure callback fires asynchronously and can't be caught
  // by a try/catch around the loader promise — listen for it explicitly.
  useEffect(() => {
    return onGoogleMapsAuthFailure(() => onError?.());
  }, [onError]);

  const tasks = useMemo(
    () =>
      days.flatMap((d) =>
        d.activities.map((a, idx) => ({
          day: d.day,
          dayTitle: d.title,
          index: idx + 1,
          activity: a,
        })),
      ),
    [days],
  );

  // init map
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { maps } = await loadGoogleMapsCoreLibraries();
        if (!mounted || !mapRef.current) return;
        mapInstance.current = new maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        infoRef.current = new maps.InfoWindow();
      } catch (err) {
        console.error("[GoogleTripMap] Failed to initialize map:", err);
        onError?.();
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // geocode + place markers
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
    const occupancy = new Map<string, number>();
    const spread = (g: Geo): Geo => {
      const key = `${g.lat.toFixed(4)}|${g.lng.toFixed(4)}`;
      const n = occupancy.get(key) ?? 0;
      occupancy.set(key, n + 1);
      if (n === 0) return g;
      const angle = n * 2.39996;
      const r = 0.00045 * Math.sqrt(n);
      return { lat: g.lat + r * Math.cos(angle), lng: g.lng + r * Math.sin(angle) };
    };
    const collected: Pin[] = [];

    (async () => {
      let geocoder: google.maps.Geocoder;
      try {
        const { geocoding } = await loadGoogleMapsCoreLibraries();
        geocoder = new geocoding.Geocoder();
      } catch (err) {
        console.error("[GoogleTripMap] Failed to load geocoding library:", err);
        onError?.();
        return;
      }
      if (cancelled.current || !mapInstance.current) return;

      const destGeo = cache["__dest__"] ?? (await geocode(destination, geocoder, true));
      if (destGeo) {
        cache["__dest__"] = destGeo;
        mapInstance.current.setCenter(destGeo);
      }

      for (const item of tasks) {
        if (cancelled.current) return;
        const key = `${item.activity.place || item.activity.title}|${destination}`;
        let g: Geo | null = cache[key] ?? null;
        if (!g) {
          const q = `${item.activity.place || item.activity.title}, ${destination}`;
          g = await geocode(q, geocoder);
          if (g) cache[key] = g;
          await new Promise((r) => setTimeout(r, 80));
        }
        if (!g) g = destGeo ?? null;
        if (!g) {
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
          continue;
        }
        const placed = spread(g);
        collected.push({
          geo: placed,
          activity: item.activity,
          day: item.day,
          dayTitle: item.dayTitle,
          index: item.index,
        });
        setPins([...collected]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, destination, tripId]);

  // render markers
  useEffect(() => {
    if (!mapInstance.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (pins.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    pins.forEach((p) => {
      const color = CATEGORY_COLORS[p.activity.category ?? "other"] ?? CATEGORY_COLORS.other;
      const marker = new google.maps.Marker({
        position: p.geo,
        map: mapInstance.current!,
        icon: {
          url: pinSvg(color, String(p.index)),
          scaledSize: new google.maps.Size(36, 46),
          anchor: new google.maps.Point(18, 46),
        },
        title: p.activity.title,
      });
      const q = encodeURIComponent(`${p.activity.place || p.activity.title}, ${destination}`);
      marker.addListener("click", () => {
        infoRef.current?.setContent(
          `<div style="min-width:220px;font-family:system-ui,-apple-system,sans-serif">
            <div style="font-size:10px;text-transform:uppercase;font-weight:700;color:${color};letter-spacing:0.05em">${t("trip.dayLabel", { n: p.day })} · ${escapeHtml(p.dayTitle)}</div>
            <div style="font-weight:700;color:#0c4a6e;margin-top:4px">${escapeHtml(p.activity.emoji ?? "📍")} ${escapeHtml(p.activity.title)}</div>
            ${p.activity.place ? `<div style="font-size:12px;color:#075985">${escapeHtml(p.activity.place)}</div>` : ""}
            <div style="font-size:12px;color:#1E6B9A;font-weight:600;margin-top:2px">${escapeHtml(p.activity.time)}</div>
            <div style="font-size:12px;color:#0369a1;margin-top:4px">${escapeHtml(p.activity.description)}</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#1E6B9A;text-decoration:none">${t("trip.directions", { defaultValue: "Get directions" })} →</a>
          </div>`,
        );
        infoRef.current?.open({ map: mapInstance.current!, anchor: marker });
      });
      markersRef.current.push(marker);
      bounds.extend(p.geo);
    });
    if (!bounds.isEmpty()) mapInstance.current.fitBounds(bounds, 50);
  }, [pins, destination, t]);

  const loading = progress.total > 0 && progress.done < progress.total;
  const categories = Array.from(new Set(pins.map((p) => p.activity.category ?? "other")));

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

      <div className="relative" style={{ height: "70vh", minHeight: 420 }}>
        <div ref={mapRef} className="h-full w-full" />
        {categories.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-3 z-10 rounded-2xl bg-white/95 px-3 py-2 shadow-lg ring-1 ring-sky-100 backdrop-blur">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              {t("trip.categories", { defaultValue: "Categories" })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <div
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-50/80 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                    style={{ background: CATEGORY_COLORS[c] ?? CATEGORY_COLORS.other }}
                  />
                  {t(`trip.category.${c}`, { defaultValue: c })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
