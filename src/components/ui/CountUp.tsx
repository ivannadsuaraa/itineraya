// Contador que anima de 0 al valor final la primera vez que entra en el
// viewport. Escribe en el DOM vía ref (sin re-render por frame) y con
// prefers-reduced-motion muestra el valor final directamente.

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

export function CountUp({
  to,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  locale = "es",
}: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  const fmt = (v: number) =>
    `${prefix}${v.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = fmt(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, duration, reduce]);

  // Reserva el ancho final desde el principio para no provocar layout shift.
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`} aria-label={fmt(to)}>
      {reduce ? fmt(to) : fmt(0)}
    </span>
  );
}
