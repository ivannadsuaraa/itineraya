import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { ArrowRight, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LANGUAGE_OPTIONS } from "@/i18n";

export const Route = createFileRoute("/_authenticated/welcome")({
  ssr: false,
  head: () => ({ meta: [{ title: "Bienvenido a Itineraya" }] }),
  component: WelcomePage,
});

function WelcomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(28);
  const [language, setLanguage] = useState<string>("es");
  const [saving, setSaving] = useState(false);
  const [hadTrial, setHadTrial] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("welcome_completed, age, language, trial_ends_at")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data?.welcome_completed) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        if (data?.age) setAge(data.age);
        if (data?.language) setLanguage(data.language);
        setHadTrial(Boolean(data?.trial_ends_at));
      }
    })();
  }, [navigate]);

  // El trial ahora arranca al crear la cuenta (default en BD); solo lo fijamos
  // aquí como fallback para perfiles anteriores a esa migración.
  const trialPatch = () =>
    hadTrial
      ? {}
      : { trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };

  const finish = async () => {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update({ age, language, welcome_completed: true, ...trialPatch() } as never)
        .eq("id", u.user.id);
      if (error) throw error;
      document.documentElement.lang = language;
      try {
        localStorage.setItem("itineraya:lang", language);
      } catch {
        /* ignore */
      }
      await i18n.changeLanguage(language);
      toast.success(t("welcome.saved"));
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("welcome.saveFail"));
      setSaving(false);
    }
  };

  // Sacar el welcome del camino crítico: el usuario puede saltárselo y llegar
  // al dashboard; edad/idioma se pueden completar después en el perfil.
  const skip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No user");
      const { error } = await supabase
        .from("profiles")
        .update({ welcome_completed: true, ...trialPatch() } as never)
        .eq("id", u.user.id);
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("welcome.saveFail"));
      setSaving(false);
    }
  };

  const ageLabel = age >= 99 ? "99+" : String(age);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
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

      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12">
        <Link to="/dashboard" className="mb-8 inline-flex">
          <img src={"/itineraya-logo.png"} alt="Itineraya" className="h-14 w-auto select-none" draggable={false} />
        </Link>

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

        <button
          type="button"
          onClick={skip}
          disabled={saving}
          className="absolute right-4 top-4 flex h-11 items-center rounded-full px-4 text-sm font-semibold text-sky-600 transition hover:bg-white/70 hover:text-sky-900 disabled:opacity-50"
        >
          {t("welcome.skip")}
        </button>

        <div className="w-full overflow-hidden rounded-3xl bg-white/85 shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.div
                key="age"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_e, info) => { if (info.offset.x < -60) setStep(1); }}
                className="p-8"
              >
                <p className="text-sm font-semibold text-sky-600">{t("welcome.step", { n: 1 })}</p>
                <h1 className="font-display text-2xl font-bold text-sky-900">{t("welcome.ageTitle")}</h1>
                <p className="mt-1 text-sm text-sky-600">{t("welcome.ageSubtitle")}</p>

                <div className="mt-10 text-center">
                  <div
                    key={ageLabel}
                    
                    
                    className="font-display text-7xl font-bold text-[#1E6B9A]"
                  >
                    {ageLabel}
                  </div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-sky-500">
                    {t("welcome.years")}
                  </div>
                </div>

                <div className="mt-8 px-1">
                  <input
                    type="range"
                    min={1}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    className="age-slider w-full"
                    aria-label={t("welcome.ageAria")}
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
                  {t("welcome.next")} <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="lang"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_e, info) => { if (info.offset.x > 60) setStep(0); }}
                className="p-8"
              >
                <p className="text-sm font-semibold text-sky-600">{t("welcome.step", { n: 2 })}</p>
                <h1 className="font-display text-2xl font-bold text-sky-900">{t("welcome.langTitle")}</h1>
                <p className="mt-1 text-sm text-sky-600">{t("welcome.langSubtitle")}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {LANGUAGE_OPTIONS.map((l) => {
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
                    {t("welcome.back")}
                  </button>
                  <button
                    onClick={finish}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E] disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("welcome.start")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
