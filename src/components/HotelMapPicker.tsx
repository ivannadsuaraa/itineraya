import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

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

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
};

const PIN_ICON = L.divIcon({
  className: "itineraya-hotel-pin",
  html: `<div style="
    width:32px;height:32px;border-radius:9999px;
    background:#1E6B9A;border:3px solid #fff;
    box-shadow:0 6px 16px rgba(30,107,154,0.45);
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-size:16px;
  ">🏨</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

async function nominatimSearch(query: string, signal?: AbortSignal): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "es,en" } });
  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

async function nominatimReverse(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { "Accept-Language": "es,en" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function HotelMapPicker({ destination, value, onChange }: Props) {
  const { t } = useTranslation();
  const [center, setCenter] = useState<[number, number]>(
    value ? [value.lat, value.lng] : [40.4168, -3.7038],
  );
  const [zoom, setZoom] = useState<number>(value ? 15 : 5);
  const [loadingCenter, setLoadingCenter] = useState(!value);
  const [searchInput, setSearchInput] = useState(value?.name ?? "");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Initial center: geocode destination if no value
  useEffect(() => {
    if (value) return;
    if (!destination.trim()) {
      setLoadingCenter(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await nominatimSearch(destination);
      if (cancelled) return;
      if (res[0]) {
        setCenter([parseFloat(res[0].lat), parseFloat(res[0].lon)]);
        setZoom(13);
      }
      setLoadingCenter(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced suggestion fetch
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSearching(true);
      try {
        const scoped = `${q}, ${destination}`.trim();
        const res = await nominatimSearch(scoped, ctrl.signal);
        setSuggestions(res);
      } catch {
        /* ignore */
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput, destination]);

  const setPin = useCallback(
    async (lat: number, lng: number, name: string | null, address: string | null) => {
      let finalAddress = address;
      if (!finalAddress) {
        finalAddress = await nominatimReverse(lat, lng);
      }
      onChange({ name, address: finalAddress, lat, lng });
      setCenter([lat, lng]);
      setZoom((z) => (z < 14 ? 15 : z));
    },
    [onChange],
  );

  const handleSelect = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const name = r.name ?? r.display_name.split(",")[0];
    setSearchInput(name);
    setSuggestions([]);
    void setPin(lat, lng, name, r.display_name);
  };

  const markerPos: [number, number] | null = value ? [value.lat, value.lng] : null;

  const mapEl = useMemo(
    () => (
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <RecenterOnChange center={center} zoom={zoom} />
        <ClickCapture
          onPick={(lat, lng) => {
            void setPin(lat, lng, null, null);
          }}
        />
        {markerPos && (
          <Marker
            position={markerPos}
            icon={PIN_ICON}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker;
                const p = m.getLatLng();
                void setPin(p.lat, p.lng, value?.name ?? null, null);
              },
            }}
          />
        )}
      </MapContainer>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [center, zoom, markerPos?.[0], markerPos?.[1]],
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("onboarding.hotelPicker.searchPh")}
          className="w-full rounded-2xl border border-sky-200 bg-white/90 py-3 pl-11 pr-10 text-base text-sky-900 placeholder-sky-400 outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-[#1E6B9A]/10 sm:text-sm"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSuggestions([]);
              onChange(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-sky-500 hover:bg-sky-100 before:absolute before:-inset-3 before:content-['']"
            aria-label={t("onboarding.hotelPicker.clear")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-sky-100 bg-white shadow-xl">
            {suggestions.map((s, i) => (
              <li key={`${s.lat}-${s.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="block min-h-11 w-full px-4 py-2.5 text-left text-sm text-sky-900 hover:bg-sky-50"
                >
                  <div className="font-medium">{s.name ?? s.display_name.split(",")[0]}</div>
                  <div className="truncate text-xs text-sky-500">{s.display_name}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative h-72 overflow-hidden rounded-2xl border border-sky-200">
        {loadingCenter && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          </div>
        )}
        {mapEl}
      </div>

      <p className="text-xs text-sky-600">
        {value
          ? (value.address ?? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`)
          : t("onboarding.hotelPicker.helper")}
      </p>
      {searching && (
        <p className="text-[11px] text-sky-400">{t("onboarding.hotelPicker.searching")}</p>
      )}
    </div>
  );
}
