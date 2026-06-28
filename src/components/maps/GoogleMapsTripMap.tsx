import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { getCategoryColor, getCategoryEmoji, LIGHT_MAP_STYLE } from "./map-styles";

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  url?: string;
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
  index: number;
  activity: Activity;
};

const GEO_CACHE_KEY = (tripId: string) => `itineraya:geo:${tripId}`;

function createPinSvg(color: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 0C9 0 0 9 0 20c0 16 20 28 20 28s20-12 20-28C40 9 31 0 20 0z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <text x="20" y="17" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700" font-size="13" fill="#fff">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

async function geocodeViaGoogle(query: string): Promise<Geo | null> {
  try {
    const service = new google.maps.Geocoder();
    const result = await service.geocode({ address: query });
    if (result.results.length > 0) {
      const loc = result.results[0].geometry.location;
      return { lat: loc.lat(), lng: loc.lng() };
    }
    return null;
  } catch {
    return null;
  }
}

export function GoogleMapsTripMap({ destination, days, tripId }: Props) {
  const { t } = useTranslation();
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [center] = useState<Geo | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [isMobile, setIsMobile] = useState(false);
  const cancelled = useRef(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  // Geocode all activities
  useEffect(() => {
    if (!isLoaded) return;
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
    const pushPin = (g: Geo, item: (typeof tasks)[number]) => {
      collected.push({
        geo: g,
        day: item.day,
        dayTitle: item.dayTitle,
        index: item.index,
        activity: item.activity,
      });
      setPins([...collected]);
    };

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

    const pushUnique = (g: Geo, item: (typeof tasks)[number]) => pushPin(spread(g), item);

    (async () => {
      let destGeo: Geo | null = cache["__dest__"] ?? null;
      if (!destGeo) destGeo = await geocodeViaGoogle(destination);
      if (cancelled.current) return;
      if (destGeo) {
        cache["__dest__"] = destGeo;
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

      const CONCURRENCY = 3;
      let cursor = 0;
      const worker = async () => {
        while (!cancelled.current && cursor < pending.length) {
          const i = cursor++;
          const item = pending[i];
          const key = `${item.activity.place || item.activity.title}|${destination}`;
          const specific = `${item.activity.place || item.activity.title}, ${destination}`;
          let g = await geocodeViaGoogle(specific);
          if (!g && item.activity.place && item.activity.title && item.activity.place !== item.activity.title) {
            g = await geocodeViaGoogle(`${item.activity.title}, ${destination}`);
          }
          if (!g) {
            g = destGeo ?? null;
          }
          if (cancelled.current) return;
          if (g) {
            cache[key] = g;
            pushUnique(g, item);
          }
          setProgress((p) => ({ done: p.done + 1, total: p.total }));
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
  }, [tasks, destination, tripId, isLoaded]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const fallbackCenter = center ?? { lat: 40.4168, lng: -3.7038 };
    const map = new google.maps.Map(containerRef.current, {
      center: fallbackCenter,
      zoom: 12,
      styles: LIGHT_MAP_STYLE,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      gestureHandling: "greedy",
    });
    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isLoaded, center]);

  // Update markers when pins change
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (pins.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const map = mapRef.current!;

    pins.forEach((p) => {
      const catColor = getCategoryColor(p.activity.category);
      const icon = {
        url: createPinSvg(catColor, String(p.index)),
        scaledSize: new google.maps.Size(34, 40),
        anchor: new google.maps.Point(17, 40),
      };
      const marker = new google.maps.Marker({
        position: { lat: p.geo.lat, lng: p.geo.lng },
        map,
        icon,
        title: p.activity.title,
        animation: google.maps.Animation.DROP,
      });

      bounds.extend({ lat: p.geo.lat, lng: p.geo.lng });

      const iw = infoWindowRef.current;
      marker.addListener("click", () => {
        setSelectedPin(p);
        const q = encodeURIComponent(
          `${p.activity.place || p.activity.title}, ${destination}`,
        );
        const catLabel = p.activity.category
          ? t(`trip.category.${p.activity.category}`, "")
          : "";
        const popupContent = `
          <div style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;min-width:220px;max-width:280px;line-height:1.4;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${catColor};margin-bottom:4px;">
              ${t("trip.dayLabel", { n: p.day })} · ${p.dayTitle}${catLabel ? ` · ${catLabel}` : ""}
            </div>
            <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:2px;">
              ${p.activity.emoji ?? "📍"} ${p.activity.title}
            </div>
            ${p.activity.place ? `<div style="font-size:12px;color:#4a6d8c;margin-bottom:4px;">${p.activity.place}</div>` : ""}
            <div style="font-size:12px;font-weight:600;color:#1E6B9A;margin-bottom:6px;">${p.activity.time}</div>
            <div style="font-size:12px;color:#4a6d8c;margin-bottom:8px;line-height:1.45;">${p.activity.description}</div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:9999px;background:#1E6B9A;color:#fff;font-size:12px;font-weight:600;text-decoration:none;">
              🗺️ Get directions →
            </a>
          </div>
        `;
        if (iw) {
          iw.setContent(popupContent);
          iw.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    if (pins.length > 0 && map) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      const listener = google.maps.event.addListener(map, "idle", () => {
        const zoom = map!.getZoom();
        if (zoom !== undefined && zoom > 16) map!.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
  }, [pins, isLoaded, destination, t]);

  const loading = progress.total > 0 && progress.done < progress.total;
  const allPinsReady = pins.length > 0 && !loading;

  const mapElement = (
    <div className="relative h-full w-full" style={{ minHeight: 400 }}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-sky-50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-300 border-t-[#1E6B9A]" />
            <span className="text-xs text-sky-600">{t("trip.mapLoadingMap")}</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full w-full rounded-2xl"
        style={{ minHeight: 400 }}
      />
      {allPinsReady && days.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[60%]">
          <div className="pointer-events-auto rounded-2xl bg-white/90 px-3 py-2 shadow-lg ring-1 ring-sky-100 backdrop-blur">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
              {t("trip.mapTitle")}
            </div>
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
              {days.map((d) => {
                const dayPins = pins.filter((p) => p.day === d.day);
                if (dayPins.length === 0) return null;
                const repColor = getCategoryColor(dayPins[0].activity.category);
                return (
                  <div
                    key={d.day}
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-50/80 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                      style={{ background: repColor }}
                    />
                    {t("trip.dayLabel", { n: d.day })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow backdrop-blur">
          {t("trip.mapLoading", { done: progress.done, total: progress.total })}
        </div>
      )}
    </div>
  );

  const listElement = (
    <div className="space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
      {days.map((day) => (
        <div key={day.day} className="mb-4">
          <h3 className="sticky top-0 z-10 bg-white/90 py-2 font-display text-base font-bold text-sky-900 backdrop-blur">
            {t("trip.dayLabel", { n: day.day })} · {day.title}
          </h3>
          <div className="space-y-1">
            {day.activities.map((a, i) => {
              const catColor = getCategoryColor(a.category);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-sky-100 bg-white/70 p-3"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: catColor }}
                  >
                    {a.emoji ?? getCategoryEmoji(a.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-sky-900">
                        {a.title}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[#1E6B9A]">
                        {a.time}
                      </span>
                    </div>
                    {a.place && (
                      <p className="text-xs text-sky-600">{a.place}</p>
                    )}
                    <p className="mt-0.5 text-xs text-sky-700 line-clamp-2">
                      {a.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div className="overflow-hidden rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60">
        <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
          <h3 className="font-display text-base font-bold text-sky-900">
            {t("trip.mapTitle")}
          </h3>
          <div className="flex rounded-full bg-sky-50 p-0.5">
            <button
              onClick={() => setMobileView("list")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                mobileView === "list"
                  ? "bg-[#1E6B9A] text-white shadow"
                  : "text-sky-700"
              }`}
            >
              {t("trip.viewCards")}
            </button>
            <button
              onClick={() => setMobileView("map")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                mobileView === "map"
                  ? "bg-[#1E6B9A] text-white shadow"
                  : "text-sky-700"
              }`}
            >
              {t("trip.viewMap")}
            </button>
          </div>
        </div>
        <div style={{ height: "70vh", minHeight: 480 }}>
          {mobileView === "map" ? mapElement : listElement}
        </div>
      </div>
    );
  }

  // Desktop: 50/50 split
  return (
    <div className="overflow-hidden rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60">
      <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
        <div>
          <h3 className="font-display text-base font-bold text-sky-900">
            {t("trip.mapTitle")}
          </h3>
          <p className="text-xs text-sky-600">
            {loading
              ? t("trip.mapLoading", { done: progress.done, total: progress.total })
              : t("trip.mapReady", { count: pins.length })}
          </p>
        </div>
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-[#1E6B9A]" />
        )}
      </div>
      <div className="flex flex-col md:flex-row" style={{ minHeight: 500 }}>
        <div className="w-full md:w-1/2">{mapElement}</div>
        <div className="w-full border-t border-sky-100 md:w-1/2 md:border-t-0 md:border-l">
          <div className="p-4">{listElement}</div>
        </div>
      </div>
    </div>
  );
}