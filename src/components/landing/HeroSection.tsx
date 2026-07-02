import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MapPin, Sun, Utensils, Camera, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { supabase } from "@/integrations/supabase/client";

export function HeroSection() {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setIsLoggedIn(!!session?.user),
    );
    return () => subscription.unsubscribe();
  }, []);

  const itineraryDays = [
    { icon: MapPin, label: "Templo Uluwatu", time: "09:00" },
    { icon: Sun, label: "Playa Nusa Dua", time: "12:00" },
    { icon: Utensils, label: "Cena en Jimbaran", time: "19:00" },
    { icon: Camera, label: "Arrozales Jatiluwih", time: "10:00" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 via-sky-900 to-sky-800 pt-28 pb-24 sm:pt-36 sm:pb-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-[480px] w-[480px] rounded-full bg-sky-700/25 blur-3xl" />
        <div className="absolute top-1/2 -left-32 h-[360px] w-[360px] rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-[280px] w-[280px] rounded-full bg-sky-600/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* ── Text side ── */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sky-200 ring-1 ring-white/20 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </span>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("hero.title1")}{" "}
              <span className="relative text-sky-300">
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
                    className="text-sky-400/70"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 text-base leading-relaxed text-sky-200 sm:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {mounted && isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-sky-900 shadow-lg transition hover:bg-sky-50 hover:shadow-xl active:scale-[0.97]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("hero.ctaMyTrips")}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal({ mode: "signup" })}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-sky-900 shadow-lg transition hover:bg-sky-50 hover:shadow-xl active:scale-[0.97]"
                >
                  {t("hero.ctaStart")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
              >
                {t("hero.ctaHow")}
              </a>
            </div>

            {/* Social proof micro-strip */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["sky", "emerald", "violet", "amber"].map((c, i) => (
                  <div
                    key={i}
                    className={`grid h-8 w-8 place-items-center rounded-full bg-${c}-500/30 text-xs font-bold text-${c}-200 ring-2 ring-sky-900`}
                  >
                    {["A", "M", "J", "L"][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-sky-300">{t("hero.socialProof")}</p>
            </div>
          </div>

          {/* ── Card side ── */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto w-full max-w-sm">
              {/* Decorative rings */}
              <div className="absolute inset-0 -m-6 rounded-[2rem] border border-white/10" />
              <div className="absolute inset-0 -m-12 rounded-[2.5rem] border border-white/5" />

              {/* Main card */}
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30">
                {/* Header image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
                    alt="Bali"
                    className="h-full w-full object-cover"
                    width={800}
                    height={300}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">{t("hero.cardLabel")}</p>
                    <p className="text-lg font-bold text-white">Bali, Indonesia</p>
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                    {t("hero.cardDays", { count: 7 })}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">{t("hero.cardBudget")}</p>
                      <p className="text-base font-bold text-slate-900">$1,200 USD</p>
                    </div>
                    <div className="flex -space-x-1.5">
                      {["🏖️", "🌿", "🍜"].map((e, i) => (
                        <div key={i} className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs ring-2 ring-white">
                          {e}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {itineraryDays.map((day, i) => (
                      <div key={i} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                          <day.icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="flex-1 truncate text-xs font-medium text-slate-800">{day.label}</p>
                        <span className="text-[10px] font-medium text-slate-400">{day.time}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                    <p className="text-xs text-sky-600">
                      {t("hero.cardAI")} <span className="font-bold text-sky-700">{t("hero.cardAISeconds")}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave transition to next section */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 30C360 60 720 0 1080 30C1260 45 1380 30 1440 30V60H0V30Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
