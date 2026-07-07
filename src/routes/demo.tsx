// Demo pública sin registro: onboarding reducido (destino → días+compañía →
// estilos) → generación real → resultado con el día 1 completo y el resto
// bloqueado tras el modal de registro. El itinerario vive en localStorage
// (DEMO_TRIP_KEY) y dashboard.tsx lo reclama al crear la cuenta.

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  MapPin,
  Plane,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { generateDemoItinerary } from "@/lib/demo.functions";
import { DEMO_TRIP_KEY, readDemoTrip, type DemoTrip, type DemoDay } from "@/lib/demo-trip";
import { DestinationAutocomplete } from "@/components/DestinationAutocomplete";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { supabase } from "@/integrations/supabase/client";
import { SmartImage, destinationFallback } from "@/components/ui/SmartImage";
import { BrandLogo } from "@/components/BrandLogo";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Prueba Itineraya gratis – itinerario real sin registro" },
      {
        name: "description",
        content:
          "Genera un itinerario de viaje real con IA en 30 segundos, sin crear cuenta: día a día, horarios, transporte y sitios que existen.",
      },
    ],
  }),
  component: DemoPage,
});

const DEMO_TRIP_TYPES = [
  "cultural",
  "food",
  "relax",
  "nature",
  "party",
  "romantic",
  "adventure",
  "architecture",
] as const;

const LOADING_STAGES = [
  { key: "loadingStage1", at: 0 },
  { key: "loadingStage2", at: 18 },
  { key: "loadingStage3", at: 40 },
  { key: "loadingStage4", at: 64 },
  { key: "loadingStage5", at: 85 },
] as const;

type Phase = "form" | "loading" | "result";

function DemoPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  const generate = useServerFn(generateDemoItinerary);
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [nDays, setNDays] = useState(3);
  const [companion, setCompanion] = useState("pareja");
  const [tripTypes, setTripTypes] = useState<string[]>([]);
  const [result, setResult] = useState<DemoTrip | null>(null);

  // Usuarios con sesión no necesitan la demo: al flujo completo.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate({ to: "/new-trip", replace: true });
    });
  }, [navigate]);

  // Demo ya generada en este navegador → mostrarla directamente.
  useEffect(() => {
    const saved = readDemoTrip();
    if (saved) {
      setResult(saved);
      setPhase("result");
    }
  }, []);

  const canContinue = step === 0 ? destination.trim().length > 1 : true;
  const totalSteps = 3;

  const runGeneration = async () => {
    setPhase("loading");
    try {
      const res = await generate({
        data: {
          destination: destination.trim(),
          nDays,
          companion: companion as "solo" | "pareja" | "amigos" | "familia",
          tripTypes,
          language: i18n.language,
        },
      });
      const demoTrip: DemoTrip = {
        destination: destination.trim(),
        nDays,
        companion,
        tripTypes,
        itinerary: res.itinerary as DemoTrip["itinerary"],
        hero_image_url: res.hero_image_url ?? null,
        createdAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DEMO_TRIP_KEY, JSON.stringify(demoTrip));
      } catch {
        // localStorage lleno o bloqueado: la demo sigue funcionando en memoria.
      }
      setResult(demoTrip);
      setPhase("result");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("trip.somethingWrong"));
      setPhase("form");
    }
  };

  const openSignup = () => {
    openAuthModal({
      mode: "signup",
      title: t("demo.signupTitle", { destination: result?.destination ?? destination }),
      description: t("demo.signupDesc", { destination: result?.destination ?? destination }),
      onAuthed: () => navigate({ to: "/dashboard" }),
    });
  };

  if (phase === "loading") {
    return <DemoLoadingScreen destination={destination} />;
  }

  if (phase === "result" && result) {
    return <DemoResult trip={result} onSignup={openSignup} />;
  }

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

      <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/70 px-4 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.back")}
          </Link>
          <BrandLogo size="sm" />
        </div>

        {/* Cabecera de la demo */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E6B9A]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#1E6B9A]">
            <Plane className="h-3 w-3 -rotate-45" />
            {t("demo.badge")}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold text-sky-900 sm:text-4xl">
            {t("demo.title")}
          </h1>
          <p className="mt-2 text-sm text-sky-600 sm:text-base">{t("demo.subtitle")}</p>
        </div>

        {/* Progreso */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 flex-1 rounded-full transition",
                index <= step ? "bg-[#1E6B9A]" : "bg-white/70",
              )}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 44 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
        >
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-sky-900 sm:text-3xl">
                  {t("onboarding.destTitle")}
                </h2>
                <p className="mt-2 text-sm text-sky-600">{t("onboarding.destSubtitle")}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-[#1E6B9A]/40 bg-white/60 p-4">
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onEnter={() => {
                    if (canContinue) setStep(1);
                  }}
                  placeholder={t("onboarding.destPh")}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-sky-900 sm:text-3xl">
                  {t("demo.daysTitle")}
                </h2>
                <p className="mt-2 text-sm text-sky-600">{t("demo.daysSubtitle")}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNDays(n)}
                    className={cn(
                      "rounded-2xl border p-4 text-center transition active:scale-[0.97]",
                      nDays === n
                        ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
                        : "border-sky-200 bg-white/70 text-sky-900 hover:border-sky-300 hover:bg-white",
                    )}
                  >
                    <span className="block font-display text-2xl font-bold">{n}</span>
                    <span className="text-xs font-semibold opacity-80">{t("demo.daysUnit")}</span>
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-sky-800">
                  {t("onboarding.compTitle")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["solo", t("onboarding.compSolo"), "🧭"],
                      ["pareja", t("onboarding.compPair"), "💙"],
                      ["amigos", t("onboarding.compFriends"), "🎒"],
                      ["familia", t("onboarding.compFamily"), "🏡"],
                    ] as const
                  ).map(([id, label, icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCompanion(id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.97]",
                        companion === id
                          ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
                          : "border-sky-200 bg-white/70 text-sky-900 hover:border-sky-300 hover:bg-white",
                      )}
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-sky-900 sm:text-3xl">
                  {t("onboarding.styleTitle")}
                </h2>
                <p className="mt-2 text-sm text-sky-600">{t("onboarding.styleMultiSubtitle")}</p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {DEMO_TRIP_TYPES.map((id) => {
                  const selected = tripTypes.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setTripTypes((prev) =>
                          selected ? prev.filter((x) => x !== id) : [...prev, id],
                        )
                      }
                      className={cn(
                        "rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition active:scale-[0.97]",
                        selected
                          ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
                          : "border-sky-200 bg-white/70 text-sky-800 hover:border-sky-300 hover:bg-white hover:shadow-sm",
                      )}
                    >
                      {t(`onboarding.tripTypes.${id}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-white active:scale-[0.97] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.back")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canContinue) return;
              if (step === totalSteps - 1) void runGeneration();
              else setStep((s) => s + 1);
            }}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {step === totalSteps - 1 ? t("onboarding.generate") : t("onboarding.next")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-sky-600/80">{t("demo.disclaimer")}</p>
      </div>
    </div>
  );
}

// Pantalla de carga: versión compacta de la del itinerario real (misma
// narrativa de etapas), reutilizando las claves trip.loadingStage*.
function DemoLoadingScreen({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => {
      const s = (Date.now() - started) / 1000;
      setProgress(Math.min(97, Math.round(97 * (1 - Math.exp(-s / 7)))));
    }, 400);
    return () => clearInterval(tick);
  }, []);

  const stageIdx = LOADING_STAGES.reduce((acc, s, i) => (progress >= s.at ? i : acc), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-950 p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-700/25 blur-3xl" />
        <div className="absolute -bottom-16 left-0 h-48 w-72 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
      </div>
      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-sky-100 ring-1 ring-white/20 backdrop-blur-md">
          <Sparkles className="h-3 w-3" />
          {t("trip.loadingTag")}
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
          {destination}
        </h1>
        <div className="mt-6 min-h-8">
          <TextShimmerWave
            key={stageIdx}
            className="font-display text-lg font-bold md:text-xl"
            duration={1.4}
            spread={1.1}
            zDistance={14}
          >
            {t(`trip.${LOADING_STAGES[stageIdx].key}`, { destination })}
          </TextShimmerWave>
        </div>
        <ul className="mt-6 w-full max-w-xs space-y-2 text-left">
          {LOADING_STAGES.map((s, i) => (
            <li
              key={s.key}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors duration-500",
                i < stageIdx ? "text-sky-200" : i === stageIdx ? "text-white" : "text-sky-200/40",
              )}
            >
              {i < stageIdx ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : i === stageIdx ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{t(`trip.${s.key}`, { destination })}</span>
            </li>
          ))}
        </ul>
        <div className="mt-7 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-sky-200 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs tabular-nums text-sky-200/80">{progress}%</p>
      </div>
    </div>
  );
}

function DemoResult({ trip, onSignup }: { trip: DemoTrip; onSignup: () => void }) {
  const { t } = useTranslation();
  const itin = trip.itinerary;
  const [day1, ...lockedDays] = itin.days;

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      {/* Toolbar mínima */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
          <Link
            to="/"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Itineraya
          </Link>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-100 px-3 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <Sparkles className="h-3 w-3" />
            {t("demo.resultBadge")}
          </span>
          <button
            type="button"
            onClick={onSignup}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sky-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800"
          >
            {t("demo.saveCta")}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        <SmartImage
          src={trip.hero_image_url}
          fallbackSrc={destinationFallback(trip.destination, 1600, 900)}
          gradientClassName="bg-gradient-to-br from-sky-950 to-sky-800"
          alt={trip.destination}
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-md">
              <MapPin className="h-3 w-3" />
              {t("trip.heroTag")}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white drop-shadow-md md:text-4xl">
              {trip.destination}
            </h1>
            {itin.summary && (
              <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">{itin.summary}</p>
            )}
            <div className="mt-3 flex items-center gap-1 text-xs text-white/70">
              <Clock className="h-3.5 w-3.5" />
              {t("trip.daysCount", { count: itin.days.length })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        {/* Día 1 completo */}
        {day1 && <DemoDayCard day={day1} destination={trip.destination} />}

        {/* Días bloqueados */}
        <div className="mt-5 space-y-5">
          {lockedDays.map((day) => (
            <DemoLockedDay key={day.day} day={day} onSignup={onSignup} />
          ))}
        </div>
      </div>

      {/* Barra fija de conversión */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-sky-100 bg-white/95 p-3 backdrop-blur-md sm:p-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 sm:flex-row sm:gap-4">
          <p className="text-center text-sm font-semibold text-sky-900 sm:text-left">
            {t("demo.saveBar", { destination: trip.destination })}
          </p>
          <button
            type="button"
            onClick={onSignup}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:shadow-xl active:scale-[0.98] sm:w-auto"
          >
            <Sparkles className="h-4 w-4" />
            {t("demo.saveCtaLong")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoDayCard({ day, destination }: { day: DemoDay; destination: string }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      {day.image_url && (
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          <SmartImage
            src={day.image_url}
            fallbackSrc={destinationFallback(`${day.title} ${destination}`, 1400, 620)}
            gradientClassName="bg-gradient-to-br from-sky-700 to-sky-900"
            alt={day.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-700 to-cyan-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="mt-1.5 font-display text-xl font-bold text-white drop-shadow sm:text-2xl">
              {day.title}
            </h3>
            {day.subtitle && <p className="text-xs text-white/80 sm:text-sm">{day.subtitle}</p>}
          </div>
        </div>
      )}
      <div className="space-y-2.5 p-4 sm:p-5">
        {day.activities.map((a, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-900 text-white">
              <Clock className="h-3 w-3 opacity-60" />
              <span className="mt-0.5 text-xs font-bold leading-none">{a.time}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-2">
                <span className="text-base leading-tight">{a.emoji ?? "📍"}</span>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight text-slate-900">{a.title}</p>
                  {a.place && <p className="truncate text-xs text-slate-500">{a.place}</p>}
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.description}</p>
              {a.tip && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2">
                  <span className="text-sm leading-tight">💎</span>
                  <p className="text-xs leading-relaxed text-amber-800">
                    <span className="font-semibold">{t("trip.tipLabel")}</span> {a.tip}
                  </p>
                </div>
              )}
              <div className="mt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.place || a.title}, ${destination}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  <MapPin className="h-3 w-3 text-slate-500" />
                  {t("trip.maps")}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Día bloqueado: se ve el título y una vista borrosa de las actividades — lo
// justo para querer verlo entero. El clic en cualquier parte abre el registro.
function DemoLockedDay({ day, onSignup }: { day: DemoDay; onSignup: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onSignup}
      className="group relative block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
    >
      {day.image_url && (
        <div className="relative h-32 w-full overflow-hidden">
          <img
            src={day.image_url}
            alt=""
            aria-hidden
            className="h-full w-full object-cover blur-[2px] brightness-75"
            loading="lazy"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="inline-flex items-center rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="mt-1 font-display text-lg font-bold text-white drop-shadow">
              {day.title}
            </h3>
          </div>
        </div>
      )}
      {/* Actividades desenfocadas: contenido real, ilegible a propósito */}
      <div className="space-y-2 p-4 blur-[5px] select-none" aria-hidden>
        {day.activities.slice(0, 3).map((a, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-900 text-xs font-bold text-white">
              {a.time}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{a.title}</p>
              <p className="truncate text-sm text-slate-500">{a.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 top-32 flex items-center justify-center bg-gradient-to-t from-white via-white/70 to-transparent">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition group-hover:bg-sky-800 group-active:scale-[0.98]">
          <Lock className="h-4 w-4" />
          {t("demo.lockedCta")}
        </span>
      </div>
    </button>
  );
}
