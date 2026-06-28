import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Mock Data Example ---
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

// ── Scroll Progress Bar ──────────────
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-sky-100">
      <motion.div
        className="h-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] origin-left"
        style={{ scaleX: progress }}
      />
    </div>
  );
}

// ── Staggered cascade animation for activity cards ──
const activityVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: i * 0.1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

const ItineraryView: React.FC<ItineraryViewProps> = ({ itineraryData = mockItineraryData, className }) => {
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isSelectorFixed, setIsSelectorFixed] = useState(false);

  // Scroll progress
  useEffect(() => {
    const currentContentRef = dayRefs.current[itineraryData.days[0]?.date];
    if (!currentContentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.target === dayRefs.current[itineraryData.days[0].date] && !entry.isIntersecting) {
            setIsSelectorFixed(true);
          } else {
            setIsSelectorFixed(false);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );

    if (dayRefs.current[itineraryData.days[0].date]) {
      observer.observe(dayRefs.current[itineraryData.days[0].date]!);
    }

    // Active day tracking
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            setActiveDay(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -60% 0px', threshold: [0, 0.1, 0.2, 0.3, 0.5] }
    );

    Object.values(dayRefs.current).forEach(ref => {
      if (ref) activeObserver.observe(ref);
    });

    return () => {
      observer.disconnect();
      activeObserver.disconnect();
    };
  }, [itineraryData.days]);

  const scrollToDay = useCallback((date: string) => {
    const ref = dayRefs.current[date];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveDay(ref.id);
    }
  }, []);

  return (
    <div className={cn("relative flex flex-col w-full", className)}>
      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Day Selector with sliding indicator */}
      <div className="relative z-10 mb-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
          Your Itinerary
        </h3>
        <div className="relative flex overflow-x-auto space-x-2 pb-2">
          {itineraryData.days.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => scrollToDay(day.date)}
              className={cn(
                "relative px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-300",
                activeDay === day.date
                  ? "text-white"
                  : "text-blue-600 bg-blue-100 dark:bg-gray-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-gray-600"
              )}
            >
              {/* Sliding indicator */}
              {activeDay === day.date && (
                <motion.div
                  layoutId="day-indicator"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] shadow-md"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {day.label.split(":")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Itinerary Content */}
      <div className="flex-grow relative">
        {itineraryData.days.map((day, dayIndex) => (
          <div
            key={day.date}
            id={day.date}
            ref={(el) => { dayRefs.current[day.date] = el; }}
            className="mb-10 px-4 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <motion.h4
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center space-x-3"
            >
              <span>{day.label}</span>
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
              </span>
            </motion.h4>

            {/* Staggered cascade of activity cards */}
            <AnimatePresence mode="popLayout">
              {day.activities.map((activity, actIndex) => (
                <motion.div
                  key={activity.id}
                  custom={actIndex}
                  variants={activityVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-20px" }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 8px 30px rgba(30, 107, 154, 0.12)",
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 mb-3 bg-gradient-to-r from-blue-50 to-white dark:from-gray-700 dark:to-gray-650 rounded-xl shadow-sm border border-blue-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-gray-500 transition-colors cursor-default"
                >
                  <div className="flex items-center space-x-4">
                    <motion.span
                      className="text-xl font-semibold text-blue-600 dark:text-blue-400 w-20 text-right shrink-0"
                      whileHover={{ scale: 1.05, color: "#1E6B9A" }}
                    >
                      {activity.time}
                    </motion.span>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900 dark:text-white break-words">
                        {activity.name}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 break-words mt-0.5">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    {/* Subtle time indicator dot */}
                    <motion.div
                      className="h-2 w-2 rounded-full bg-blue-400 shrink-0"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryView;