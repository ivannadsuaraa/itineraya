// Barra de progreso de lectura fijada arriba: scaleX ligado al scroll de la
// página con un muelle suave. GPU-only, sin re-renders (motion value directo).

import { motion, useScroll, useSpring } from "framer-motion";

export function ReadingProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#1E6B9A] via-sky-400 to-sky-300 ${className ?? ""}`}
    />
  );
}
