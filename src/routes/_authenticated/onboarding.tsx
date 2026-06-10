import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Loader2,
  Plane,
  Sparkles,
  User,
  Users,
  Heart,
  Home,
  Wallet,
  Coins,
  Gem,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Cuéntanos sobre tu viaje – Itineraya" }],
  }),
  component: OnboardingPage,
});

type Companion = "solo" | "pareja" | "amigos" | "familia";
type Budget = "economico" | "medio" | "sin-limite";

interface FormData {
  destination: string;
  startDate?: Date;
  endDate?: Date;
  companion?: Companion;
  budget?: Budget;
  tripType: string;
  avoid: string;
}

const TOTAL_STEPS = 6;

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData>({
    destination: "",
    tripType: "",
    avoid: "",
  });

  const canAdvance = () => {
    switch (step) {
      case 0:
        return data.destination.trim().length > 1;
      case 1:
        return !!data.startDate && !!data.endDate;
      case 2:
        return !!data.companion;
      case 3:
        return !!data.budget;
      case 4:
        return data.tripType.trim().length > 1;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const next = () => {
    if (!canAdvance()) return;
    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("No autenticado");

      const budgetMap: Record<Budget, string> = {
        economico: "Económico",
        medio: "Medio",
        "sin-limite": "Sin límite",
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_destinations: [data.destination],
          budget_range: data.budget ? budgetMap[data.budget] : null,
          travel_style: data.tripType,
        })
        .eq("id", userId);
      if (error) throw error;

      toast.success("¡Preferencias guardadas! Generando tu itinerario… ✈️");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo salió mal";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      {/* Decorative blobs */}
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

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2 text-sky-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E6B9A] shadow-md shadow-[#1E6B9A]/30">
            <Plane className="h-4 w-4 rotate-[-45deg] text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Itineraya</span>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>
              Paso {step + 1} de {TOTAL_STEPS}
            </span>
            <span>{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100"
              >
                <motion.div
                  initial={false}
                  animate={{
                    width: i < step ? "100%" : i === step ? "100%" : "0%",
                    opacity: i <= step ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-3xl bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60 md:p-10"
            >
              {step === 0 && (
                <StepShell
                  emoji="🌍"
                  title="¿A dónde quieres ir?"
                  subtitle="Una ciudad, un país o una región. Lo que sueñes."
                >
                  <input
                    autoFocus
                    type="text"
                    value={data.destination}
                    onChange={(e) => setData({ ...data, destination: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && next()}
                    placeholder="Ej. Japón, Lisboa, Patagonia…"
                    className="w-full rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-lg text-sky-900 placeholder-sky-400 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
                  />
                </StepShell>
              )}

              {step === 1 && (
                <StepShell
                  emoji="📅"
                  title="¿Cuándo viajas?"
                  subtitle="Elige las fechas de inicio y fin."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DateField
                      label="Inicio"
                      value={data.startDate}
                      onChange={(d) => setData({ ...data, startDate: d })}
                    />
                    <DateField
                      label="Fin"
                      value={data.endDate}
                      onChange={(d) => setData({ ...data, endDate: d })}
                      minDate={data.startDate}
                    />
                  </div>
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  emoji="👥"
                  title="¿Con quién vas?"
                  subtitle="Adaptaremos el plan al grupo."
                >
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { id: "solo", label: "Solo", icon: User },
                        { id: "pareja", label: "En pareja", icon: Heart },
                        { id: "amigos", label: "Con amigos", icon: Users },
                        { id: "familia", label: "En familia", icon: Home },
                      ] as const
                    ).map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={data.companion === opt.id}
                        onClick={() => setData({ ...data, companion: opt.id })}
                        icon={<opt.icon className="h-6 w-6" />}
                        label={opt.label}
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  emoji="💰"
                  title="¿Cuál es tu presupuesto?"
                  subtitle="Sugeriremos opciones acordes."
                >
                  <div className="grid gap-3">
                    {(
                      [
                        {
                          id: "economico",
                          label: "Económico",
                          desc: "Mochilero, hostels, comida local",
                          icon: Coins,
                        },
                        {
                          id: "medio",
                          label: "Medio",
                          desc: "Hoteles cómodos, experiencias balanceadas",
                          icon: Wallet,
                        },
                        {
                          id: "sin-limite",
                          label: "Sin límite",
                          desc: "Lo mejor de cada destino",
                          icon: Gem,
                        },
                      ] as const
                    ).map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={data.budget === opt.id}
                        onClick={() => setData({ ...data, budget: opt.id })}
                        icon={<opt.icon className="h-5 w-5" />}
                        label={opt.label}
                        description={opt.desc}
                        horizontal
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  emoji="🎒"
                  title="¿Qué tipo de viaje buscas?"
                  subtitle="Aventura, cultura, relax, gastronomía…"
                >
                  <textarea
                    autoFocus
                    rows={4}
                    value={data.tripType}
                    onChange={(e) => setData({ ...data, tripType: e.target.value })}
                    placeholder="Ej. Quiero descubrir templos y comida callejera, con algo de naturaleza."
                    className="w-full resize-none rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-base text-sky-900 placeholder-sky-400 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
                  />
                </StepShell>
              )}

              {step === 5 && (
                <StepShell
                  emoji="🚫"
                  title="¿Algo que quieras evitar?"
                  subtitle="Alergias, lugares masificados, vuelos largos… (opcional)"
                >
                  <textarea
                    autoFocus
                    rows={4}
                    value={data.avoid}
                    onChange={(e) => setData({ ...data, avoid: e.target.value })}
                    placeholder="Ej. Evitar mariscos y trayectos de más de 4 horas."
                    className="w-full resize-none rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-base text-sky-900 placeholder-sky-400 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
                  />
                </StepShell>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-sky-800 shadow-sm backdrop-blur-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition-all hover:shadow-xl hover:shadow-[#1E6B9A]/40 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar itinerario
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-3xl">{emoji}</div>
      <h1 className="font-display text-2xl font-bold text-sky-900 md:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-sky-600 md:text-base">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  icon,
  label,
  description,
  horizontal,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  horizontal?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl border-2 bg-white/70 px-5 py-4 text-left transition-all hover:bg-white",
        horizontal ? "" : "flex-col items-center justify-center gap-3 py-6 text-center",
        selected
          ? "border-[#1E6B9A] bg-white shadow-lg shadow-[#1E6B9A]/15"
          : "border-sky-100 hover:border-sky-300",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
          selected ? "bg-[#1E6B9A] text-white" : "bg-sky-100 text-sky-700",
        )}
      >
        {icon}
      </div>
      <div className={horizontal ? "flex-1" : ""}>
        <div className="font-semibold text-sky-900">{label}</div>
        {description && <div className="mt-0.5 text-xs text-sky-600">{description}</div>}
      </div>
    </button>
  );
}

function DateField({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string;
  value?: Date;
  onChange: (d: Date | undefined) => void;
  minDate?: Date;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-sky-700">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-3.5 text-left text-sm transition-all hover:bg-white",
              !value && "text-sky-400",
            )}
          >
            <CalendarIcon className="h-4 w-4 text-sky-500" />
            {value ? format(value, "PPP", { locale: es }) : "Elegir fecha"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={minDate ? (d) => d < minDate : undefined}
            initialFocus
            locale={es}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </label>
  );
}
