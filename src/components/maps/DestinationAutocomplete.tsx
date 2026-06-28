import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { GoogleMapsProvider } from "./GoogleMapsProvider";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

function AutocompleteInner({ value, onChange, placeholder, className }: Props) {
  const { isLoaded } = useGoogleMaps();
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refresh session token periodically
  useEffect(() => {
    if (isLoaded) {
      sessionRef.current = new google.maps.places.AutocompleteSessionToken();
      const interval = setInterval(() => {
        sessionRef.current = new google.maps.places.AutocompleteSessionToken();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoaded]);

  // Debounced autocomplete
  useEffect(() => {
    const q = input.trim();
    if (q.length < 2 || !isLoaded) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const service = new google.maps.places.AutocompleteService();
        const result = await service.getPlacePredictions({
          input: q,
          sessionToken: sessionRef.current ?? undefined,
          types: ["(cities)"],
          language: "es",
        });
        setSuggestions(
          result.predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text,
          })),
        );
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [input, isLoaded]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (s: Suggestion) => {
    const destinationValue = s.description;
    setInput(destinationValue);
    onChange(destinationValue);
    setSuggestions([]);
    setFocused(false);
  };

  const showDropdown = focused && suggestions.length > 0;
  const showLoading = focused && loading && !suggestions.length;

  return (
    <div ref={containerRef} className="relative">
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && (
        <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-sky-100 bg-white shadow-xl">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sky-50"
              >
                <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                <div>
                  <div className="text-sm font-medium text-sky-900">{s.mainText}</div>
                  <div className="text-xs text-sky-500">{s.secondaryText}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {showLoading && (
        <div className="absolute z-[1000] mt-1 flex w-full items-center justify-center rounded-2xl border border-sky-100 bg-white py-4 shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
        </div>
      )}
    </div>
  );
}

/**
 * DestinationAutocomplete – Dropdown autocomplete for city/country search
 * using the Google Places API (restricted to (cities) type).
 */
export function DestinationAutocomplete(props: Props) {
  return (
    <GoogleMapsProvider>
      <AutocompleteInner {...props} />
    </GoogleMapsProvider>
  );
}