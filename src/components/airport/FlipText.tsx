// Efecto "split-flap" de panel de aeropuerto: cada letra recorre caracteres
// aleatorios y se asienta de izquierda a derecha, como los paneles mecánicos.
// Un solo intervalo por componente, texto siempre monoespaciado y en
// mayúsculas. Se degrada a texto estático con prefers-reduced-motion o en
// dispositivos de gama baja (≤ 4 GB de RAM detectados).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Gama baja: deviceMemory ≤ 4 GB (si el navegador lo expone) o ≤ 2 núcleos. */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) return true;
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2) return true;
  return false;
}

export function FlipText({
  text,
  className,
  delay = 0,
  charDelay = 45,
  flipInterval = 42,
}: {
  text: string;
  className?: string;
  /** ms antes de que empiece a girar la primera letra. */
  delay?: number;
  /** ms entre la resolución de una letra y la siguiente. */
  charDelay?: number;
  flipInterval?: number;
}) {
  const target = text.toUpperCase();
  const reduce = useReducedMotion();
  const [lowEnd, setLowEnd] = useState(true); // SSR-safe: estático hasta montar
  const [display, setDisplay] = useState(target);
  const frame = useRef(0);

  useEffect(() => {
    setLowEnd(isLowEndDevice());
  }, []);

  useEffect(() => {
    if (reduce || lowEnd) {
      setDisplay(target);
      return;
    }
    frame.current = 0;
    let started = false;
    const startAt = performance.now() + delay;
    const id = window.setInterval(() => {
      const now = performance.now();
      if (now < startAt) return;
      started = true;
      const elapsed = now - startAt;
      let done = true;
      const next = target
        .split("")
        .map((ch, i) => {
          if (ch === " " || ch === "·") return ch;
          if (elapsed >= i * charDelay + 260) return ch; // letra asentada
          done = false;
          return FLAP_CHARS[(Math.random() * FLAP_CHARS.length) | 0];
        })
        .join("");
      setDisplay(next);
      if (done && started) window.clearInterval(id);
    }, flipInterval);
    return () => window.clearInterval(id);
  }, [target, reduce, lowEnd, delay, charDelay, flipInterval]);

  return (
    <span className={`font-flight uppercase tabular-nums ${className ?? ""}`} aria-label={target}>
      {display}
    </span>
  );
}
