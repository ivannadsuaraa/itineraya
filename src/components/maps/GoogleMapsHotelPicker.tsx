import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, X, MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { LIGHT_MAP_STYLE } from "./map-styles";

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

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
}

export function GoogleMapsHotelPicker({ destination, value, onChange }: Props) {
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [center] = useState<{ lat: number; lng: number }>(
    value ? { lat: value.lat, lng: value.lng } : { lat: 40.4168, lng: -3.7038 },
  );
  const [zoom] = useState<number>(value ? 15 : 5);
  const [loadingCenter, setLoadingCenter] = useState(!value);
  const [searchInput, setSearchInput] = useState(value?.name ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const map = new google.maps.Map(containerRef.current, {
      center,
      zoom,
      styles: LIGHT_MAP_STYLE,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      gestureHandling: "greedy",
    });
    mapRef.current = map;
    sessionRef.current = new google.maps.places.AutocompleteSessionToken();

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        reverseGeocodeAndSet(lat, lng);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Geocode destination on mount
  useEffect(() => {
    if (!isLoaded || value) return;
    if (!destination.trim()) {
      setLoadingCenter(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const geocoder = new google.maps.Geocoder();
      try {
        const result = await geocoder.geocode({ address: destination });
        if (cancelled) return;
        if (result.results[0]) {
          const loc = result.results[0].geometry.location;
          const newCenter = { lat: loc.lat(), lng: loc.lng() };
          if (mapRef.current) {
            mapRef.current.setCenter(newCenter);
            mapRef.current.setZoom(13);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingCenter(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Resync marker when value changes
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !value) return;
    if (markerRef.current) markerRef.current.setMap(null);
    const marker = new google.maps.Marker({
      position: { lat: value.lat, lng: value.lng },
      map: mapRef.current,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) reverseGeocodeAndSet(pos.lat(), pos.lng());
    });
    markerRef.current = marker;
    if (mapRef.current) {
      const m: google.maps.Map = mapRef.current;
      m.setCenter({ lat: value.lat, lng: value.lng });
      const zoom = m.getZoom();
      if (zoom !== undefined && zoom < 14) m.setZoom(15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, value]);

  const reverseGeocodeAndSet = useCallback(
    async (lat: number, lng: number) => {
      if (!isLoaded) return;
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ location: { lat, lng } });
        const addr = result.results[0]?.formatted_address ?? null;
        const nameEntry = result.results[0]?.address_components?.[0]?.short_name ?? null;
        onChange({ name: nameEntry, address: addr, lat, lng });
      } catch {
        onChange({ name: null, address: null, lat, lng });
      }
    },
    [isLoaded, onChange],
  );

  // Debounced Places search
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 3 || !isLoaded) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const service = new google.maps.places.AutocompleteService();
        const scoped = `${q}, ${destination}`;
        const result = await service.getPlacePredictions({
          input: scoped,
          sessionToken: sessionRef.current ?? undefined,
          types: ["establishment", "geocode"],
        });
        setSuggestions(
          result.predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting.main_text,
          })),
        );
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput, destination, isLoaded]);

  const handleSelect = (suggestion: PlaceSuggestion) => {
    if (!isLoaded) return;
    setSearchInput(suggestion.mainText);
    setSuggestions([]);
    try {
      const placesService = new google.maps.places.PlacesService(
        document.createElement("div"),
      );
      placesService.getDetails(
        {
          placeId: suggestion.placeId,
          fields: ["geometry", "name", "formatted_address"],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result && result.geometry?.location) {
            const loc = result.geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            onChange({
              name: result.name ?? suggestion.mainText,
              address: result.formatted_address ?? suggestion.description,
              lat,
              lng,
            });
          }
        },
      );
    } catch {
      // fallback geocode
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: suggestion.description }, (result, status) => {
          if (status === google.maps.GeocoderStatus.OK && result?.[0]) {
            const loc = result[0].geometry.location;
            onChange({
              name: suggestion.mainText,
              address: result[0].formatted_address,
              lat: loc.lat(),
              lng: loc.lng(),
            });
          }
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
        <input
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
              onChange(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-sky-500 hover:bg-sky-100"
            aria-label="Limpiar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-sky-100 bg-white shadow-xl">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-sky-900 hover:bg-sky-50"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                  <div>
                    <div className="font-medium">{s.mainText}</div>
                    <div className="truncate text-xs text-sky-500">{s.description}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative h-72 overflow-hidden rounded-2xl border border-sky-200">
        {(!isLoaded || loadingCenter) && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <p className="text-xs text-sky-600">
        {value
          ? value.address ?? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : "Busca tu hotel o haz clic en el mapa para colocar el pin."}
      </p>
      {searching && (
        <p className="text-[11px] text-sky-400">Buscando…</p>
      )}
    </div>
  );
}