import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MapPin, Sun, Utensils, Camera, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { RegistrationModal } from "@/components/auth/RegistrationModal";

/**
 * Animated text reveal — each word fades+slides up one by one.
 */
function AnimatedTitle({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.08,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Airplane SVG that flies slowly across the hero on desktop.
 */
function FlyingAirplane() {
  return (
    <motion.div
      className="pointer-events-none absolute z-10 hidden md:block"
      initial={{ left: "-8%", top: "18%", opacity: 0 }}
      animate={{
        left: ["-8%", "108%"],
        top: ["18%", "14%", "20%", "15%", "18%"],
        opacity: [0, 0.6, 0.8, 0.6, 0],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "linear",
        times: [0, 0.2, 0.5, 0.8, 1],
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-sky-500/50 drop-shadow-sm">
        <path
          d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
          fill="currentColor"
        />
      </svg>
    </motion.div>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) =>
      setIsLoggedIn(!!s?.user),
    );
    return () => subscription.unsubscribe();
  }, []);

  // Parallax on the hero background image
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);

  const itineraryDays = [
    { icon: MapPin, label: "Templo Uluwatu", time: "09:00" },
    { icon: Sun, label: "Playa Nusa Dua", time: "12:00" },
    { icon: Utensils, label: "Cena en Jimbaran", time: "19:00" },
    { icon: Camera, label: "Arrozales Jatiluwih", time: "10:00" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-32"
    >
      {/* Animated gradient background that shifts between blue pastel tones */}
      <div className="pointer-events-none absolute inset-0 animate-gradient-shift"
        style={{
          background: "linear-gradient(135deg, oklch(0.97 0.01 232), oklch(0.93 0.03 238), oklch(0.96 0.02 247), oklch(0.92 0.03 230))",
        }}
      />

      {/* Background blobs with parallax offset on desktop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full opacity-60 blur-3xl"
          style={{
            background: "radial-gradient(circle, oklch(0.926 0.029 238.249), transparent 70%)",
            ...(!isMobile ? { y: bgY } : {}),
          } as React.CSSProperties}
        />
        <motion.div
          className="absolute top-1/2 -left-32 h-[400px] w-[400px] rounded-full opacity-50 blur-3xl"
          style={{
            background: "radial-gradient(circle, oklch(0.856 0.041 239.082), transparent 70%)",
            ...(!isMobile ? { y: useTransform(scrollYProgress, [0, 1], ["0%", "15%"]) } : {}),
          } as React.CSSProperties}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full opacity-40 blur-3xl"
          style={{
            background: "radial-gradient(circle, oklch(0.837 0.056 236.834), transparent 70%)",
            ...(!isMobile ? { y: useTransform(scrollYProgress, [0, 1], ["0%", "20%"]) } : {}),
          } as React.CSSProperties}
        />
      </div>

      {/* Flying airplane */}
      <FlyingAirplane />

      <motion.div
        style={!isMobile ? { y: contentY } : undefined}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-4 py-1.5 text-sm font-medium text-sky-700 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("hero.badge")}</span>
            </motion.div>

            {/* Title with word-by-word reveal */}
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-sky-900 sm:text-5xl lg:text-6xl">
              <AnimatedTitle text={t("hero.title1")} delay={0.2} />
              <br />
              <span className="relative inline-block mt-2">
                <AnimatedTitle text={t("hero.title2")} delay={0.2 + (t("hero.title1").split(" ").length * 0.08)} />
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M2 8C50 2 100 2 150 8C200 14 250 14 298 8"
                    stroke="oklch(0.856 0.041 239.082)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-sky-600"
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                {mounted && isLoggedIn ? (
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl hover:shadow-[#1E6B9A]/35"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    {t("nav.myTrips")}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl hover:shadow-[#1E6B9A]/35"
                  >
                    {t("hero.ctaStart")}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
              </motion.div>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/60 px-7 py-3.5 text-base font-medium text-sky-700 backdrop-blur-sm transition-all hover:bg-sky-50"
              >
                {t("hero.ctaHow")}
              </motion.a>
            </motion.div>
          </div>

          {/* Visual - Bali Itinerary Card with floating animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto w-full max-w-md">
              {/* Decorative rings */}
              <motion.div
                className="absolute inset-0 -m-8 rounded-[2.5rem] border-2 border-dashed border-sky-200 opacity-60"
                animate={{ rotate: [0, 3, -2, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-0 -m-16 rounded-[3.5rem] border border-sky-100 opacity-40"
                animate={{ rotate: [0, -2, 3, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Main card — floats gently */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(30,107,154,0.14)] ring-1 ring-sky-100"
              >
                {/* Card header with parallax image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
                    alt="Bali"
                    className="h-full w-full object-cover transition-transform duration-[4000ms] hover:scale-110"
                    width={800}
                    height={300}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{t("hero.cardLabel")}</p>
                    <p className="text-xl font-bold text-white">Bali, Indonesia</p>
                  </div>
                  <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-sky-800 backdrop-blur-sm">
                    {t("hero.cardDays", { count: 7 })}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-sky-500">{t("hero.cardBudget")}</p>
                      <p className="text-lg font-bold text-sky-900">$1,200 USD</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600 ring-2 ring-white animate-float-card">
                        🏖️
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 ring-2 ring-white animate-float-card-2">
                        🌿
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 ring-2 ring-white animate-float-card-3">
                        🍜
                      </div>
                    </div>
                  </div>

                  {/* Activity list */}
                  <div className="mt-5 space-y-3">
                    {itineraryDays.map((day, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-3 rounded-xl bg-sky-50/60 px-4 py-3 hover:bg-sky-100/60 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                          <day.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sky-900 truncate">{day.label}</p>
                        </div>
                        <span className="text-xs font-medium text-sky-400">{day.time}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* AI badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                    className="mt-5 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3"
                  >
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    <p className="text-xs text-sky-600">
                      {t("hero.cardAI")} <span className="font-bold text-sky-700">{t("hero.cardAISeconds")}</span>
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <motion.path
            d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
            fill="oklch(0.972 0.009 232.363)"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          />
        </svg>
      </div>

      <RegistrationModal
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => {
          setShowRegistration(false);
          window.location.href = "/dashboard";
        }}
      />
    </section>
  );
}