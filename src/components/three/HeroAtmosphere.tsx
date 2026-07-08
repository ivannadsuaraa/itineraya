// Wrapper cliente del hero 3D. Decide SI se monta la escena pesada y con qué
// presupuesto de rendimiento. Reglas:
//   • SSR / primer render: nada (la escena es client-only).
//   • prefers-reduced-motion: NO se monta 3D — fallback CSS estático.
//   • Móvil / pantalla pequeña: NO se monta 3D — fallback CSS (móvil sin lag).
//   • Save-Data o pocos núcleos: se monta sin postprocessing.
//   • Sólo se importa el chunk de three cuando de verdad se va a renderizar.
//
// El fallback comparte la paleta (navy → sky) para que no haya flash ni salto
// cuando el <Canvas> aparece con un fade.

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroAtmosphereScene = lazy(() => import("./HeroAtmosphereScene"));

/** Fondo CSS que imita la atmósfera — se usa como fallback y como base bajo el
 *  canvas mientras carga. Cero JS, cero WebGL. */
function AtmosphereFallback() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 90% at 62% 120%, #0b2b47 0%, #071a2e 42%, #050b16 78%)",
        }}
      />
      {/* Halo de atmósfera del planeta que asoma por abajo */}
      <div
        className="absolute -bottom-[38%] left-1/2 h-[70vw] w-[70vw] max-h-[620px] max-w-[620px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(125,211,252,0.22) 0%, rgba(30,107,154,0.10) 45%, transparent 68%)",
          filter: "blur(6px)",
        }}
      />
      {/* Estrellas sutiles pintadas con gradientes (sin imágenes) */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 75% 18%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 45% 55%, rgba(255,255,255,0.5), transparent), radial-gradient(1.5px 1.5px at 88% 42%, rgba(255,255,255,0.45), transparent), radial-gradient(1px 1px at 12% 62%, rgba(255,255,255,0.5), transparent)",
        }}
      />
    </div>
  );
}

export function HeroAtmosphere({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [budget, setBudget] = useState<{ maxDpr: number; postprocessing: boolean }>({
    maxDpr: 2,
    postprocessing: true,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Presupuesto de rendimiento según el equipo.
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const lowPower =
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 4 ||
      nav.connection?.saveData === true;
    setBudget({
      maxDpr: lowPower ? 1.5 : 2,
      postprocessing: !lowPower,
    });
  }, []);

  // Sólo montamos el WebGL cuando el hero está realmente en pantalla.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "200px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const use3D = mounted && !reduce && !isMobile;

  return (
    <div ref={containerRef} className={`absolute inset-0 ${className}`}>
      <AtmosphereFallback />
      {use3D && visible && (
        <Suspense fallback={null}>
          <div
            className="absolute inset-0"
            style={{
              animation: "hero3d-fade-in 1200ms cubic-bezier(0.23,1,0.32,1) both",
            }}
          >
            <HeroAtmosphereScene maxDpr={budget.maxDpr} />
          </div>
          <style>{`
            @keyframes hero3d-fade-in { from { opacity: 0 } to { opacity: 1 } }
          `}</style>
        </Suspense>
      )}
    </div>
  );
}
