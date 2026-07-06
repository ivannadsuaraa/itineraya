// Vocabulario de motion compartido de Itineraya. Una sola fuente de timing y
// easing para que toda la app respire al mismo ritmo.
//
// Reglas de la casa:
// - UI siempre con ease-out expresivo (EASE_OUT), nunca ease-in en entradas.
// - Móvil más rápido que desktop (200 ms vs 300 ms) — se percibe más ágil.
// - Todo lo que se mueve respeta prefers-reduced-motion (useReducedMotion
//   en framer-motion + kill-switch global en styles.css).

import type { Transition, Variants } from "framer-motion";

/** Curva principal de la app — ease-out-quint con carácter. */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** Duración base según dispositivo. */
export function baseDuration(isMobile: boolean): number {
  return isMobile ? 0.2 : 0.3;
}

export function pageTransition(isMobile: boolean): Transition {
  return { duration: baseDuration(isMobile), ease: EASE_OUT };
}

// ── Variantes de entrada por página: cada superficie tiene su personalidad ──

/** Dashboard: sube desde abajo, sereno. */
export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

/** Detalle de viaje: revelado fotográfico — fade con desenfoque que enfoca. */
export const focusVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  visible: { opacity: 1, filter: "blur(0px)" },
};

/** Feed / exploración: entra con una pizca de escala, editorial. */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.985, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

/** Elementos en cascada (cards). El contenedor orquesta el stagger. */
export const staggerContainer = (stagger = 0.055): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};
