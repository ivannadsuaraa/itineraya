import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * AnimatedBackground — subtle living gradient + floating particles.
 *
 * Renders a fixed backdrop that slowly shifts hue and optionally shows
 * barely-visible floating specks.  Pure transform/opacity — no layout thrash.
 */
export function AnimatedBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: ((i * 37 + 13) % 100) / 100,
        y: ((i * 53 + 7) % 100) / 100,
        size: 1.5 + (i % 3) * 1.2,
        delay: (i * 0.7) % 6,
        duration: 6 + (i % 4) * 3,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      {/* Animated gradient orb #1 — slow breathing shift */}
      <motion.div
        className="absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full opacity-[0.08] blur-3xl"
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
        className="absolute -bottom-1/4 -right-1/4 h-[55vh] w-[55vh] rounded-full opacity-[0.06] blur-3xl"
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
        className="absolute left-1/3 top-1/3 h-[40vh] w-[40vh] rounded-full opacity-[0.04] blur-3xl"
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