import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { es as esLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { DateRangeField, type DateRange } from "@/components/DateRangeField";
import { HotelMapPicker, type HotelSelection } from "@/components/HotelMapPicker";
import { DestinationAutocomplete } from "@/components/DestinationAutocomplete";
import { BudgetRangeSlider } from "@/components/BudgetRangeSlider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (search: Record<string, unknown>) => ({
    prefill: typeof search.prefill === "string" ? search.prefill : undefined,
  }),
  head: () => ({ meta: [{ title: "Cuéntanos sobre tu viaje – Itineraya" }] }),
  component: OnboardingPage,
});

type FormData = {
  destination: string;
  dateRange: DateRange | undefined;
  arrivalTime: string;
  departureTime: string;
  companion: string;
  budgetRange: [number, number];
  tripStyle: string;
  avoid: string;
  tripTypes: string[];
  hasAccommodation: boolean;
  hotel: HotelSelection | null;
};

type PrefillData = Partial<{
  destination: string;
  budget: string;
  tripType: string;
  duration: string;
  // Sent by "remix" flows (explore feed, public trip page, saved inspirations).
  tripTypes: string[];
  nDays: number;
}>;

const tripTypeIds = [
  "beach",
  "party",
  "cultural",
  "food",
  "relax",
  "nature",
  "romantic",
  "family",
  "adventure",
  "special",
  "architecture",
];

function isBeachDestination(destination: string): boolean {
  const beachKeywords = [
    "playa",
    "beach",
    "cancún",
    "cancun",
    "tulum",
    "riviera",
    "maldives",
    "bali",
    "phuket",
    "koh ",
    "pattaya",
    "honolulu",
    "waikiki",
    "ibiza",
    "marbella",
    "algarve",
    "costa ",
    "punta cana",
    "puerto vallarta",
    "acapulco",
    "mazatlán",
    "santa marta",
    "cartagena",
    "miami beach",
    "fortaleza",
    "salvador",
    "rio",
    "copacabana",
    "ciprus",
    "cyprus",
    "mykonos",
    "santorini",
    "crete",
    "mallorca",
    "menorca",
    "formentera",
    "varadero",
    "mar del plata",
    "nice",
    "cannes",
    "saint-tropez",
    "costa del sol",
    "costa brava",
    "costa azul",
    "amalfi",
    "cinque terre",
    "key west",
    "virgin islands",
    "bahamas",
    "seychelles",
    "mauritius",
    "boracay",
    "krabi",
    "da nang",
    "nha trang",
    "goa",
    "sri lanka",
    "zanzibar",
    "cape town",
  ];
  return beachKeywords.some((k) => destination.toLowerCase().includes(k));
}

function getTripTypesForDestination(destination: string): string[] {
  const all = [...tripTypeIds];
  if (isBeachDestination(destination)) {
    return all;
  }
  // City destinations: hide beach, nature; show architecture, cultural, food, party, etc.
  return all.filter((id) => id !== "beach");
}

function decodePrefill(value?: string): PrefillData | null {
  if (!value) return null;
  try {
    const binary = globalThis.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as PrefillData;
  } catch {
    return null;
  }
}

function toDateInputValue(date: Date | undefined) {
  if (!date) return null;
  // Format in LOCAL time — toISOString() converts to UTC and shifts the date
  // back one day for any user east of UTC (e.g. Spain at local midnight).
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const prefill = useMemo(() => decodePrefill(search.prefill), [search.prefill]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData>(() => ({
    destination: prefill?.destination ?? "",
    dateRange: undefined,
    arrivalTime: "",
    departureTime: "",
    companion: "solo",
    budgetRange: [800, 2000],
    tripStyle: prefill?.tripType ?? "",
    avoid: "",
    tripTypes: Array.isArray(prefill?.tripTypes)
      ? prefill.tripTypes.filter((id) => tripTypeIds.includes(id))
      : [],
    hasAccommodation: false,
    hotel: null,
  }));

  // 4 pasos (antes 7): destino → fechas → perfil de viaje → opcionales.
  // Los pasos 3-4 tienen defaults razonables; llegar al valor cuesta menos clics.
  const totalSteps = 4;
  const canContinue =
    step === 0
      ? data.destination.trim().length > 1
      : step === 1
        ? Boolean(data.dateRange?.from && data.dateRange?.to)
        : true;

  const next = () => {
    if (!canContinue) return;
    setDirection(1);
    setStep((current) => Math.min(totalSteps - 1, current + 1));
  };

  const prev = () => {
    setDirection(-1);
    setStep((current) => Math.max(0, current - 1));
  };

  const finish = async () => {
    if (!data.destination.trim()) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(t("onboarding.notAuth"));

      const { data: trip, error } = await supabase
        .from("trips")
        .insert({
          user_id: auth.user.id,
          destination: data.destination.trim(),
          start_date: toDateInputValue(data.dateRange?.from),
          end_date: toDateInputValue(data.dateRange?.to),
          arrival_time: data.arrivalTime || null,
          departure_time: data.departureTime || null,
          companion: data.companion,
          budget: `${data.budgetRange[0]}-${data.budgetRange[1]}`,
          trip_style: data.tripStyle || null,
          avoid: data.avoid || null,
          trip_types: data.tripTypes,
          has_accommodation: data.hasAccommodation,
          hotel_name: data.hotel?.name ?? null,
          hotel_address: data.hotel?.address ?? null,
          hotel_lat: data.hotel?.lat ?? null,
          hotel_lng: data.hotel?.lng ?? null,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        // PostgrestError is not an Error instance — log the full object so the
        // real DB error (message/hint/code) appears in Vercel logs.
        console.error("[onboarding] trips INSERT failed", error);
        const msg = (error as { message?: string }).message ?? t("onboarding.saveFail");
        toast.error(msg);
        setLoading(false);
        return;
      }
      if (!trip) throw new Error(t("onboarding.saveFail"));
      navigate({ to: "/my-trip/$tripId", params: { tripId: trip.id } });
    } catch (error) {
      console.error("[onboarding] unexpected error", error);
      toast.error(error instanceof Error ? error.message : t("onboarding.saveFail"));
      setLoading(false);
    }
  };

  const locale = i18n.language.startsWith("en") ? enUS : esLocale;

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

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/new-trip"
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("onboarding.back")}
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>{t("onboarding.stepIndicator", { n: step + 1, total: totalSteps })}</span>
            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="flex gap-2">
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
        </div>

        <div
          key={step}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey) return;
            const tag = (e.target as HTMLElement).tagName;
            // Buttons handle Enter natively; textareas have their own handlers
            if (tag === "BUTTON" || tag === "TEXTAREA") return;
            e.preventDefault();
            if (!canContinue) return;
            if (step === totalSteps - 1) void finish();
            else next();
          }}
          className="rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
        >
          {step === 0 && (
            <StepShell title={t("onboarding.destTitle")} subtitle={t("onboarding.destSubtitle")}>
              <DestinationAutocomplete
                value={data.destination}
                onChange={(destination) => setData((prevData) => ({ ...prevData, destination }))}
                onEnter={() => {
                  if (canContinue) next();
                }}
                placeholder={t("onboarding.destPh")}
              />
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title={t("onboarding.datesTitle")} subtitle={t("onboarding.datesSubtitle")}>
              <DateRangeField
                value={data.dateRange}
                onChange={(dateRange) => setData((prevData) => ({ ...prevData, dateRange }))}
                locale={locale}
                startLabel={t("onboarding.dateStart")}
                endLabel={t("onboarding.dateEnd")}
                placeholder={t("onboarding.datePick")}
                nightsLabel={(count) => t("trip.nights", { count })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TimeInput
                  label={t("onboarding.arrivalTime")}
                  value={data.arrivalTime}
                  onChange={(arrivalTime) => setData((prevData) => ({ ...prevData, arrivalTime }))}
                />
                <TimeInput
                  label={t("onboarding.departureTime")}
                  value={data.departureTime}
                  onChange={(departureTime) =>
                    setData((prevData) => ({ ...prevData, departureTime }))
                  }
                />
              </div>
              <p className="text-xs font-medium text-sky-600">{t("onboarding.timeHint")}</p>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              title={t("onboarding.profileTitle")}
              subtitle={t("onboarding.profileSubtitle")}
            >
              <div>
                <SectionLabel>{t("onboarding.compTitle")}</SectionLabel>
                <OptionGrid
                  compact
                  value={data.companion}
                  onChange={(companion) => setData((prevData) => ({ ...prevData, companion }))}
                  options={[
                    ["solo", t("onboarding.compSolo"), "🧭"],
                    ["pareja", t("onboarding.compPair"), "💙"],
                    ["amigos", t("onboarding.compFriends"), "🎒"],
                    ["familia", t("onboarding.compFamily"), "🏡"],
                  ]}
                />
              </div>

              <div>
                <SectionLabel>{t("onboarding.budgetTitle")}</SectionLabel>
                <BudgetRangeSlider
                  value={data.budgetRange}
                  onChange={(budgetRange) => setData((prevData) => ({ ...prevData, budgetRange }))}
                />
              </div>

              <div>
                <SectionLabel>{t("onboarding.styleTitle")}</SectionLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {getTripTypesForDestination(data.destination).map((id) => {
                    const selected = data.tripTypes.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setData((prevData) => ({
                            ...prevData,
                            tripTypes: selected
                              ? prevData.tripTypes.filter((item) => item !== id)
                              : [...prevData.tripTypes, id],
                          }))
                        }
                        className={cn(
                          "rounded-2xl border px-4 py-2.5 text-left text-sm font-semibold transition active:scale-[0.97]",
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
                <textarea
                  value={data.tripStyle}
                  onChange={(event) =>
                    setData((prevData) => ({ ...prevData, tripStyle: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      next();
                    }
                  }}
                  placeholder={t("onboarding.stylePh")}
                  className="mt-3 min-h-20 w-full rounded-2xl border border-sky-200 bg-white/80 p-4 text-sm text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              title={t("onboarding.optionalTitle")}
              subtitle={t("onboarding.optionalSubtitle")}
            >
              <div>
                <SectionLabel>{t("onboarding.accomTitle")}</SectionLabel>
                <OptionGrid
                  compact
                  value={data.hasAccommodation ? "yes" : "no"}
                  onChange={(value) =>
                    setData((prevData) => ({
                      ...prevData,
                      hasAccommodation: value === "yes",
                      hotel: value === "yes" ? prevData.hotel : null,
                    }))
                  }
                  options={[
                    ["no", t("onboarding.accomNo"), "✨"],
                    ["yes", t("onboarding.accomYes"), "🏨"],
                  ]}
                />
                {data.hasAccommodation && (
                  <div className="mt-3">
                    <HotelMapPicker
                      destination={data.destination}
                      value={data.hotel}
                      onChange={(hotel) => setData((prevData) => ({ ...prevData, hotel }))}
                    />
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>{t("onboarding.avoidTitle")}</SectionLabel>
                <textarea
                  value={data.avoid}
                  onChange={(event) =>
                    setData((prevData) => ({ ...prevData, avoid: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void finish();
                    }
                  }}
                  placeholder={t("onboarding.avoidPh")}
                  className="min-h-24 w-full rounded-2xl border border-sky-200 bg-white/80 p-4 text-sm text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </StepShell>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0 || loading}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-white active:scale-[0.97] disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.back")}
          </button>
          <button
            type="button"
            onClick={step === totalSteps - 1 ? finish : next}
            disabled={!canContinue || loading}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {step === totalSteps - 1 ? t("onboarding.generate") : t("onboarding.next")}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold leading-tight text-sky-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2.5 text-base text-sky-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-sky-700">{children}</p>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-sky-200 bg-white/70 px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold text-sky-900 outline-none"
      />
    </label>
  );
}

function OptionGrid({
  value,
  onChange,
  options,
  compact,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
      {options.map(([id, label, icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "rounded-2xl border text-left transition active:scale-[0.97]",
            compact ? "flex items-center gap-2.5 px-4 py-3" : "p-5",
            value === id
              ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
              : "border-sky-200 bg-white/70 text-sky-900 hover:border-sky-300 hover:bg-white hover:shadow-sm",
          )}
        >
          <span className={compact ? "text-xl" : "text-2xl"}>{icon}</span>
          <span className={cn("block text-sm font-bold", !compact && "mt-2.5")}>{label}</span>
        </button>
      ))}
    </div>
  );
}
