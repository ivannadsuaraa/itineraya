import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
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
              Itineraya transforma tus sueu00f1os de viaje en itinerarios personalizados. Dinos tu destino y deja que la IA haga el resto.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href="#"
                className="group inline-flex items-center gap-2 rounded-full bg-sky-700 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-700/20 transition-all hover:bg-sky-800 hover:shadow-xl hover:shadow-sky-700/30"
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/60 px-7 py-3.5 text-base font-medium text-sky-700 backdrop-blur-sm transition-all hover:bg-sky-50"
              >
                Cu00f3mo funciona
              </a>
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto w-full max-w-md">
              {/* Decorative rings */}
              <div className="absolute inset-0 -m-8 rounded-[2.5rem] border-2 border-dashed border-sky-200 opacity-60" />
              <div className="absolute inset-0 -m-16 rounded-[3.5rem] border border-sky-100 opacity-40" />

              <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_24px_64px_rgba(46,107,138,0.12)] ring-1 ring-sky-100">
                <img
                  src="/images/phone-mockup.jpg"
                  alt="Itineraya app preview"
                  className="h-auto w-full object-cover"
                  width={800}
                  height={800}
                />
                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-md ring-1 ring-sky-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <Sparkles className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-sky-900">Itinerario listo</p>
                      <p className="text-xs text-sky-500">Roma u00b7 5 du00edas u00b7 12 actividades</p>
                    </div>
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
