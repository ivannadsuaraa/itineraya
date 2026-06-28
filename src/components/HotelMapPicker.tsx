/**
 * HotelMapPicker – Google Maps-powered hotel selection map for onboarding.
 * Delegates to GoogleMapsHotelPicker inside the GoogleMapsProvider.
 */
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { GoogleMapsHotelPicker, type HotelSelection } from "@/components/maps/GoogleMapsHotelPicker";

export type { HotelSelection };

export function HotelMapPicker(props: { destination: string; value: HotelSelection | null; onChange: (sel: HotelSelection | null) => void }) {
  return (
    <GoogleMapsProvider>
      <GoogleMapsHotelPicker {...props} />
    </GoogleMapsProvider>
  );
}