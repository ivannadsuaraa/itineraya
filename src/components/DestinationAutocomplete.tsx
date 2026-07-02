/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export type DestinationSelection = {
  description: string;
  lat: number | null;
  lng: number | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (selection: DestinationSelection) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
};

declare global {
  interface Window {
    google?: typeof google;
    __itineraya_gmap_loaded__?: Promise<void>;
  }
}

const GOOGLE_KEY = (import.meta as { env: Record<string, string | undefined> }).env
  .VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
const MAX_SUGGESTIONS = 5;
const DEBOUNCE_MS = 300;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__itineraya_gmap_loaded__) return window.__itineraya_gmap_loaded__;
  window.__itineraya_gmap_loaded__ = new Promise((resolve, reject) => {
    if (!GOOGLE_KEY) return reject(new Error("Missing Google Maps key"));
    const existing = document.querySelector<HTMLScriptElement>('script[data-itineraya="gmaps"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places&loading=async&v=weekly`;
    s.async = true;
    s.defer = true;
    s.dataset.itineraya = "gmaps";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__itineraya_gmap_loaded__;
}

type Suggestion = { description: string; secondary: string; placeId: string };

async function nominatimFallback(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${MAX_SUGGESTIONS}&featuretype=city&q=${encodeURIComponent(query)}`,
      { headers: { "Accept-Language": "es,en" } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      place_id: number;
    }>;
    return data.map((d) => {
      const parts = d.display_name.split(",").map((p) => p.trim());
      return {
        description: parts[0] || d.display_name,
        secondary: parts.slice(1).join(", "),
        placeId: `nominatim:${d.place_id}:${d.lat}:${d.lon}`,
      };
    });
  } catch {
    return [];
  }
}

export function DestinationAutocomplete({
  value,
  onChange,
  onSelect,
  onEnter,
  placeholder,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [usingFallback, setUsingFallback] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    loadGoogleMaps().catch(() => setUsingFallback(true));
  }, []);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const myRequestId = ++requestIdRef.current;
    tRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (usingFallback) {
          const results = await nominatimFallback(q);
          if (requestIdRef.current !== myRequestId) return;
          setSuggestions(results.slice(0, MAX_SUGGESTIONS));
          setOpen(true);
          setActiveIndex(-1);
          return;
        }

        await loadGoogleMaps();
        const places = window.google?.maps?.places;
        if (!places) {
          setUsingFallback(true);
          return;
        }
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new places.AutocompleteSessionToken();
        }

        type LegacyAutocompleteService = {
          getPlacePredictions: (
            req: {
              input: string;
              types?: string[];
              sessionToken?: google.maps.places.AutocompleteSessionToken;
            },
            cb: (
              preds: Array<{
                description: string;
                place_id: string;
                structured_formatting?: { main_text: string; secondary_text: string };
              }> | null,
            ) => void,
          ) => void;
        };
        const placesAny = places as unknown as {
          AutocompleteSuggestion?: {
            fetchAutocompleteSuggestions: (req: {
              input: string;
              sessionToken?: google.maps.places.AutocompleteSessionToken;
              includedPrimaryTypes?: string[];
            }) => Promise<{
              suggestions: Array<{
                placePrediction?: {
                  text?: { toString: () => string };
                  placeId: string;
                  mainText?: { toString: () => string };
                  secondaryText?: { toString: () => string };
                };
              }>;
            }>;
          };
          AutocompleteService?: new () => LegacyAutocompleteService;
        };

        if (placesAny.AutocompleteSuggestion) {
          const res = await placesAny.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: q,
            sessionToken: sessionTokenRef.current,
            includedPrimaryTypes: ["(regions)"],
          });
          if (requestIdRef.current !== myRequestId) return;
          const mapped: Suggestion[] = (res.suggestions || [])
            .map((s) => s.placePrediction)
            .filter((p): p is NonNullable<typeof p> => !!p && !!p.placeId)
            .slice(0, MAX_SUGGESTIONS)
            .map((p) => ({
              description: p.mainText?.toString() ?? p.text?.toString() ?? "",
              secondary: p.secondaryText?.toString() ?? "",
              placeId: p.placeId,
            }));
          setSuggestions(mapped);
          setOpen(true);
          setActiveIndex(-1);
        } else if (placesAny.AutocompleteService) {
          const svc = new placesAny.AutocompleteService();
          svc.getPlacePredictions(
            { input: q, types: ["(regions)"], sessionToken: sessionTokenRef.current },
            (preds) => {
              if (requestIdRef.current !== myRequestId) return;
              setSuggestions(
                (preds || []).slice(0, MAX_SUGGESTIONS).map((p) => ({
                  description: p.structured_formatting?.main_text ?? p.description,
                  secondary: p.structured_formatting?.secondary_text ?? "",
                  placeId: p.place_id,
                })),
              );
              setOpen(true);
              setActiveIndex(-1);
            },
          );
        }
      } catch {
        setUsingFallback(true);
      } finally {
        if (requestIdRef.current === myRequestId) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [value, usingFallback]);

  const resolveCoords = (s: Suggestion): Promise<{ lat: number | null; lng: number | null }> => {
    if (s.placeId.startsWith("nominatim:")) {
      const [, , lat, lng] = s.placeId.split(":");
      return Promise.resolve({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }
    return new Promise((resolve) => {
      const places = window.google?.maps?.places;
      if (!places) return resolve({ lat: null, lng: null });
      try {
        if (!placesServiceRef.current) {
          placesServiceRef.current = new places.PlacesService(document.createElement("div"));
        }
        placesServiceRef.current.getDetails(
          {
            placeId: s.placeId,
            fields: ["geometry"],
            sessionToken: sessionTokenRef.current ?? undefined,
          },
          (result, status) => {
            if (status === "OK" && result?.geometry?.location) {
              resolve({ lat: result.geometry.location.lat(), lng: result.geometry.location.lng() });
            } else {
              resolve({ lat: null, lng: null });
            }
          },
        );
      } catch {
        resolve({ lat: null, lng: null });
      }
    });
  };

  const pick = async (s: Suggestion) => {
    onChange(s.description);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    sessionTokenRef.current = null;
    if (onSelect) {
      const { lat, lng } = await resolveCoords(s);
      onSelect({ description: s.description, lat, lng });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onEnter?.();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < suggestions.length - 1 ? i + 1 : 0;
        listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i > 0 ? i - 1 : suggestions.length - 1;
        listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        pick(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        pick(suggestions[0]);
      } else {
        onEnter?.();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500" />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="destination-suggestions"
        aria-activedescendant={activeIndex >= 0 ? `destination-option-${activeIndex}` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={
          className ??
          "w-full rounded-2xl border border-sky-200 bg-white/80 py-4 pl-12 pr-10 text-base font-medium text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
        }
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sky-400" />
      )}
      <ul
        ref={listRef}
        id="destination-suggestions"
        role="listbox"
        className={
          "absolute left-0 right-0 top-full z-30 mt-2 max-h-72 origin-top overflow-auto rounded-2xl border border-sky-100 bg-white shadow-2xl transition-all duration-150 ease-out " +
          (open && suggestions.length > 0
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0")
        }
      >
        {suggestions.map((s, i) => (
          <li
            key={s.placeId}
            id={`destination-option-${i}`}
            role="option"
            aria-selected={i === activeIndex}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => pick(s)}
              className={
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors " +
                (i === activeIndex ? "bg-sky-50" : "hover:bg-sky-50")
              }
            >
              <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-sky-900">{s.description}</span>
                {s.secondary && (
                  <span className="block truncate text-xs text-slate-400">{s.secondary}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
