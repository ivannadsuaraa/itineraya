// src/components/trip/TripCard.tsx (Integrating ItineraryView placeholder)

import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type TripCardTrip = {
  id: string;
  image_url?: string | null;
  name?: string | null;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  status?: string | null;
  members?: unknown[];
};

export const TripCard = ({ trip, index }: { trip: TripCardTrip; index?: number }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const title = trip.name ?? trip.destination ?? '';

  const handleClick = () => {
    navigate({ to: '/trip/$tripId', params: { tripId: trip.id } });
  };

  return (
    <div
      
      // Ensure this is handled by parent staggering if possible
      
      
      // Apply transition for hover effects
      onClick={handleClick}
      className={cn(
        "cursor-pointer relative rounded-xl bg-white p-6 shadow-md hover:shadow-lg",
        // Add more premium visual styles here if needed
        "group" // Use group for child hover effects if any
      )}
    >
      {/* Trip Image Section */}
      <div className="mb-4 relative overflow-hidden rounded-lg">
        <img
          src={trip.image_url || '/placeholder-trip-image.jpg'} // Placeholder image
          alt={title}
          className="w-full h-48 object-cover rounded-lg"
          // Optional: subtle hover zoom on image
          
          
        />
        {/* Overlay for image if needed, e.g., for date/location text */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-lg">
          <p className="text-white text-lg font-bold">{title}</p>
          <p className="text-white text-sm">{trip.start_date ? new Date(trip.start_date).toLocaleDateString() : ''} - {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : ''}</p>
        </div>
      </div>

      {/* Trip Details Section */}
      <div className="p-2"> {/* Reduced padding to keep it tighter */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{t('Dashboard.trips.status_' + trip.status)}</span>
          <span>{trip.members?.length ?? 0} members</span>
        </div>
      </div>

      {/* Placeholder for Itinerary View - This would typically be on a detail page, not the card itself */}
      {/* For demonstration, if this card were to lead to an itinerary view directly: */}
      {/* {trip.id === 'some_specific_trip_id' && (  // Conditional rendering example
        <div className="mt-4 border-t pt-4">
           <ItineraryView itineraryData={trip.itinerary} />
        </div>
      )} */}
    </div>
  );
};
