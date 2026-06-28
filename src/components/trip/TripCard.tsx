// src/components/trip/TripCard.tsx
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@lib/utils'; // Assuming a utility for class merging
import { useTranslations } from 'next-intl'; // Assuming i18n for translations

// --- Animation Variants ---

// Entrance animation for individual cards
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Hover effects for a premium feel
const cardHoverEffects = {
  scale: 1.03, // Slight scale up
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)", // Deeper, softer shadow
};

// Hover transition for smooth effect
const hoverTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

export const TripCard = ({ trip, index }) => {
  const navigate = useNavigate();
  const t = useTranslations('Dashboard'); // Assuming translations are set up

  const handleClick = () => {
    navigate({ to: `/trip/${trip.id}` });
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden" // Ensure this is handled by parent staggering if possible
      animate="visible"
      whileHover={cardHoverEffects}
      transition={hoverTransition} // Apply transition for hover effects
      onClick={handleClick}
      className={cn(
        "cursor-pointer relative rounded-xl bg-white p-6 shadow-md transition-all duration-300 ease-in-out hover:shadow-lg",
        // Add more premium visual styles here if needed
        "group" // Use group for child hover effects if any
      )}
    >
      {/* Trip Image Section */}
      <div className="mb-4 relative overflow-hidden rounded-lg">
        <motion.img
          src={trip.image_url || '/placeholder-trip-image.jpg'} // Placeholder image
          alt={trip.name}
          className="w-full h-48 object-cover rounded-lg"
          // Optional: subtle hover zoom on image
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />
        {/* Overlay for image if needed, e.g., for date/location text */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-lg">
          <p className="text-white text-lg font-bold">{trip.name}</p>
          <p className="text-white text-sm">{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Trip Details Section */}
      <div className="p-2"> {/* Reduced padding to keep it tighter */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{trip.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{t('trips.status_' + trip.status)}</span>
          <span>{trip.members.length} members</span>
        </div>
      </div>
    </motion.div>
  );
};
