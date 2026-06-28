import { motion } from "framer-motion";

/**
 * SuccessCheckmark — a checkmark that draws itself on mount.
 * Used for form submission success states, confirmations, etc.
 */
export function SuccessCheckmark({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative ${className}`}
    >
      {/* Outer circle */}
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <motion.circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="oklch(0.5 0.15 150)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Checkmark */}
        <motion.path
          d="M18 32l10 10 18-18"
          fill="none"
          stroke="oklch(0.5 0.15 150)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}