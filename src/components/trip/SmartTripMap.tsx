import { lazy, Suspense, useCallback, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resetGoogleMapsAuthFailure } from "@/lib/google-maps-loader";

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
  // Bumping this forces GoogleTripMap to fully unmount/remount on retry, so
  // it re-runs its load/init effects from a clean slate instead of reusing
  // stale refs from the failed attempt.
  const [retryKey, setRetryKey] = useState(0);
  const handleError = useCallback(() => setGoogleFailed(true), []);
  const handleRetry = useCallback(() => {
    // A failure can be stale (e.g. recorded earlier in this SPA session by an
    // unrelated component) or the underlying issue may already be fixed —
    // without this, there was previously no way back to Google Maps short of
    // a full page reload.
    resetGoogleMapsAuthFailure();
    setGoogleFailed(false);
    setRetryKey((k) => k + 1);
  }, []);

  if (googleFailed) {
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
          <span>
            {t("trip.mapFallbackNotice", {
              defaultValue:
                "Usando mapa alternativo (OpenStreetMap) — Google Maps no está disponible ahora mismo.",
            })}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
          >
            <RotateCcw className="h-3 w-3" />
            {t("trip.mapFallbackRetry", { defaultValue: "Reintentar con Google Maps" })}
          </button>
        </div>
        <Suspense fallback={<MapFallback />}>
          <TripMap
            destination={destination}
            days={days}
            tripId={tripId}
            geo_lat={geo_lat}
            geo_lng={geo_lng}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={<MapFallback />}>
      <GoogleTripMap
        key={retryKey}
        destination={destination}
        days={days}
        tripId={tripId}
        onError={handleError}
        geo_lat={geo_lat}
        geo_lng={geo_lng}
      />
    </Suspense>
  );
}
