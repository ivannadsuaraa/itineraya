// Revelado al entrar en viewport, con una dirección por sección para que la
// landing no repita el mismo gesto ocho veces. GPU-only (transform/opacity/
// filter), IntersectionObserver vía whileInView y respeto total a
// prefers-reduced-motion. `will-change` solo vive mientras anima framer.

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { EASE_OUT } from "@/lib/motion";

export type RevealDirection = "up" | "left" | "right" | "scale" | "blur";

const HIDDEN: Record<RevealDirection, Record<string, number | string>> = {
  up: { opacity: 0, y: 32 },
  left: { opacity: 0, x: -44 },
  right: { opacity: 0, x: 44 },
  scale: { opacity: 0, scale: 0.93 },
  blur: { opacity: 0, y: 14, filter: "blur(10px)" },
};

const VISIBLE: Record<RevealDirection, Record<string, number | string>> = {
  up: { opacity: 1, y: 0 },
  left: { opacity: 1, x: 0 },
  right: { opacity: 1, x: 0 },
  scale: { opacity: 1, scale: 1 },
  blur: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration,
  amount = 0.2,
  className,
}: {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  /** Fracción visible que dispara el revelado. */
  amount?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={HIDDEN[direction]}
      whileInView={VISIBLE[direction]}
      viewport={{ once: true, amount }}
      transition={{
        duration: duration ?? (isMobile ? 0.45 : 0.65),
        ease: EASE_OUT,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Cascadas con stagger orquestado por el contenedor ──────────────────────

export function revealGroupVariants(stagger: number, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

/** Contenedor de cascada: los hijos usan <RevealItem>. */
export function RevealGroup({
  children,
  stagger = 0.08,
  delayChildren = 0,
  amount = 0.12,
  className,
}: {
  children: ReactNode;
  /** Segundos entre hijos (0.08 = 80 ms). */
  stagger?: number;
  delayChildren?: number;
  amount?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={revealGroupVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  variants = revealItemVariants,
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
