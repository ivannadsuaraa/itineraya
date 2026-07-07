// Transición direccional entre páginas: el contenido sale hacia la izquierda
// y entra desde la derecha, sin cambios bruscos de pantalla. La salida es más
// corta que la entrada (el sistema responde rápido; la llegada se disfruta).

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EASE_OUT, baseDuration } from "@/lib/motion";

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dur = baseDuration(isMobile);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        suppressHydrationWarning
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
        animate={{
          opacity: 1,
          x: 0,
          transition: { duration: dur, ease: EASE_OUT },
        }}
        exit={
          reduce
            ? { opacity: 0, transition: { duration: 0.1 } }
            : { opacity: 0, x: -16, transition: { duration: dur * 0.5, ease: EASE_OUT } }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
