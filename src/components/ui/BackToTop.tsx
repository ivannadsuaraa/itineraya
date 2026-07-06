// Botón flotante "volver arriba": aparece al pasar el umbral de scroll y
// desaparece cerca del inicio. Usa useScroll de framer (sin listeners de
// scroll manuales) y setState solo al cruzar el umbral.

import { useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EASE_OUT } from "@/lib/motion";

export function BackToTop({ threshold = 640 }: { threshold?: number }) {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > threshold;
    if (next !== visible) setVisible(next);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("common.backToTop")}
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-sky-900 text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-800 active:scale-95 md:bottom-6 md:right-6"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
