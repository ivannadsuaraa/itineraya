// Entrada con personalidad por página. La transición direccional entre rutas
// vive en RouteTransition (eje X, global); esta capa aporta el carácter de
// cada superficie en un eje distinto (Y / blur / escala) para no competir.

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { baseDuration, EASE_OUT, focusVariants, riseVariants, scaleInVariants } from "@/lib/motion";

type Personality = "rise" | "focus" | "scale";

const VARIANTS: Record<Personality, Variants> = {
  rise: riseVariants,
  focus: focusVariants,
  scale: scaleInVariants,
};

interface Props {
  children: ReactNode;
  className?: string;
  /** rise = dashboard, focus = detalle fotográfico, scale = feed/editorial. */
  personality?: Personality;
}

export function PageTransition({ children, className, personality = "rise" }: Props) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();

  return (
    <motion.div
      variants={
        reduce ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : VARIANTS[personality]
      }
      initial="hidden"
      animate="visible"
      transition={{ duration: baseDuration(isMobile) + 0.05, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
