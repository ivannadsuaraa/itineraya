import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MapPin, Sun, Utensils, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { t } = useTranslation();
  const itineraryDays = [
    { icon: MapPin, label: "Templo Uluwatu", time: "09:00" },
    { icon: Sun, label: "Playa Nusa Dua", time: "12:00" },
    { icon: Utensils, label: "Cena en Jimbaran", time: "19:00" },
    { icon: Camera, label: "Arrozales Jatiluwih", time: "10:00" },
  ];
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-32">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.926 0.029 238.249), transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -left-32 h-[400px] w-[400px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.856 0.041 239.082), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.837 0.056 236.834), transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-medium text-sky-700"
            >
              <Sparkles className="h-4 w-4" />
              <span>Impulsado por Inteligencia Artificial</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-sky-900 sm:text-5xl lg:text-6xl"
            >
              Tu viaje perfecto,{" "}
              <span className="relative">
                creado en segundos
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8C50 2 100 2 150 8C200 14 250 14 298 8"
                    stroke="oklch(0.856 0.041 239.082)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-sky-600"
            >
              Itineraya transforma tus sueños de viaje en itinerarios personalizados. Dinos tu destino y deja que la IA haga el resto.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl hover:shadow-[#1E6B9A]/35 hover:scale-[1.02]"
              >
                Empieza gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/60 px-7 py-3.5 text-base font-medium text-sky-700 backdrop-blur-sm transition-all hover:bg-sky-50"
              >
                Cómo funciona
              </a>
            </motion.div>
          </div>

          {/* Visual - Bali Itinerary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto w-full max-w-md">
              {/* Decorative rings */}
              <div className="absolute inset-0 -m-8 rounded-[2.5rem] border-2 border-dashed border-sky-200 opacity-60" />
              <div className="absolute inset-0 -m-16 rounded-[3.5rem] border border-sky-100 opacity-40" />

              {/* Main card */}
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(30,107,154,0.14)] ring-1 ring-sky-100">
                {/* Card header with image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80"
                    alt="Bali"
                    className="h-full w-full object-cover"
                    width={800}
                    height={300}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Itinerario generado</p>
                    <p className="text-xl font-bold text-white">Bali, Indonesia</p>
                  </div>
                  <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-sky-800 backdrop-blur-sm">
                    7 días
                  </div>
                </div>

                {/* Card body */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-sky-500">Presupuesto estimado</p>
                      <p className="text-lg font-bold text-sky-900">$1,200 USD</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600 ring-2 ring-white">
                        🏖️
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 ring-2 ring-white">
                        🌿
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 ring-2 ring-white">
                        🍜
                      </div>
                    </div>
                  </div>

                  {/* Activity list */}
                  <div className="mt-5 space-y-3">
                    {itineraryDays.map((day, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-sky-50/60 px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                          <day.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sky-900 truncate">{day.label}</p>
                        </div>
                        <span className="text-xs font-medium text-sky-400">{day.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI badge */}
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    <p className="text-xs text-sky-600">Generado por IA en <span className="font-bold text-sky-700">12 segundos</span></p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
            fill="oklch(0.972 0.009 232.363)"
          />
        </svg>
      </div>
    </section>
  );
}
