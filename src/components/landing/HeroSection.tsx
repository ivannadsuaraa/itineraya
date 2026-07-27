import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DestinationTicker } from "@/components/airport/DestinationTicker";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LayoutDashboard, Map as MapIcon, Clock, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

// Entrada sutil — fade + leve subida — escalonada; nada de parallax ni 3D.
const heroItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (order: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.06 + order * 0.09 },
  }),
};

// Bali: destino más popular del feed público en el momento del rediseño.
const HERO_PHOTO = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80";

export function HeroSection() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Foto full-bleed del destino más popular — el overlay oscuro es lo
          único que garantiza legibilidad del texto encima, no es un efecto. */}
      <div className="absolute inset-0">
        <img
          src={HERO_PHOTO}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-32 pb-20 text-center sm:px-6 sm:pt-40 sm:pb-28">
        <motion.div initial={reduceMotion ? false : "hidden"} animate="visible">
          <motion.span
            variants={heroItem}
            custom={0}
            className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25"
          >
            <MapIcon className="h-3.5 w-3.5" />
            {t("hero.badge")}
          </motion.span>

          <motion.h1
            variants={heroItem}
            custom={1}
            className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl"
          >
            {t("hero.title1")} {t("hero.title2")}
          </motion.h1>

          <motion.p
            variants={heroItem}
            custom={2}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            variants={heroItem}
            custom={3}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {mounted && isLoggedIn ? (
              <Link
                to="/dashboard"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-black px-7 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.97]"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("hero.ctaMyTrips")}
              </Link>
            ) : (
              <Link
                to="/demo"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-black px-7 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.97]"
              >
                {t("hero.ctaDemo")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-6 text-sm font-medium text-white ring-1 ring-white/30 transition hover:bg-white/20"
            >
              {t("hero.ctaHow")}
            </a>
          </motion.div>

          {/* Diferenciadores en una línea: lo que un chat nunca da */}
          <motion.div
            variants={heroItem}
            custom={4}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/75"
          >
            <span className="flex items-center gap-1.5">
              <MapIcon className="h-3.5 w-3.5" />
              {t("hero.proofMap")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t("hero.proofSchedule")}
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {t("hero.proofPostcards")}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Ticker de salidas estilo panel de aeropuerto — borde inferior del hero */}
      <div className="relative z-10">
        <DestinationTicker label={t("hero.tickerLabel")} />
      </div>
    </section>
  );
}
