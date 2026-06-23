/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { geocodePlace } from "@/lib/geocode.functions";

// Minimal google.maps types we use here
type LatLng = { lat: number; lng: number };

export interface HotelSelection {
  name: string | null;
  address: string | null;
  lat: number;
  lng: number;
}

interface Props {
  destination: string;
  value: HotelSelection | null;
  onChange: (sel: HotelSelection | null) => void;
}

const SCRIPT_ID = "google-maps-js-sdk";

function loadGoogleMaps(): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window unavailable"));
      return;
    }
    // @ts-expect-error global
    if (window.google?.maps) return resolve(window.google);

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) {
      reject(new Error("Missing Google Maps browser key"));
      return;
    }
    // @ts-expect-error attach global callback
    window.__initGoogleMaps = () => {
      // @ts-expect-error global
      resolve(window.google);
    };
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      // Already loading — wait for callback
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.defer = true;
    const params = new URLSearchParams({
      key,
      v: "weekly",
      libraries: "places,marker",
      loading: "async",
      callback: "__initGoogleMaps",
    });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

export function HotelMapPicker({ destination, value, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const geocodeFn = useServerFn(geocodePlace);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ placeId: string; primary: string; secondary: string }>
  >([]);

  const setPin = useCallback(
    (pos: LatLng, name: string | null, address: string | null) => {
      if (!mapInstance.current) return;
      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          map: mapInstance.current,
          position: pos,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });
        markerRef.current.addListener("dragend", () => {
          const p = markerRef.current?.getPosition();
          if (!p) return;
          const lat = p.lat();
          const lng = p.lng();
          // Reverse geocode for address on drag
          new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
            const addr = status === "OK" && results?.[0]?.formatted_address ? results[0].formatted_address : null;
            onChange({ name: null, address: addr, lat, lng });
          });
        });
      } else {
        markerRef.current.setPosition(pos);
      }
      mapInstance.current.panTo(pos);
      if ((mapInstance.current.getZoom() ?? 0) < 14) mapInstance.current.setZoom(15);
      onChange({ name, address, lat: pos.lat, lng: pos.lng });
    },
    [onChange],
  );

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const initialCenter: LatLng = value
          ? { lat: value.lat, lng: value.lng }
          : { lat: 40.4168, lng: -3.7038 }; // Madrid fallback while geocoding

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: value ? 15 : 5,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });

        // Click to drop/move pin
        mapInstance.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setPin({ lat, lng }, null, null);
        });

        // If we already have a value, render the marker
        if (value) {
          markerRef.current = new google.maps.Marker({
            map: mapInstance.current,
            position: initialCenter,
            draggable: true,
            animation: google.maps.Animation.DROP,
          });
          markerRef.current.addListener("dragend", () => {
            const p = markerRef.current?.getPosition();
            if (!p) return;
            onChange({ name: value.name, address: value.address, lat: p.lat(), lng: p.lng() });
          });
        } else if (destination.trim()) {
          // Center map on the destination via geocoding
          try {
            const res = await geocodeFn({ data: { query: destination } });
            if (!cancelled && res.lat != null && res.lng != null && mapInstance.current) {
              mapInstance.current.setCenter({ lat: res.lat, lng: res.lng });
              mapInstance.current.setZoom(13);
            }
          } catch {
            /* ignore geocode failure, user can still pan */
          }
        }

        sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No se pudo cargar el mapa");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autocomplete using Places API (New)
  useEffect(() => {
    if (!searchInput || searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        // @ts-expect-error global
        if (!window.google?.maps?.places) return;
        const { AutocompleteSuggestion } = (await google.maps.importLibrary(
          "places",
        )) as google.maps.PlacesLibrary;
        const center = mapInstance.current?.getCenter();
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: searchInput,
          sessionToken: sessionToken.current ?? undefined,
          includedPrimaryTypes: ["lodging"],
          locationBias: center
            ? { center: { lat: center.lat(), lng: center.lng() }, radius: 30000 }
            : undefined,
        });
        const items = (result.suggestions ?? [])
          .map((s) => s.placePrediction)
          .filter((p): p is google.maps.places.PlacePrediction => !!p)
          .slice(0, 6)
          .map((p) => ({
            placeId: p.placeId,
            primary: p.mainText?.text ?? p.text?.text ?? "",
            secondary: p.secondaryText?.text ?? "",
          }));
        setSuggestions(items);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const selectSuggestion = async (placeId: string, primary: string) => {
    try {
      const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
      const place = new Place({ id: placeId });
      await place.fetchFields({ fields: ["location", "formattedAddress", "displayName"] });
      const loc = place.location;
      if (!loc) return;
      setPin(
        { lat: loc.lat(), lng: loc.lng() },
        place.displayName ?? primary,
        place.formattedAddress ?? null,
      );
      setSuggestions([]);
      setSearchInput(place.displayName ?? primary);
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    } catch {
      /* ignore */
    }
  };

  const clearSelection = () => {
    markerRef.current?.setMap(null);
    markerRef.current = null;
    setSearchInput("");
    setSuggestions([]);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
          <input
            ref={searchRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar hotel o dirección…"
            className="w-full rounded-2xl border border-sky-200 bg-white/90 py-3 pl-11 pr-10 text-sm text-sky-900 placeholder-sky-400 outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-[#1E6B9A]/10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-sky-500 hover:bg-sky-100"
              aria-label="Limpiar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-sky-100 bg-white shadow-xl">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s.placeId, s.primary)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-sky-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-none text-[#1E6B9A]" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-sky-900">{s.primary}</span>
                    {s.secondary && (
                      <span className="block truncate text-xs text-sky-600">{s.secondary}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-sky-50">
        <div ref={mapRef} className="h-72 w-full sm:h-80" />
        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-[#1E6B9A]" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-4 text-center text-sm text-rose-600">
            {error}
          </div>
        )}
      </div>

      {value ? (
        <div className="flex items-start gap-3 rounded-2xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
          <MapPin className="mt-0.5 h-4 w-4 flex-none text-[#1E6B9A]" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-semibold text-sky-900">
              {value.name ?? "Ubicación seleccionada"}
            </div>
            <div className="truncate text-xs text-sky-700">
              {value.address ?? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`}
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-full px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-white"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <p className="text-xs text-sky-600">
          Busca tu hotel o toca el mapa para colocar el pin. Puedes arrastrarlo para ajustarlo.
        </p>
      )}
    </div>
  );
}
