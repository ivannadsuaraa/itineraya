// Animación de "despegue" al terminar el onboarding: pista con luces que
// aceleran, avión que rota y despega, y texto de torre de control. Dura
// ~1.6 s y llama a onDone. Con prefers-reduced-motion no se muestra.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlipText } from "./FlipText";

export function TakeoffOverlay({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = window.setTimeout(onDone, reduce ? 0 : 1650);
    return () => window.clearTimeout(id);
  }, [onDone, reduce]);

  if (reduce || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-[#050b16]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-label={t("airport.takeoff")}
    >
      {/* Luces de pista que aceleran hacia abajo (sensación de avance) */}
      <div aria-hidden className="absolute inset-0 flex justify-center">
        <motion.div
          className="w-1.5 bg-[repeating-linear-gradient(180deg,rgba(251,191,36,0.75)_0_26px,transparent_26px_78px)]"
          style={{ height: "300%" }}
          initial={{ y: "-45%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 1.6, ease: [0.55, 0, 0.85, 0.4] }}
        />
      </div>
      <div aria-hidden className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 gap-40">
        <span className="w-px bg-white/10" />
        <span className="w-px bg-white/10" />
      </div>

      {/* Avión: rueda, rota y despega */}
      <motion.div
        initial={{ y: 90, x: 0, rotate: 0, scale: 1 }}
        animate={{ y: [90, 30, -40, -280], rotate: [0, -4, -14, -18], scale: [1, 1, 1.04, 0.92] }}
        transition={{ duration: 1.6, times: [0, 0.4, 0.7, 1], ease: [0.5, 0, 0.8, 0.4] }}
        className="relative"
      >
        <Plane className="h-16 w-16 -rotate-45 text-white drop-shadow-[0_0_24px_rgba(56,189,248,0.55)]" />
      </motion.div>

      <div className="relative mt-10 text-center">
        <FlipText
          text={t("airport.takeoff")}
          charDelay={60}
          className="text-lg font-bold tracking-[0.4em] text-amber-300"
        />
        <p className="mt-2 font-flight text-[11px] uppercase tracking-[0.3em] text-sky-300/70">
          {t("airport.takeoffSub")}
        </p>
      </div>
    </motion.div>,
    document.body,
  );
}
