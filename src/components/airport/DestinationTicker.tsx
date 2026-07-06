// Ticker de destinos del hero, estilo panel de salidas: un destino rotando
// con efecto flip cada pocos segundos sobre una línea de "pista" punteada.

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { FlipText } from "./FlipText";

const DESTINATIONS = [
  "PARIS",
  "TOKYO",
  "BALI",
  "NEW YORK",
  "BARCELONA",
  "ROMA",
  "LISBOA",
  "MARRAKECH",
  "KYOTO",
  "REYKJAVIK",
] as const;

export function DestinationTicker({ label }: { label: string }) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % DESTINATIONS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative border-t border-white/10 bg-sky-950/60 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <span className="flex shrink-0 items-center gap-2 font-flight text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
          <Plane className="h-3.5 w-3.5 -rotate-45 text-sky-300" />
          {label}
        </span>
        {/* Línea de pista */}
        <span
          aria-hidden
          className="h-px flex-1 bg-[repeating-linear-gradient(90deg,rgba(125,211,252,0.45)_0_14px,transparent_14px_26px)]"
        />
        <FlipText
          key={idx}
          text={DESTINATIONS[idx]}
          charDelay={55}
          className="shrink-0 text-sm font-bold tracking-[0.28em] text-amber-300 sm:text-base"
        />
      </div>
    </div>
  );
}
