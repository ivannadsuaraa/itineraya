// src/components/trip/ItineraryView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming utility for class merging
import { useMicroAnimation } from '@/hooks/useMicroAnimation';

// --- Mock Data Example ---
// In a real app, this data would come from an API or state management
const mockItineraryData = {
  days: [
    {
      date: '2023-10-26',
      label: 'Day 1: Arrival & City Exploration',
      activities: [
        { id: 'act1', time: '14:00', name: 'Check-in to Hotel', description: 'Arrive at Grand Hotel Cosmopolitan' },
        { id: 'act2', time: '16:00', name: 'Walking Tour of Old Town', description: 'Explore historical sites and landmarks' },
        { id: 'act3', time: '19:00', name: 'Dinner at Local Restaurant', description: 'Enjoy traditional cuisine' },
      ],
    },
    {
      date: '2023-10-27',
      label: 'Day 2: Museums & Culture',
      activities: [
        { id: 'act4', time: '10:00', name: 'Visit the National Art Museum', description: 'Explore masterpieces of art' },
        { id: 'act5', time: '13:00', name: 'Lunch Break', description: 'Casual cafe near the museum' },
        { id: 'act6', time: '15:00', name: 'Attend a Local Music Performance', description: 'Experience traditional music' },
      ],
    },
    {
      date: '2023-10-28',
      label: 'Day 3: Day Trip to Nearby Town',
      activities: [
        { id: 'act7', time: '09:00', name: 'Travel to Charming Village', description: 'Scenic bus journey' },
        { id: 'act8', time: '11:00', name: 'Explore Local Market', description: 'Handicrafts and local produce' },
        { id: 'act9', time: '13:00', name: 'Lunch with a View', description: 'Restaurant overlooking the valley' },
        { id: 'act10', time: '15:00', name: 'Visit Historical Castle', description: 'Learn about the region\'s history' },
        { id: 'act11', time: '17:00', name: 'Return to City', description: 'Travel back to the main hotel' },
      ],
    },
    // Add more days as needed
  ],
};

export interface Activity {
  id: string;
  time: string;
  name: string;
  description?: string;
}

export interface Day {
  date: string;
  label: string;
  activities: Activity[];
}

interface ItineraryViewProps {
  itineraryData?: { days: Day[] };
  className?: string;
}

// --- Animation Variants ---
const daySelectorVariants = {
  sticky: {
    y: 0, // Element is in its normal position
  },
  fixed: {
    y: -100, // Positioned fixed, might need adjustment based on actual header height
  },
};


const ItineraryView: React.FC<ItineraryViewProps> = ({ itineraryData = mockItineraryData, className }) => {
  const { whileTap: tapScaleAnimation } = useMicroAnimation();
  const [activeDay, setActiveDay] = useState<string | null>(null); // Track the currently visible day
  const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const daySelectorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSelectorFixed, setIsSelectorFixed] = useState(false);

  // --- Effect for Intersection Observer ---
  useEffect(() => {
    const currentContentRef = contentRef.current;
    const currentDaySelectorRef = daySelectorRef.current;

    if (!currentContentRef || !currentDaySelectorRef || itineraryData.days.length === 0) return;

    // Observer for sticky behavior
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // entry.target is the element being observed
          // If the observed element (e.g., first day's content) is NOT intersecting the viewport
          // it means we have scrolled past it, so the selector should become fixed.
          // If it IS intersecting, it means we are at or above the first day, so it should be normal.
          if (entry.target === dayRefs.current[itineraryData.days[0].date] && !entry.isIntersecting) {
            setIsSelectorFixed(true);
          } else {
            setIsSelectorFixed(false);
          }
        });
      },
      {
        root: null, // Use the viewport as the root
        rootMargin: '0px', // No margin on the root
        threshold: 0, // Trigger when even 1px of the element is visible or hidden
      }
    );

    // Observe the first day's content `div` to determine when to fix the selector
    if (dayRefs.current[itineraryData.days[0].date]) {
      observer.observe(dayRefs.current[itineraryData.days[0].date]!);
    }

    // Observer for active day tracking
    const activeDayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { // Track when at least 50% is visible
            setActiveDay(entry.target.id);
          }
        });
      },
      {
        root: currentContentRef, // Observe within the scrollable content container
        rootMargin: '0px 0px -50% 0px', // Trigger when the element is roughly in the middle of the viewport
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    // Observe each day's content div
    Object.values(dayRefs.current).forEach(ref => {
      if (ref) {
        activeDayObserver.observe(ref);
      }
    });

    // Cleanup observers on component unmount
    return () => {
      observer.disconnect();
      activeDayObserver.disconnect();
    };
  }, [itineraryData.days]); // Re-run effect if days data changes

  // --- Handler to scroll to a specific day ---
  const scrollToDay = (date: string) => {
    const ref = dayRefs.current[date];
    if (ref && contentRef.current) {
      // Scroll to the element's position.
      // Adjusting for the sticky header height might be necessary depending on UI.
      // For now, simple scrollIntoView.
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveDay(ref.id); // Update active day immediately on click
    }
  };

  return (
    <div className={cn("relative flex flex-col w-full", className)}>
      {/* Day Selector - Becomes sticky */}
      <motion.div
        ref={daySelectorRef}
        className={cn(
          "z-10 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6 transition-all duration-300 ease-in-out",
          isSelectorFixed ? "fixed top-20 w-[calc(100%-32px)] md:w-[calc(100%-64px)] max-w-4xl mx-auto left-1/2 -translate-x-1/2 shadow-lg" : "relative"
          // Fixed positioning will need refinement based on header height and layout.
          // For now, approximate positioning.
        )}
        variants={daySelectorVariants}
        animate={isSelectorFixed ? "fixed" : "sticky"}
        style={{ '--tw-translate-y': isSelectorFixed ? '4.5rem' : '0rem' } as React.CSSProperties } // Mimic fixed position relative to header height if needed
        initial={false}
      >
        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Your Itinerary</h3>
        <div className="flex overflow-x-auto space-x-3 pb-3">
          {itineraryData.days.map((day) => (
            <motion.button
              key={day.date}
              onClick={() => scrollToDay(day.date)}
              whileTap={tapScaleAnimation} // Reusing micro-animation
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out",
                activeDay === day.date
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-gray-600"
              )}
            >
              {day.label.split(":")[0]} {/* Display only the day number/role, e.g., "Day 1" */}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Itinerary Content - Scrollable area */}
      <div ref={contentRef} className="flex-grow overflow-y-auto max-h-[calc(100vh-200px)] relative"> {/* Adjust max-height based on header/footer/selector heights */}
        {itineraryData.days.map((day) => (
          <div
            key={day.date}
            id={day.date} // ID for intersection observer targeting
            ref={(el) => dayRefs.current[day.date] = el}
            className="mb-12 px-4 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <h4 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-3">
              <span>{day.label}</span>
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})</span>
            </h4>
            {day.activities.map((activity) => (
              <div key={activity.id} className="p-4 mb-4 bg-blue-50 dark:bg-gray-700 rounded-xl shadow-inner border border-blue-200 dark:border-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="text-xl font-semibold text-blue-600 dark:text-blue-400 w-20 text-right">{activity.time}</span>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900 dark:text-white break-words">{activity.name}</p>
                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{activity.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryView;
