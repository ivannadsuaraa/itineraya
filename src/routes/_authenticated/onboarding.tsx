import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { EASE_OUT } from "@/lib/motion";

import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Info,
  MapPin,
  CalendarDays,
  Plane,
} from "lucide-react";
import { TakeoffOverlay } from "@/components/airport/TakeoffOverlay";
import { useTranslation } from "react-i18next";
import { differenceInCalendarDays, format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { DateRangeField, type DateRange } from "@/components/DateRangeField";
import { HotelMapPicker, type HotelSelection } from "@/components/HotelMapPicker";
import { DestinationAutocomplete } from "@/components/DestinationAutocomplete";
import { BudgetRangeSlider } from "@/components/BudgetRangeSlider";
import { supabase } from "@/integrations/supabase/client";
import { geocodeDestination, geocodeAndPersistTrip } from "@/lib/geocode";
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
  pace: string;
  firstVisit: boolean;
  budgetRange: [number, number];
  tripStyle: string;
  avoid: string;
  dietary: string[];
  tripTypes: string[];
  hasAccommodation: boolean;
  hotel: HotelSelection | null;
};

const dietaryIds = ["vegetarian", "vegan", "glutenFree", "halal", "allergies"];

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
  // Al terminar el wizard: animación de despegue antes de la pantalla de carga.
  const [takeoffTripId, setTakeoffTripId] = useState<string | null>(null);
  const [data, setData] = useState<FormData>(() => ({
    destination: prefill?.destination ?? "",
    dateRange: undefined,
    arrivalTime: "",
    departureTime: "",
    companion: "solo",
    pace: "balanced",
    firstVisit: true,
    budgetRange: [800, 2000],
    tripStyle: prefill?.tripType ?? "",
    avoid: "",
    dietary: [],
    tripTypes: Array.isArray(prefill?.tripTypes)
      ? prefill.tripTypes.filter((id) => tripTypeIds.includes(id))
      : [],
    hasAccommodation: false,
    hotel: null,
  }));

  // Pre-calienta la geocodificación en cuanto el usuario pasa del paso de
  // destino: cuando llegue a "Generar", las coordenadas ya estarán en caché
  // y el globo del dashboard mostrará el viaje sin esperar a Nominatim.
  useEffect(() => {
    if (step > 0 && data.destination.trim().length > 1) {
      void geocodeDestination(data.destination.trim());
    }
  }, [step, data.destination]);

  const MAX_TRIP_DAYS = 20;
  const tripDayCount =
    data.dateRange?.from && data.dateRange?.to
      ? differenceInCalendarDays(data.dateRange.to, data.dateRange.from) + 1
      : 0;
  const exceedsMaxDays = tripDayCount > MAX_TRIP_DAYS;

  // 8 pasos: destino → fechas → compañía → ritmo → presupuesto → gustos
  // → alojamiento → restricciones. Un concepto por pantalla. Solo destino y
  // fechas son obligatorios; el resto ya trae valores por defecto razonables.
  const totalSteps = 8;
  const canContinue =
    step === 0
      ? data.destination.trim().length > 1
      : step === 1
        ? Boolean(data.dateRange?.from && data.dateRange?.to) && !exceedsMaxDays
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

      // Coordenadas del destino: normalmente instantáneo (pre-calentado al
      // avanzar de paso). El race evita bloquear la creación si Nominatim
      // va lento; en ese caso se persisten después, sin retrasar al usuario.
      const coords = await Promise.race([
        geocodeDestination(data.destination.trim()),
        new Promise<null>((r) => setTimeout(() => r(null), 1800)),
      ]);

      const basePayload = {
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
      };
      const personalization = {
        pace: data.pace,
        first_visit: data.firstVisit,
        dietary: data.dietary.length > 0 ? data.dietary.join(",") : null,
      };
      const geo = coords ? { geo_lat: coords[0], geo_lng: coords[1] } : {};

      let { data: trip, error } = await supabase
        .from("trips")
        .insert({ ...basePayload, ...personalization, ...geo })
        .select("id")
        .single();

      // Fallback: si alguna migración aún no está aplicada en prod (columnas
      // pace/first_visit/dietary o geo_lat/geo_lng inexistentes), reintenta
      // solo con el payload base para no bloquear la creación del viaje.
      if (
        error &&
        /column|pace|first_visit|dietary|geo_lat|geo_lng|PGRST204/i.test(error.message ?? "")
      ) {
        console.warn("[onboarding] optional columns missing, retrying without them", error);
        ({ data: trip, error } = await supabase
          .from("trips")
          .insert(basePayload)
          .select("id")
          .single());
      }

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
      // Si Nominatim no llegó a tiempo, geocodifica y persiste en segundo
      // plano — la navegación es SPA, así que la petición sigue viva.
      if (!coords) void geocodeAndPersistTrip(trip.id, data.destination.trim());
      // Despegue: la pantalla simula la aceleración del avión antes de la
      // pantalla de carga (TakeoffOverlay navega en onDone). Con
      // reduced-motion el overlay llama a onDone inmediatamente.
      setTakeoffTripId(trip.id);
    } catch (error) {
      console.error("[onboarding] unexpected error", error);
      toast.error(error instanceof Error ? error.message : t("onboarding.saveFail"));
      setLoading(false);
    }
  };

  const locale = i18n.language.startsWith("en") ? enUS : esLocale;
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      {takeoffTripId && (
        <TakeoffOverlay
          onDone={() => navigate({ to: "/my-trip/$tripId", params: { tripId: takeoffTripId } })}
        />
      )}
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

      <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/new-trip"
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("onboarding.back")}
        </Link>

        <div className="mb-6">
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

        {/* "Tarjeta de embarque": el viaje va tomando forma según respondes.
            Aparece en cuanto hay destino y acumula fechas y compañía. */}
        {step > 0 && data.destination.trim().length > 1 && (
          <div className="mb-6 flex items-center gap-3 overflow-hidden rounded-2xl bg-white/85 p-2.5 pr-4 shadow-lg ring-1 ring-white/60 backdrop-blur-xl">
            <img
              src={`https://loremflickr.com/240/240/${encodeURIComponent(data.destination.split(",")[0].trim() + ",travel")}`}
              alt=""
              aria-hidden
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500">
                {t("onboarding.tripStripLabel")}
              </p>
              <p className="truncate font-display text-base font-bold text-sky-900">
                {data.destination}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-sky-600">
                {data.dateRange?.from && data.dateRange?.to && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(data.dateRange.from, "d MMM", { locale })} –{" "}
                    {format(data.dateRange.to, "d MMM", { locale })}
                    {tripDayCount > 0 && ` · ${t("trip.daysCount", { count: tripDayCount })}`}
                  </span>
                )}
                {step > 2 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {t(
                      `onboarding.comp${data.companion === "solo" ? "Solo" : data.companion === "pareja" ? "Pair" : data.companion === "amigos" ? "Friends" : "Family"}`,
                    )}
                  </span>
                )}
              </div>
            </div>
            <span className="hidden text-2xl sm:block" aria-hidden>
              ✈️
            </span>
          </div>
        )}

        <motion.div
          key={step}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 44 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: isMobile ? 0.2 : 0.3, ease: EASE_OUT }}
          // Swipe en móvil: arrastrar la tarjeta avanza/retrocede el paso,
          // con el propio arrastre como feedback visual (elástico).
          drag={isMobile && !reduceMotion ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 && canContinue && step < totalSteps - 1) next();
            else if (info.offset.x > 80 && step > 0) prev();
          }}
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
              {/* Mostrador de check-in: marco punteado tipo tarjeta de
                  embarque alrededor del buscador de destino. */}
              <div className="rounded-2xl border border-dashed border-[#1E6B9A]/40 bg-white/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-flight text-[10px] font-bold uppercase tracking-[0.28em] text-[#1E6B9A]">
                    <Plane className="h-3.5 w-3.5 -rotate-45" />
                    CHECK-IN
                  </span>
                  <span
                    aria-hidden
                    className="h-px w-24 bg-[repeating-linear-gradient(90deg,rgba(30,107,154,0.4)_0_8px,transparent_8px_16px)]"
                  />
                </div>
                <DestinationAutocomplete
                  value={data.destination}
                  onChange={(destination) => setData((prevData) => ({ ...prevData, destination }))}
                  onEnter={() => {
                    if (canContinue) next();
                  }}
                  placeholder={t("onboarding.destPh")}
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
              {exceedsMaxDays && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#1E6B9A]/20 bg-[#1E6B9A]/8 px-4 py-3 text-sm font-medium text-[#1E6B9A]">
                  <Info className="h-4 w-4 shrink-0" />
                  {t("onboarding.maxDaysWarning")}
                </div>
              )}
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
            <StepShell title={t("onboarding.compTitle")} subtitle={t("onboarding.compSubtitle")}>
              {/* Códigos PAX estilo tarjeta de embarque en cada opción */}
              <OptionGrid
                value={data.companion}
                onChange={(companion) => setData((prevData) => ({ ...prevData, companion }))}
                options={[
                  ["solo", t("onboarding.compSolo"), "🧭", "1 PAX"],
                  ["pareja", t("onboarding.compPair"), "💙", "2 PAX"],
                  ["amigos", t("onboarding.compFriends"), "🎒", "3+ PAX"],
                  ["familia", t("onboarding.compFamily"), "🏡", "FAMILY"],
                ]}
              />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title={t("onboarding.paceTitle")} subtitle={t("onboarding.paceSubtitle")}>
              <OptionGrid
                value={data.pace}
                onChange={(pace) => setData((prevData) => ({ ...prevData, pace }))}
                options={[
                  ["relaxed", t("onboarding.paceRelaxed"), "🌿"],
                  ["balanced", t("onboarding.paceBalanced"), "⚖️"],
                  ["intense", t("onboarding.paceIntense"), "⚡"],
                ]}
              />
              <div>
                <p className="mb-3 text-sm font-semibold text-sky-800">
                  {t("onboarding.firstVisitTitle", { destination: data.destination })}
                </p>
                <OptionGrid
                  compact
                  value={data.firstVisit ? "yes" : "no"}
                  onChange={(value) =>
                    setData((prevData) => ({ ...prevData, firstVisit: value === "yes" }))
                  }
                  options={[
                    ["yes", t("onboarding.firstVisitYes"), "🆕"],
                    ["no", t("onboarding.firstVisitNo"), "🔁"],
                  ]}
                />
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              title={t("onboarding.budgetTitle")}
              subtitle={t("onboarding.budgetSubtitle")}
            >
              <BudgetRangeSlider
                value={data.budgetRange}
                onChange={(budgetRange) => setData((prevData) => ({ ...prevData, budgetRange }))}
              />
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title={t("onboarding.styleTitle")} subtitle={t("onboarding.styleSubtitle")}>
              <div>
                <p className="mb-3 text-xs font-semibold text-sky-600">
                  {t("onboarding.styleMultiSubtitle")}
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
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
                          "rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition active:scale-[0.97]",
                          selected
                            ? "chip-selected border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
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
                  className="mt-4 min-h-24 w-full rounded-2xl border border-sky-200 bg-white/80 p-4 text-base text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100 sm:text-sm"
                />
              </div>
            </StepShell>
          )}

          {step === 6 && (
            <StepShell title={t("onboarding.accomTitle")} subtitle={t("onboarding.accomSubtitle")}>
              <OptionGrid
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
                <div className="mt-4">
                  <HotelMapPicker
                    destination={data.destination}
                    value={data.hotel}
                    onChange={(hotel) => setData((prevData) => ({ ...prevData, hotel }))}
                  />
                </div>
              )}
            </StepShell>
          )}

          {step === 7 && (
            <StepShell title={t("onboarding.avoidTitle")} subtitle={t("onboarding.avoidSubtitle")}>
              <div>
                <p className="mb-3 text-xs font-semibold text-sky-600">
                  {t("onboarding.dietaryTitle")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dietaryIds.map((id) => {
                    const selected = data.dietary.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setData((prevData) => ({
                            ...prevData,
                            dietary: selected
                              ? prevData.dietary.filter((item) => item !== id)
                              : [...prevData.dietary, id],
                          }))
                        }
                        className={cn(
                          "rounded-full border px-4 py-2.5 text-sm font-semibold transition active:scale-[0.97]",
                          selected
                            ? "chip-selected border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
                            : "border-sky-200 bg-white/70 text-sky-800 hover:border-sky-300 hover:bg-white",
                        )}
                      >
                        {t(`onboarding.dietary.${id}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
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
                className="min-h-32 w-full rounded-2xl border border-sky-200 bg-white/80 p-4 text-base text-sky-900 outline-none transition focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100 sm:text-sm"
                autoFocus
              />
            </StepShell>
          )}
        </motion.div>

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
        className="mt-1 w-full bg-transparent text-base font-semibold text-sky-900 outline-none sm:text-sm"
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
      {options.map(([id, label, icon, code]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "relative rounded-2xl border text-left transition active:scale-[0.97]",
            compact ? "flex items-center gap-2.5 px-4 py-3" : "p-5",
            value === id
              ? "chip-selected border-[#1E6B9A] bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/20"
              : "border-sky-200 bg-white/70 text-sky-900 hover:border-sky-300 hover:bg-white hover:shadow-sm",
          )}
        >
          {code && (
            <span
              className={cn(
                "absolute right-3 top-3 rounded-md px-1.5 py-0.5 font-flight text-[9px] font-bold uppercase tracking-[0.18em]",
                value === id ? "bg-white/20 text-white" : "bg-sky-100 text-sky-700",
              )}
            >
              {code}
            </span>
          )}
          <span className={compact ? "text-xl" : "text-2xl"}>{icon}</span>
          <span className={cn("block text-sm font-bold", !compact && "mt-2.5")}>{label}</span>
        </button>
      ))}
    </div>
  );
}
