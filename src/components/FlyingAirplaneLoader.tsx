import { motion } from "framer-motion";

/**
 * FlyingAirplaneLoader — an animated airplane that flies across the screen
 * with a trailing line, used instead of a spinner for loading states.
 */
export function FlyingAirplaneLoader({ text }: { text?: string }) {
  return (
    <div className="relative flex h-40 w-full items-center justify-center overflow-hidden">
      {/* Airplane */}
      <motion.div
        className="absolute z-10"
        initial={{ left: "-15%", top: "40%" }}
        animate={{
          left: ["-15%", "115%"],
          top: ["40%", "35%", "45%", "38%", "40%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[#1E6B9A] drop-shadow-md"
        >
          <path
            d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      {/* Trail dots */}
      <div className="flex items-center gap-2 mt-20">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2]"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {text && (
        <motion.p
          className="absolute bottom-0 text-sm font-medium text-sky-600"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}