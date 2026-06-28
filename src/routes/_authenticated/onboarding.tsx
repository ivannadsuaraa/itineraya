import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { es as esLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { DateRangeField, type DateRange } from "@/components/DateRangeField";
import { HotelMapPicker, type HotelSelection } from "@/components/HotelMapPicker";
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
  budget: string;
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
}>;

const tripTypeIds = ["beach", "party", "cultural", "food", "relax", "nature", "romantic", "family", "adventure", "special", "architecture"];

function isBeachDestination(destination: string): boolean {
  const beachKeywords = [
    "playa", "beach", "cancún", "cancun", "tulum", "riviera", "maldives", "bali",
    "phuket", "koh ", "pattaya", "honolulu", "waikiki", "ibiza", "marbella",
    "algarve", "costa ", "punta cana", "puerto vallarta", "acapulco", "mazatlán",
    "santa marta", "cartagena", "miami beach", "fortaleza", "salvador",
    "rio", "copacabana", "ciprus", "cyprus", "mykonos", "santorini", "crete",
    "mallorca", "menorca", "formentera", "varadero", "mar del plata",
    "nice", "cannes", "saint-tropez", "costa del sol", "costa brava",
    "costa azul", "amalfi", "cinque terre", "key west", "virgin islands",
    "bahamas", "seychelles", "mauritius", "boracay", "krabi", "da nang",
    "nha trang", "goa", "sri lanka", "zanzibar", "cape town",
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
  return date.toISOString().slice(0, 10);
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
    budget: prefill?.budget ?? "medio",
    tripStyle: prefill?.tripType ?? "",
    avoid: "",
    tripTypes: [],
    hasAccommodation: false,
    hotel: null,
  }));

  const totalSteps = 7;
  const canContinue =
    step === 0 ? data.destination.trim().length > 1 : step === 1 ? Boolean(data.dateRange?.from && data.dateRange?.to) : true;

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
          budget: data.budget,
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

      if (error || !trip) throw error ?? new Error(t("onboarding.saveFail"));
      navigate({ to: "/trip/$tripId", params: { tripId: trip.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("onboarding.saveFail"));
      setLoading(false);
    }
  };

  const locale = i18n.language.startsWith("en") ? enUS : esLocale;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/new-trip" className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white">
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
              <div key={index} className={cn("h-2 flex-1 rounded-full transition", index <= step ? "bg-[#1E6B9A]" : "bg-white/70")} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-white/85 p-6 shadow-xl ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
          >
            {step === 0 && (
              <StepShell title={t("onboarding.destTitle")} subtitle={t("onboarding.destSubtitle")}>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500" />
                  <input
                    value={data.destination}
                    onChange={(event) => setData((prevData) => ({ ...prevData, destination: event.target.value }))}
                    placeholder={t("onboarding.destPh")}
                    className="w-full rounded-2xl border border-sky-200 bg-white/80 py-4 pl-12 pr-4 text-base font-medium text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                  />
                </div>
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
                  <TimeInput label={t("onboarding.arrivalTime")} value={data.arrivalTime} onChange={(arrivalTime) => setData((prevData) => ({ ...prevData, arrivalTime }))} />
                  <TimeInput label={t("onboarding.departureTime")} value={data.departureTime} onChange={(departureTime) => setData((prevData) => ({ ...prevData, departureTime }))} />
                </div>
                <p className="text-xs font-medium text-sky-600">{t("onboarding.timeHint")}</p>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title={t("onboarding.compTitle")} subtitle={t("onboarding.compSubtitle")}>
                <OptionGrid
                  value={data.companion}
                  onChange={(companion) => setData((prevData) => ({ ...prevData, companion }))}
                  options={[
                    ["solo", t("onboarding.compSolo"), "🧭"],
                    ["pareja", t("onboarding.compPair"), "💙"],
                    ["amigos", t("onboarding.compFriends"), "🎒"],
                    ["familia", t("onboarding.compFamily"), "🏡"],
                  ]}
                />
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title={t("onboarding.budgetTitle")} subtitle={t("onboarding.budgetSubtitle")}>
                <OptionGrid
                  value={data.budget}
                  onChange={(budget) => setData((prevData) => ({ ...prevData, budget }))}
                  options={[
                    ["economico", t("onboarding.budgetEco"), "€"],
                    ["medio", t("onboarding.budgetMid"), "€€"],
                    ["sin-limite", t("onboarding.budgetMax"), "€€€"],
                  ]}
                />
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title={t("onboarding.styleTitle")} subtitle={t("onboarding.styleMultiSubtitle")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {getTripTypesForDestination(data.destination).map((id) => {
                    const selected = data.tripTypes.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setData((prevData) => ({
                            ...prevData,
                            tripTypes: selected ? prevData.tripTypes.filter((item) => item !== id) : [...prevData.tripTypes, id],
                          }))
                        }
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                          selected ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg" : "border-sky-200 bg-white/70 text-sky-800 hover:bg-white",
                        )}
                      >
                        {t(`onboarding.tripTypes.${id}`)}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={data.tripStyle}
                  onChange={(event) => setData((prevData) => ({ ...prevData, tripStyle: event.target.value }))}
                  placeholder={t("onboarding.stylePh")}
                  className="min-h-28 w-full rounded-2xl border border-sky-200 bg-white/80 p-4 text-sm text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                />
              </StepShell>
            )}

            {step === 5 && (
              <StepShell title={t("onboarding.accomTitle")} subtitle={t("onboarding.accomSubtitle")}>
                <OptionGrid
                  value={data.hasAccommodation ? "yes" : "no"}
                  onChange={(value) => setData((prevData) => ({ ...prevData, hasAccommodation: value === "yes", hotel: value === "yes" ? prevData.hotel : null }))}
                  options={[
                    ["no", t("onboarding.accomNo"), "✨"],
                    ["yes", t("onboarding.accomYes"), "🏨"],
                  ]}
                />
                {data.hasAccommodation && <HotelMapPicker destination={data.destination} value={data.hotel} onChange={(hotel) => setData((prevData) => ({ ...prevData, hotel }))} />}
              </StepShell>
            )}

            {step === 6 && (
              <StepShell title={t("onboarding.avoidTitle")} subtitle={t("onboarding.avoidSubtitle")}>
                <textarea
                  value={data.avoid}
                  onChange={(event) => setData((prevData) => ({ ...prevData, avoid: event.target.value }))}
                  placeholder={t("onboarding.avoidPh")}
                  className="min-h-32 w-full rounded-2xl border border-sky-200 bg-white/80 p-4 text-sm text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                />
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0 || loading}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-white disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("onboarding.back")}
          </button>
          <button
            type="button"
            onClick={step === totalSteps - 1 ? finish : next}
            disabled={!canContinue || loading}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {step === totalSteps - 1 ? t("onboarding.generate") : t("onboarding.next")}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-sky-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-sky-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-2xl border border-sky-200 bg-white/70 px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">{label}</span>
      <input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold text-sky-900 outline-none" />
    </label>
  );
}

function OptionGrid({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map(([id, label, icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            value === id ? "border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg" : "border-sky-200 bg-white/70 text-sky-900 hover:bg-white",
          )}
        >
          <span className="text-2xl">{icon}</span>
          <span className="mt-2 block text-sm font-bold">{label}</span>
        </button>
      ))}
    </div>
  );
}
