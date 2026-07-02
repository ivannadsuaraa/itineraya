/// <reference types="google.maps" />

// Shared Google Maps JS API loader used by GoogleTripMap and DestinationAutocomplete.
// Centralized so both components see the same load/auth-failure state instead of
// racing two independent script tags and two independent "did it fail" flags.

declare global {
  interface Window {
    google?: typeof google;
    __itineraya_gmap_loaded__?: Promise<void>;
    gm_authFailure?: () => void;
  }
}

const ENV = (import.meta as { env: Record<string, string | undefined> }).env;
// VITE_GOOGLE_MAPS_KEY is the canonical name; VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY
// is kept as a fallback for environments that haven't migrated the env var yet.
const GOOGLE_KEY = ENV.VITE_GOOGLE_MAPS_KEY || ENV.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

// Google's loader does not reject the script promise on bad-key/expired-key/referrer
// restrictions — it silently renders a broken grey map and calls this global callback
// instead (InvalidKeyMapError, MissingKeyMapError, RefererNotAllowedMapError,
// ApiNotActivatedMapError all route here). We turn that into a real failure signal.
const authFailureListeners = new Set<() => void>();
let authFailed = false;

function markAuthFailed() {
  if (authFailed) return;
  authFailed = true;
  authFailureListeners.forEach((cb) => cb());
}

if (typeof window !== "undefined") {
  const existing = window.gm_authFailure;
  window.gm_authFailure = () => {
    existing?.();
    markAuthFailed();
  };
}

export function isGoogleMapsAuthFailed(): boolean {
  return authFailed;
}

export function onGoogleMapsAuthFailure(cb: () => void): () => void {
  authFailureListeners.add(cb);
  return () => authFailureListeners.delete(cb);
}

export function loadGoogleMaps(libraries = "places,marker"): Promise<void> {
  if (authFailed) return Promise.reject(new Error("Google Maps auth failure"));
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__itineraya_gmap_loaded__) return window.__itineraya_gmap_loaded__;
  window.__itineraya_gmap_loaded__ = new Promise((resolve, reject) => {
    if (!GOOGLE_KEY) {
      markAuthFailed();
      return reject(new Error("Missing Google Maps key"));
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-itineraya="gmaps"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=${libraries}&loading=async&v=weekly`;
    s.async = true;
    s.defer = true;
    s.dataset.itineraya = "gmaps";
    s.onload = () => resolve();
    s.onerror = () => {
      markAuthFailed();
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(s);
  });
  return window.__itineraya_gmap_loaded__;
}

// Google's Places/Geocoding calls (expired or invalid key, API not enabled, quota)
// reject with a normal JS error rather than triggering gm_authFailure — call this
// from any catch block around a places/geocoder call to keep the shared flag in sync.
export function reportGoogleMapsFailure() {
  markAuthFailed();
}
