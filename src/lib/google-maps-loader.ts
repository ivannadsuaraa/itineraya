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

// Log key presence immediately on module load
if (typeof window !== "undefined") {
  console.log(
    "[GoogleMaps] 🔑 API key configured:",
    GOOGLE_KEY ? `${GOOGLE_KEY.substring(0, 20)}...${GOOGLE_KEY.substring(GOOGLE_KEY.length - 4)}` : "❌ NO KEY FOUND"
  );
}

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
    console.error(
      "[GoogleMaps] ❌ gm_authFailure fired. This means one of:\n" +
      "  1. The API key is invalid or expired.\n" +
      "  2. The Maps JavaScript API is not enabled in Google Cloud Console.\n" +
      "  3. HTTP referrer restrictions are blocking this domain " +
      "(itineraya.com must be in the allowed referrers list).\n" +
      "  4. Billing is not enabled on the Google Cloud project.\n" +
      "See instructions in src/lib/google-maps-loader.ts for how to fix.",
    );
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
  if (authFailed) {
    console.warn("[GoogleMaps] Skipping load — previous auth failure recorded.");
    return Promise.reject(new Error("Google Maps auth failure"));
  }
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) {
    console.info("[GoogleMaps] Already loaded ✓");
    return Promise.resolve();
  }
  if (window.__itineraya_gmap_loaded__) return window.__itineraya_gmap_loaded__;

  window.__itineraya_gmap_loaded__ = new Promise((resolve, reject) => {
    if (!GOOGLE_KEY) {
      console.error(
        "[GoogleMaps] ❌ VITE_GOOGLE_MAPS_KEY is not set. " +
        "Add it to your .env file and to Vercel's environment variables.",
      );
      markAuthFailed();
      return reject(new Error("Missing Google Maps key"));
    }
    const url = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=${libraries}&loading=async&v=weekly`;
    console.info(
      `[GoogleMaps] 📡 Loading | key: …${GOOGLE_KEY.slice(-6)} | libraries: ${libraries}`,
    );
    console.info(`[GoogleMaps] 🔗 URL: ${url.substring(0, 80)}...`);

    const existing = document.querySelector<HTMLScriptElement>('script[data-itineraya="gmaps"]');
    if (existing) {
      console.warn("[GoogleMaps] ⚠️ Script tag already exists, attaching listeners to existing tag");
      existing.addEventListener("load", () => {
        console.info("[GoogleMaps] ✓ Script loaded from existing tag");
        resolve();
      });
      existing.addEventListener("error", () => {
        console.error("[GoogleMaps] ❌ Existing script tag error event fired");
        reject(new Error("Failed to load Google Maps"));
      });
      return;
    }
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.defer = true;
    s.dataset.itineraya = "gmaps";
    s.onload = () => {
      console.info("[GoogleMaps] ✅ Script loaded successfully | window.google?.maps:", !!window.google?.maps);
      if (!window.google?.maps) {
        console.warn("[GoogleMaps] ⚠️ Script loaded but window.google.maps is undefined — check for auth failures");
      }
      resolve();
    };
    s.onerror = () => {
      console.error("[GoogleMaps] ❌ Script load failed (network error or invalid key) | src:", s.src);
      markAuthFailed();
      reject(new Error("Failed to load Google Maps"));
    };
    console.info("[GoogleMaps] 📝 Appending script tag to document.head...");
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
