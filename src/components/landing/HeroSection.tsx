import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DestinationTicker } from "@/components/airport/DestinationTicker";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Sun,
  Utensils,
  Camera,
  LayoutDashboard,
  Map as MapIcon,
  Clock,
  Download,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

// Hero Bento: claridad y velocidad sobre espectáculo. Una entrada sutil —
// fade + leve subida — escalonada; nada de parallax ni 3D. El protagonista es
// el producto real (la tarjeta de itinerario), no los efectos.
const heroItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (order: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.06 + order * 0.09 },
  }),
};

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

  // Contenido del mockup: nombres propios reales de Bali (no se traducen) y
  // líneas de transporte solo con emoji + minutos para ser neutrales al idioma.
  const itineraryDays = [
    { icon: MapPin, label: "Templo Uluwatu", time: "09:00", transport: null },
    { icon: Sun, label: "Playa Nusa Dua", time: "12:00", transport: "🚕 25 min" },
    { icon: Utensils, label: "Warung Jimbaran", time: "19:00", transport: "🚶 12 min" },
    { icon: Camera, label: "Arrozales Jatiluwih", time: "10:00", transport: "🚗 40 min" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0c1a2e] pt-28 pb-24 sm:pt-32 sm:pb-28">
      {/* Un único resplandor sky muy sutil — cero ruido, solo profundidad. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-[-10%] h-80 w-80 rounded-full bg-[#38bdf8]/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Text side ── */}
          <motion.div
            className="max-w-xl"
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
          >
            <motion.span
              variants={heroItem}
              custom={0}
              className="inline-flex items-center gap-2 rounded-full bg-[#38bdf8]/10 px-3.5 py-1.5 text-xs font-semibold text-[#38bdf8] ring-1 ring-[#38bdf8]/25"
            >
              <MapIcon className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </motion.span>

            <motion.h1
              variants={heroItem}
              custom={1}
              className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              {t("hero.title1")}{" "}
              <span className="relative text-[#38bdf8]">
                {t("hero.title2")}
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  viewBox="0 0 300 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 6C50 1 100 1 150 6C200 11 250 11 298 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-[#38bdf8]/60"
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              custom={2}
              className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              variants={heroItem}
              custom={3}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {mounted && isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#38bdf8] px-7 py-3.5 text-sm font-bold text-[#0c1a2e] transition hover:bg-[#5cc7f9] active:scale-[0.97]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("hero.ctaMyTrips")}
                </Link>
              ) : (
                <Link
                  to="/demo"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#38bdf8] px-7 py-3.5 text-sm font-bold text-[#0c1a2e] transition hover:bg-[#5cc7f9] active:scale-[0.97]"
                >
                  {t("hero.ctaDemo")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-medium text-white/90 transition hover:border-white/35 hover:bg-white/5"
              >
                {t("hero.ctaHow")}
              </a>
            </motion.div>

            {/* Diferenciadores en una línea: lo que un chat nunca da */}
            <motion.div
              variants={heroItem}
              custom={4}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/55"
            >
              <span className="flex items-center gap-1.5">
                <MapIcon className="h-3.5 w-3.5 text-[#38bdf8]" />
                {t("hero.proofMap")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#38bdf8]" />
                {t("hero.proofSchedule")}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 text-[#38bdf8]" />
                {t("hero.proofPostcards")}
              </span>
            </motion.div>
          </motion.div>

          {/* ── Product mockup side (el producto real, visible también en móvil) ── */}
          <motion.div
            className="relative mx-auto w-full max-w-sm lg:max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
          >
            {/* Main card: un día real del itinerario */}
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/40">
              {/* Header image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
                  alt="Bali"
                  className="h-full w-full object-cover"
                  width={800}
                  height={300}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="inline-flex items-center rounded-full bg-[#38bdf8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0c1a2e] shadow-sm">
                    {t("hero.cardDayLabel")}
                  </span>
                  <p className="mt-1 text-lg font-bold text-white">Bali, Indonesia</p>
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-[#0c1a2e]">
                  {t("hero.cardDays", { count: 7 })}
                </div>
              </div>

              {/* Body: agenda con horarios y transporte */}
              <div className="p-4">
                <div className="space-y-2">
                  {itineraryDays.map((day, i) => (
                    <div key={i} className="rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[#0c1a2e] text-white">
                          <span className="text-[10px] font-bold leading-none">{day.time}</span>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#38bdf8]/15 text-[#0ea5e9]">
                          <day.icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="flex-1 truncate text-xs font-semibold text-slate-800">
                          {day.label}
                        </p>
                      </div>
                      {day.transport && (
                        <p className="mt-1 pl-[54px] text-[10px] text-slate-400">{day.transport}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#38bdf8]/20 bg-[#38bdf8]/5 px-3 py-2">
                  <MapIcon className="h-3.5 w-3.5 shrink-0 text-[#0ea5e9]" />
                  <p className="text-xs text-slate-600">{t("hero.cardFooter")}</p>
                </div>
              </div>
            </div>

            {/* Floating mini-map: el recorrido del día — estático, entra con fade */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.7 }}
              className="absolute -right-4 -top-6 hidden w-36 rotate-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:block sm:-right-8 sm:w-40"
            >
              <div className="relative h-24 bg-slate-50">
                <svg
                  viewBox="0 0 160 96"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <path
                    d="M8 80 Q 50 60 70 44 T 148 14"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="5 4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 30 H160 M0 62 H160 M40 0 V96 M104 0 V96"
                    stroke="#dbeafe"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
                {[
                  { x: "3%", y: "72%", n: 1 },
                  { x: "40%", y: "38%", n: 2 },
                  { x: "84%", y: "6%", n: 3 },
                ].map((p) => (
                  <span
                    key={p.n}
                    className="absolute grid h-5 w-5 place-items-center rounded-full bg-[#0c1a2e] text-[9px] font-bold text-white ring-2 ring-white"
                    style={{ left: p.x, top: p.y }}
                  >
                    {p.n}
                  </span>
                ))}
              </div>
              <p className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700">
                <MapIcon className="h-3 w-3 text-[#0ea5e9]" />
                {t("hero.mapChip")}
              </p>
            </motion.div>

            {/* Floating postcard chip — estático */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.82 }}
              className="absolute -bottom-5 -left-3 flex -rotate-2 items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-xl ring-1 ring-slate-200 sm:-left-6"
            >
              <img
                src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=120&q=60"
                alt=""
                aria-hidden
                className="h-9 w-9 rounded-lg object-cover"
                width={120}
                height={120}
              />
              <div>
                <p className="text-[10px] font-bold text-slate-800">{t("hero.postcardChip")}</p>
                <p className="flex items-center gap-1 text-[9px] text-slate-400">
                  <Download className="h-2.5 w-2.5" />
                  PNG
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Ticker de salidas estilo panel de aeropuerto — borde inferior del hero */}
      <div className="absolute bottom-0 left-0 right-0">
        <DestinationTicker label={t("hero.tickerLabel")} />
      </div>
    </section>
  );
}
