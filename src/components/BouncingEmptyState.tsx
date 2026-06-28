import { motion } from "framer-motion";

interface BouncingEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * BouncingEmptyState — a gentle emptiness animation:
 * a suitcase bounces, a compass spins, paired with a message.
 */
export function BouncingEmptyState({ icon = "🧳", title, description, action }: BouncingEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Bouncing icon */}
      <motion.div
        className="text-6xl mb-6 select-none"
        animate={{
          y: [0, -12, 0],
          rotate: [0, -3, 3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-xl font-bold text-sky-900 font-display"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-2 max-w-xs text-sm text-sky-600"
        >
          {description}
        </motion.p>
      )}

      {/* Action */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}