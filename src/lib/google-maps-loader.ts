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

// Lets a consumer (e.g. a "retry" button on the map fallback) clear a
// previously recorded failure and try loading Google Maps again. Without
// this, a single stale/transient failure earlier in the SPA session (e.g. a
// flaky network blip on the destination search) permanently forces every
// Google Maps consumer on the page into its fallback for the rest of that
// session, even after the underlying cause is gone.
export function resetGoogleMapsAuthFailure(): void {
  authFailed = false;
  coreLibsPromise = null;
  if (typeof window !== "undefined") {
    window.__itineraya_gmap_loaded__ = undefined;
  }
}

export function loadGoogleMaps(libraries = "places,marker"): Promise<void> {
  if (authFailed) {
    console.warn("[GoogleMaps] Skipping load — previous auth failure recorded.");
    return Promise.reject(new Error("Google Maps auth failure"));
  }
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
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

    const existing = document.querySelector<HTMLScriptElement>('script[data-itineraya="gmaps"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => {
        reject(new Error("Failed to load Google Maps"));
      });
      return;
    }
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.defer = true;
    s.dataset.itineraya = "gmaps";
    s.onload = () => resolve();
    s.onerror = () => {
      // Sin la URL: lleva la API key en la query y acabaría en cualquier
      // recolector de logs del navegador.
      console.error("[GoogleMaps] Script load failed (network error or invalid key).");
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

type CoreLibs = {
  maps: google.maps.MapsLibrary;
  geocoding: google.maps.GeocodingLibrary;
  marker: google.maps.MarkerLibrary;
  core: google.maps.CoreLibrary;
};

let coreLibsPromise: Promise<CoreLibs> | null = null;

// With `loading=async`, the outer <script> tag's `onload` event fires as soon
// as the bootstrap file itself has executed — but that bootstrap kicks off
// its OWN async setup, so `google.maps.importLibrary` (and even
// `google.maps.Map`) can still be undefined for a brief moment after `onload`
// resolves. Reproduced live: calling `new google.maps.Map(...)` or
// `google.maps.importLibrary(...)` immediately after `loadGoogleMaps()`
// resolved threw "is not a constructor" / "is not a function", which the old
// bare catch swallowed and misreported as an auth failure — forcing the
// Leaflet fallback for what was really just a load-timing race, not a broken
// key. Poll briefly for `importLibrary` to actually exist before calling it.
async function waitForImportLibrary(timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (typeof window.google?.maps?.importLibrary !== "function") {
    if (Date.now() - start > timeoutMs) {
      throw new Error("google.maps.importLibrary did not become available in time");
    }
    await new Promise((r) => setTimeout(r, 30));
  }
}

// importLibrary() is Google's documented, race-free way to obtain a
// library's classes once it's actually ready — safer than referencing
// `google.maps.X` globals synchronously right after the script tag loads.
export async function loadGoogleMapsCoreLibraries(): Promise<CoreLibs> {
  await loadGoogleMaps();
  if (!coreLibsPromise) {
    coreLibsPromise = waitForImportLibrary()
      .then(() =>
        Promise.all([
          google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          google.maps.importLibrary("geocoding") as Promise<google.maps.GeocodingLibrary>,
          google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
          google.maps.importLibrary("core") as Promise<google.maps.CoreLibrary>,
        ]),
      )
      .then(([maps, geocoding, marker, core]) => ({ maps, geocoding, marker, core }));
  }
  return coreLibsPromise;
}
