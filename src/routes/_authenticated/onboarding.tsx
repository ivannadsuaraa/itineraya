import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { es, enUS } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  User,
  Users,
  Heart,
  Home,
  Wallet,
  Coins,
  Gem,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { DateRangeField, type DateRange } from "@/components/DateRangeField";
import { HotelMapPicker, type HotelSelection } from "@/components/HotelMapPicker";

const searchSchema = z.object({ prefill: z.string().optional() });

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  head: () => ({
    meta: [{ title: "Tell us about your trip – Itineraya" }],
  }),
  component: OnboardingPage,
});

type Companion = "solo" | "pareja" | "amigos" | "familia";
type Budget = "economico" | "medio" | "sin-limite";
type TripTypeId =
  | "beach" | "party" | "cultural" | "food" | "relax"
  | "nature" | "romantic" | "family" | "adventure" | "special";

const TRIP_TYPE_IDS: TripTypeId[] = [
  "beach","party","cultural","food","relax","nature","romantic","family","adventure","special",
];

const TRIP_TYPE_EMOJI: Record<TripTypeId, string> = {
  beach: "🏖️", party: "🎉", cultural: "🏛️", food: "🍽️", relax: "🧘",
  nature: "🌿", romantic: "💕", family: "👨‍👩‍👧", adventure: "🧗", special: "🎄",
};

interface FormData {
  destination: string;
  startDate?: Date;
  endDate?: Date;
  arrivalTime?: string;
  departureTime?: string;
  companion?: Companion;
  budget?: Budget;
  tripTypes: TripTypeId[];
  hasAccommodation?: boolean;
  hotel?: HotelSelection | null;
  avoid: string;
}

type PrefillShape = {
  destination?: string;
  budget?: string;
  tripType?: string;
  tripTypes?: TripTypeId[];
  duration?: string;
  nDays?: number;
};

function decodePrefill(encoded: string | undefined): PrefillShape {
  if (!encoded) return {};
  try {
    const decoded =
      typeof window === "undefined"
        ? ""
        : decodeURIComponent(escape(atob(encoded)));
    if (!decoded) return {};
    return JSON.parse(decoded) as PrefillShape;
  } catch {
    return {};
  }
}

type StepId = "destination" | "dates" | "companion" | "budget" | "tripType" | "accommodation" | "avoid";
const ALL_STEPS: StepId[] = ["destination", "dates", "companion", "budget", "tripType", "accommodation", "avoid"];
const BUDGET_IDS: Budget[] = ["economico", "medio", "sin-limite"];

function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { prefill: prefillRaw } = Route.useSearch();
  const prefill = useMemo(() => decodePrefill(prefillRaw), [prefillRaw]);

  const prefilledBudget: Budget | undefined =
    prefill.budget && (BUDGET_IDS as string[]).includes(prefill.budget)
      ? (prefill.budget as Budget)
      : undefined;

  const prefilledTripTypes: TripTypeId[] = Array.isArray(prefill.tripTypes)
    ? prefill.tripTypes.filter((x): x is TripTypeId => (TRIP_TYPE_IDS as string[]).includes(x))
    : [];

  const activeSteps: StepId[] = useMemo(() => {
    return ALL_STEPS.filter((id) => {
      if (id === "destination" && prefill.destination) return false;
      if (id === "budget" && prefilledBudget) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill.destination, prefill.budget]);

  const TOTAL_STEPS = activeSteps.length;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData>(() => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (prefill.nDays && prefill.nDays > 0) {
      const start = new Date();
      start.setDate(start.getDate() + 14);
      startDate = start;
      const end = new Date(start);
      end.setDate(end.getDate() + Math.max(0, prefill.nDays - 1));
      endDate = end;
    }
    return {
      destination: prefill.destination ?? "",
      tripTypes: prefilledTripTypes,
      avoid: "",
      budget: prefilledBudget,
      startDate,
      endDate,
    };
  });


  const dateLocale = i18n.language.toLowerCase().startsWith("en") ? enUS : es;

  const currentStepId: StepId = activeSteps[step] ?? "avoid";

  const canAdvance = () => {
    switch (currentStepId) {
      case "destination": return data.destination.trim().length > 1;
      case "dates": return !!data.startDate && !!data.endDate;
      case "companion": return !!data.companion;
      case "budget": return !!data.budget;
      case "tripType": return data.tripTypes.length > 0;
      case "accommodation":
        if (data.hasAccommodation === undefined) return false;
        if (data.hasAccommodation === true && !data.hotel) return false;
        return true;
      case "avoid": return true;
      default: return false;
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

  const tripTypesLabel = (ids: TripTypeId[]) =>
    ids.map((id) => t(`onboarding.tripTypes.${id}`)).join(", ");

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error(t("onboarding.notAuth"));

      // Stored canonically in Spanish (for back-compat with the rest of the app).
      const budgetMap: Record<Budget, string> = {
        economico: "Económico",
        medio: "Medio",
        "sin-limite": "Sin límite",
      };
      const companionMap: Record<Companion, string> = {
        solo: "Solo",
        pareja: "En pareja",
        amigos: "Con amigos",
        familia: "En familia",
      };

      const tripStyleStr = tripTypesLabel(data.tripTypes);

      await supabase
        .from("profiles")
        .update({
          preferred_destinations: [data.destination],
          budget_range: data.budget ? budgetMap[data.budget] : null,
          travel_style: tripStyleStr,
        })
        .eq("id", userId);

      const { data: trip, error: tripErr } = await supabase
        .from("trips")
        .insert({
          user_id: userId,
          destination: data.destination,
          start_date: data.startDate ? data.startDate.toISOString().slice(0, 10) : null,
          end_date: data.endDate ? data.endDate.toISOString().slice(0, 10) : null,
          arrival_time: data.arrivalTime || null,
          departure_time: data.departureTime || null,
          companion: data.companion ? companionMap[data.companion] : null,
          budget: data.budget ? budgetMap[data.budget] : null,
          trip_style: tripStyleStr,
          trip_types: data.tripTypes,
          has_accommodation: !!data.hasAccommodation,
          hotel_name: data.hotel?.name ?? null,
          hotel_address: data.hotel?.address ?? null,
          hotel_lat: data.hotel?.lat ?? null,
          hotel_lng: data.hotel?.lng ?? null,
          travel_mode: "planning",
          avoid: data.avoid,
          status: "pending",
        })
        .select("id")
        .single();
      if (tripErr || !trip) throw tripErr ?? new Error(t("onboarding.saveFail"));

      navigate({ to: "/trip/$tripId", params: { tripId: trip.id } });

    } catch (err) {
      const msg = err instanceof Error ? err.message : t("onboarding.somethingWrong");
      toast.error(msg);
      setLoading(false);
    }
  };

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

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 self-start">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.back")}
          </button>
        </div>

        <div className="mb-8 flex items-center justify-center">
          <BrandLogo size="md" />
        </div>

        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>{t("onboarding.stepIndicator", { n: step + 1, total: TOTAL_STEPS })}</span>
            <span>{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100">
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

        <div className="relative flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-3xl bg-white/80 p-5 shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60 sm:p-8 md:p-10"
            >
              {currentStepId === "destination" && (
                <StepShell emoji="🌍" title={t("onboarding.destTitle")} subtitle={t("onboarding.destSubtitle")}>
                  <input
                    autoFocus
                    type="text"
                    value={data.destination}
                    onChange={(e) => setData({ ...data, destination: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && canAdvance() && next()}
                    placeholder={t("onboarding.destPh")}
                    className="w-full rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-lg text-sky-900 placeholder-sky-400 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
                  />
                </StepShell>
              )}

              {currentStepId === "dates" && (
                <StepShell emoji="📅" title={t("onboarding.datesTitle")} subtitle={t("onboarding.datesSubtitle")}>
                  <DateRangeField
                    value={
                      data.startDate || data.endDate
                        ? ({ from: data.startDate, to: data.endDate } as DateRange)
                        : undefined
                    }
                    onChange={(r) => setData({ ...data, startDate: r?.from, endDate: r?.to })}
                    locale={dateLocale}
                    startLabel={t("onboardingDates.rangeStart")}
                    endLabel={t("onboardingDates.rangeEnd")}
                    placeholder={t("onboardingDates.rangePlaceholder")}
                    nightsLabel={(n) => t("trip.nights", { count: n })}
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <TimeField
                      label={t("onboarding.arrivalTime")}
                      value={data.arrivalTime}
                      onChange={(v) => setData({ ...data, arrivalTime: v })}
                    />
                    <TimeField
                      label={t("onboarding.departureTime")}
                      value={data.departureTime}
                      onChange={(v) => setData({ ...data, departureTime: v })}
                    />
                  </div>
                  <p className="mt-3 text-xs text-sky-600">{t("onboarding.timeHint")}</p>
                </StepShell>
              )}

              {currentStepId === "companion" && (
                <StepShell emoji="👥" title={t("onboarding.compTitle")} subtitle={t("onboarding.compSubtitle")}>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { id: "solo", label: t("onboarding.compSolo"), icon: User },
                        { id: "pareja", label: t("onboarding.compPair"), icon: Heart },
                        { id: "amigos", label: t("onboarding.compFriends"), icon: Users },
                        { id: "familia", label: t("onboarding.compFamily"), icon: Home },
                      ] as const
                    ).map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={data.companion === opt.id}
                        onClick={() => setData({ ...data, companion: opt.id as Companion })}
                        icon={<opt.icon className="h-6 w-6" />}
                        label={opt.label}
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {currentStepId === "budget" && (
                <StepShell emoji="💰" title={t("onboarding.budgetTitle")} subtitle={t("onboarding.budgetSubtitle")}>
                  <div className="grid gap-3">
                    {(
                      [
                        { id: "economico", label: t("onboarding.budgetEco"), desc: t("onboarding.budgetEcoDesc"), icon: Coins },
                        { id: "medio", label: t("onboarding.budgetMid"), desc: t("onboarding.budgetMidDesc"), icon: Wallet },
                        { id: "sin-limite", label: t("onboarding.budgetMax"), desc: t("onboarding.budgetMaxDesc"), icon: Gem },
                      ] as const
                    ).map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={data.budget === opt.id}
                        onClick={() => setData({ ...data, budget: opt.id as Budget })}
                        icon={<opt.icon className="h-5 w-5" />}
                        label={opt.label}
                        description={opt.desc}
                        horizontal
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {currentStepId === "tripType" && (
                <StepShell emoji="🎒" title={t("onboarding.styleTitle")} subtitle={t("onboarding.styleMultiSubtitle")}>
                  <div className="flex flex-wrap gap-2">
                    {TRIP_TYPE_IDS.map((id) => {
                      const selected = data.tripTypes.includes(id);
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() =>
                            setData({
                              ...data,
                              tripTypes: selected
                                ? data.tripTypes.filter((x) => x !== id)
                                : [...data.tripTypes, id],
                            })
                          }
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                            selected
                              ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-md shadow-[#1E6B9A]/25"
                              : "border-sky-200 bg-white/70 text-sky-800 hover:bg-white",
                          )}
                        >
                          <span>{TRIP_TYPE_EMOJI[id]}</span>
                          <span>{t(`onboarding.tripTypes.${id}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-sky-600">{t("onboarding.styleMultiHint")}</p>
                </StepShell>
              )}

              {currentStepId === "accommodation" && (
                <StepShell emoji="🏨" title={t("onboarding.accomTitle")} subtitle={t("onboarding.accomSubtitle")}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionCard
                      selected={data.hasAccommodation === false}
                      onClick={() => setData({ ...data, hasAccommodation: false })}
                      icon={<Sparkles className="h-5 w-5" />}
                      label={t("onboarding.accomNo")}
                      description={t("onboarding.accomNoDesc")}
                      horizontal
                    />
                    <OptionCard
                      selected={data.hasAccommodation === true}
                      onClick={() => setData({ ...data, hasAccommodation: true })}
                      icon={<Home className="h-5 w-5" />}
                      label={t("onboarding.accomYes")}
                      description={t("onboarding.accomYesDesc")}
                      horizontal
                    />
                  </div>
                </StepShell>
              )}

              {currentStepId === "avoid" && (
                <StepShell emoji="🚫" title={t("onboarding.avoidTitle")} subtitle={t("onboarding.avoidSubtitle")}>
                  <textarea
                    autoFocus
                    rows={4}
                    value={data.avoid}
                    onChange={(e) => setData({ ...data, avoid: e.target.value })}
                    placeholder={t("onboarding.avoidPh")}
                    className="w-full resize-none rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-base text-sky-900 placeholder-sky-400 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
                  />
                </StepShell>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-sky-800 shadow-sm backdrop-blur-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.back")}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("onboarding.next")}
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
                  {t("onboarding.generate")}
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


function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-sky-700">{label}</span>
      <input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-sky-200 bg-white/70 px-4 py-3.5 text-sm text-sky-900 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
      />
    </label>
  );
}
