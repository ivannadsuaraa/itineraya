import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * AnimatedBackground — living backdrop with slow-shifting gradient orbs,
 * floating particles, and subtle ambient icons (compass, map-pin) that
 * drift lazily across the screen.  Pure transform/opacity — no layout thrash.
 */
export function AnimatedBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: ((i * 37 + 13) % 100) / 100,
        y: ((i * 53 + 7) % 100) / 100,
        size: 1.5 + (i % 3) * 1.2,
        delay: (i * 0.7) % 6,
        duration: 6 + (i % 4) * 3,
      })),
    [],
  );

  const ambientIcons = useMemo(
    () =>
      [
        { symbol: "🧭", x: 8, y: 20, delay: 0, dur: 28 },
        { symbol: "🗺️", x: 85, y: 70, delay: 3, dur: 32 },
        { symbol: "📍", x: 20, y: 80, delay: 6, dur: 26 },
        { symbol: "🧳", x: 75, y: 15, delay: 2, dur: 30 },
        { symbol: "✈️", x: 50, y: 85, delay: 8, dur: 24 },
        { symbol: "🌴", x: 65, y: 40, delay: 4, dur: 34 },
      ] as const,
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      {/* Animated gradient orb #1 — slow breathing shift */}
      <motion.div
        className="absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.12 250), transparent 70%)" }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated gradient orb #2 — complementary hue, opposite drift */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[55vh] w-[55vh] rounded-full opacity-[0.08] blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.10 200), transparent 70%)" }}
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.92, 1.06, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated gradient orb #3 — very subtle warm accent */}
      <motion.div
        className="absolute left-1/3 top-1/3 h-[40vh] w-[40vh] rounded-full opacity-[0.05] blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.08 80), transparent 70%)" }}
        animate={{
          x: [0, 20, -30, 10, 0],
          y: [0, -15, 25, -10, 0],
          scale: [1, 1.04, 0.96, 1.02, 1],
        }}
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ambient floating icons — drift very slowly, barely noticeable */}
      {ambientIcons.map((icon) => (
        <motion.div
          key={icon.symbol}
          className="absolute select-none text-lg opacity-[0.07] md:opacity-[0.10]"
          style={{ left: `${icon.x}%`, top: `${icon.y}%` }}
          animate={{
            y: [0, -20, 10, -12, 0],
            x: [0, 8, -6, 10, 0],
            rotate: [0, 5, -3, 4, 0],
            opacity: [0.07, 0.12, 0.06, 0.10, 0.07],
          }}
          transition={{
            duration: icon.dur,
            delay: icon.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {icon.symbol}
        </motion.div>
      ))}

      {/* Floating particles — barely visible, no continuous large motion */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-sky-400"
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0, 0.35, 0],
            y: [0, -12, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}