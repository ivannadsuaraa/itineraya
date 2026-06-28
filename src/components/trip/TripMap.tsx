/**
 * TripMap – Google Maps-powered map view for itineraries.
 * Delegates to GoogleMapsTripMap inside the GoogleMapsProvider.
 */
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { GoogleMapsTripMap } from "@/components/maps/GoogleMapsTripMap";

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  url?: string;
};
type Day = {
  day: number;
  title: string;
  activities: Activity[];
};

interface Props {
  destination: string;
  days: Day[];
  tripId: string;
}

export function TripMap(props: Props) {
  return (
    <GoogleMapsProvider>
      <GoogleMapsTripMap {...props} />
    </GoogleMapsProvider>
  );
}