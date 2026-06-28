import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

declare global {
  interface Window {
    google?: typeof google;
    __itineraya_gmap_loaded__?: Promise<void>;
  }
}

const GOOGLE_KEY = (import.meta as { env: Record<string, string | undefined> }).env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

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

type Suggestion = { description: string; placeId: string };

export function DestinationAutocomplete({ value, onChange, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadGoogleMaps().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    tRef.current = setTimeout(async () => {
      try {
        await loadGoogleMaps();
        const places = window.google?.maps?.places;
        if (!places) return;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new places.AutocompleteSessionToken();
        }
        setLoading(true);
        // Use new AutocompleteSuggestion if available, fallback to AutocompleteService
        type LegacyAutocompleteService = {
          getPlacePredictions: (
            req: { input: string; types?: string[]; sessionToken?: google.maps.places.AutocompleteSessionToken },
            cb: (preds: Array<{ description: string; place_id: string }> | null) => void,
          ) => void;
        };
        const placesAny = places as unknown as {
          AutocompleteSuggestion?: {
            fetchAutocompleteSuggestions: (req: {
              input: string;
              sessionToken?: google.maps.places.AutocompleteSessionToken;
              includedPrimaryTypes?: string[];
            }) => Promise<{ suggestions: Array<{ placePrediction?: { text?: { toString: () => string }; placeId: string } }> }>;
          };
          AutocompleteService?: new () => LegacyAutocompleteService;
        };

        if (placesAny.AutocompleteSuggestion) {
          const res = await placesAny.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: q,
            sessionToken: sessionTokenRef.current,
            includedPrimaryTypes: ["(regions)"],
          });
          const mapped: Suggestion[] = (res.suggestions || [])
            .map((s) => s.placePrediction)
            .filter((p): p is { text?: { toString: () => string }; placeId: string } => !!p && !!p.placeId)
            .map((p) => ({ description: p.text?.toString() ?? "", placeId: p.placeId }));
          setSuggestions(mapped);
        } else if (placesAny.AutocompleteService) {
          const svc = new placesAny.AutocompleteService();
          svc.getPlacePredictions(
            { input: q, types: ["(regions)"], sessionToken: sessionTokenRef.current },
            (preds) => {
              setSuggestions(
                (preds || []).map((p) => ({ description: p.description, placeId: p.place_id })),
              );
            },
          );
        }
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [value]);

  const pick = (s: Suggestion) => {
    onChange(s.description);
    setSuggestions([]);
    setOpen(false);
    sessionTokenRef.current = null;
  };

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={
          className ??
          "w-full rounded-2xl border border-sky-200 bg-white/80 py-4 pl-12 pr-10 text-base font-medium text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
        }
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sky-400" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-2xl border border-sky-100 bg-white shadow-2xl">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-sky-900 hover:bg-sky-50"
              >
                <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="truncate">{s.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
