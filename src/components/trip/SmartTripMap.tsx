import { lazy, Suspense, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const GoogleTripMap = lazy(() =>
  import("./GoogleTripMap").then((m) => ({ default: m.GoogleTripMap })),
);
const TripMap = lazy(() => import("./TripMap").then((m) => ({ default: m.TripMap })));

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
  geo_lat?: number | null;
  geo_lng?: number | null;
}

function MapFallback() {
  return (
    <div className="flex h-[70vh] min-h-[420px] items-center justify-center rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60">
      <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
    </div>
  );
}

// Google Maps can fail silently at runtime (bad key, missing referrer allowlist,
// billing disabled) without throwing — it just renders a broken grey tile.
// This wrapper detects that failure via GoogleTripMap's onError and swaps to
// the Leaflet/OpenStreetMap implementation so the map always works.
export function SmartTripMap({ destination, days, tripId, geo_lat, geo_lng }: Props) {
  const { t } = useTranslation();
  const [googleFailed, setGoogleFailed] = useState(false);
  const handleError = useCallback(() => setGoogleFailed(true), []);

  if (googleFailed) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
          {t("trip.mapFallbackNotice", {
            defaultValue:
              "Usando mapa alternativo (OpenStreetMap) — Google Maps no está disponible ahora mismo.",
          })}
        </div>
        <Suspense fallback={<MapFallback />}>
          <TripMap destination={destination} days={days} tripId={tripId} geo_lat={geo_lat} geo_lng={geo_lng} />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={<MapFallback />}>
      <GoogleTripMap destination={destination} days={days} tripId={tripId} onError={handleError} geo_lat={geo_lat} geo_lng={geo_lng} />
    </Suspense>
  );
}
