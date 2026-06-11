import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, ArrowRight, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/welcome")({
  ssr: false,
  head: () => ({ meta: [{ title: "Bienvenido a Itineraya" }] }),
  component: WelcomePage,
});

const LANGUAGES = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

function WelcomePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(28);
  const [language, setLanguage] = useState("es");
  const [saving, setSaving] = useState(false);

  // Skip if already completed
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("welcome_completed, age, language")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data?.welcome_completed) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        if (data?.age) setAge(data.age);
        if (data?.language) setLanguage(data.language);
      }
    })();
  }, [navigate]);

  const finish = async () => {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update({ age, language, welcome_completed: true })
        .eq("id", u.user.id);
      if (error) throw error;
      document.documentElement.lang = language;
      try {
        localStorage.setItem("itineraya:lang", language);
      } catch {
        /* ignore */
      }
      toast.success("¡Todo listo!");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      setSaving(false);
    }
  };

  const ageLabel = age >= 99 ? "99+" : String(age);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-12">
        <Link to="/dashboard" className="mb-8 flex flex-col items-center gap-2 text-sky-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E6B9A] shadow-lg shadow-[#1E6B9A]/30">
            <Plane className="h-7 w-7 rotate-[-45deg] text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">Itineraya</span>
        </Link>

        {/* Progress */}
        <div className="mb-6 flex w-full max-w-xs items-center gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[#1E6B9A]" : "bg-sky-200"
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl bg-white/85 p-8 shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60"
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="age"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-sm font-semibold text-sky-600">Paso 1 de 2</p>
                <h1 className="font-display text-2xl font-bold text-sky-900">
                  ¿Cuántos años tienes?
                </h1>
                <p className="mt-1 text-sm text-sky-600">
                  Adaptaremos las recomendaciones a tu perfil.
                </p>

                <div className="mt-10 text-center">
                  <motion.div
                    key={ageLabel}
                    initial={{ scale: 0.9, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-7xl font-bold text-[#1E6B9A]"
                  >
                    {ageLabel}
                  </motion.div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-sky-500">
                    años
                  </div>
                </div>

                <div className="mt-8 px-1">
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="age-slider w-full"
                    aria-label="Edad"
                  />
                  <div className="mt-2 flex justify-between text-xs text-sky-500">
                    <span>1</span>
                    <span>99+</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E]"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="lang"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-sm font-semibold text-sky-600">Paso 2 de 2</p>
                <h1 className="font-display text-2xl font-bold text-sky-900">
                  ¿En qué idioma quieres usar Itineraya?
                </h1>
                <p className="mt-1 text-sm text-sky-600">Podrás cambiarlo más tarde.</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {LANGUAGES.map((l) => {
                    const selected = language === l.code;
                    return (
                      <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                          selected
                            ? "border-[#1E6B9A] bg-[#1E6B9A]/5 shadow-md"
                            : "border-sky-100 bg-white hover:border-sky-300"
                        }`}
                      >
                        <span className="text-2xl">{l.flag}</span>
                        <span className="text-sm font-semibold text-sky-900">{l.label}</span>
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#1E6B9A]">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 rounded-full border border-sky-200 bg-white px-6 py-3.5 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={finish}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E] disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Empezar"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        .age-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(to right, #1E6B9A 0%, #1E6B9A ${((age - 1) / 98) * 100}%, #D6EAF8 ${((age - 1) / 98) * 100}%, #D6EAF8 100%);
          outline: none;
        }
        .age-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #1E6B9A;
          box-shadow: 0 4px 12px rgba(30, 107, 154, 0.3);
          cursor: pointer;
          transition: transform 0.15s;
        }
        .age-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .age-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #1E6B9A;
          box-shadow: 0 4px 12px rgba(30, 107, 154, 0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
