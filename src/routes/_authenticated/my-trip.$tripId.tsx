import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { EASE_OUT } from "@/lib/motion";

import {
  ArrowLeft,
  Download,
  Share2,
  LayoutGrid,
  Loader2,
  Sparkles,
  MapPin,
  Calendar as CalendarIcon,
  Wand2,
  Map as MapIcon,
  Clock,
  X,
  Building2,
  UtensilsCrossed,
  Train,
  Landmark,
  Zap,
  Music,
  ShoppingBag,
  CheckCircle2,
  Circle,
  StickyNote,
  CloudRain,
  Newspaper,
  Globe2,
  Ticket,
  Lock,
  ArrowRight,
} from "lucide-react";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/itinerary.functions";
import { AssistantEditPanel } from "@/components/AssistantEditPanel";
import { ShareDialog } from "@/components/trip/ShareDialog";
import { PublishToggle } from "@/components/trip/PublishToggle";
import { SmartImage, destinationFallback } from "@/components/ui/SmartImage";
import { generatePostcardDataUrl } from "@/lib/postcard";
import { toast } from "sonner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { isPaymentsConfigured } from "@/lib/stripe";
import { TRIP_PASS_PRICE_ID } from "@/lib/trip-pass";
import { PageTransition } from "@/components/ui/PageTransition";
import { ReadingProgress } from "@/components/ui/ReadingProgress";
import { BoardingPass } from "@/components/airport/BoardingPass";
import { RevealGroup, RevealItem } from "@/components/ui/ScrollReveal";
import { geocodeDestination } from "@/lib/geocode";
import { getCountryInfo, type CountryInfo } from "@/lib/country";
import {
  getWeather,
  weatherForDate,
  weatherEmoji,
  type WeatherDay,
  type WeatherNow,
} from "@/lib/weather";
import { getDestinationNews, type NewsArticle } from "@/lib/news.functions";

const TripMap = lazy(() =>
  import("@/components/trip/SmartTripMap").then((m) => ({ default: m.SmartTripMap })),
);

export const Route = createFileRoute("/_authenticated/my-trip/$tripId")({
  component: ItineraryPage,
  head: () => ({ meta: [{ title: "Tu itinerario – Itineraya" }] }),
});

type ActivityCategory =
  "hotel" | "restaurant" | "activity" | "transport" | "sight" | "nightlife" | "shopping" | "other";

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: ActivityCategory;
  url?: string;
  tip?: string;
  completed?: boolean;
  notes?: string;
};

function getCategoryIcon(category: ActivityCategory | undefined) {
  switch (category) {
    case "hotel":
      return Building2;
    case "restaurant":
      return UtensilsCrossed;
    case "activity":
      return Zap;
    case "transport":
      return Train;
    case "sight":
      return Landmark;
    case "nightlife":
      return Music;
    case "shopping":
      return ShoppingBag;
    default:
      return MapPin;
  }
}

function getCategoryColor(category: ActivityCategory | undefined): string {
  switch (category) {
    case "hotel":
      return "bg-purple-100 text-purple-700";
    case "restaurant":
      return "bg-orange-100 text-orange-700";
    case "activity":
      return "bg-emerald-100 text-emerald-700";
    case "transport":
      return "bg-blue-100 text-blue-700";
    case "sight":
      return "bg-amber-100 text-amber-700";
    case "nightlife":
      return "bg-pink-100 text-pink-700";
    case "shopping":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

type Day = {
  day: number;
  title: string;
  subtitle?: string;
  image_url?: string | null;
  image_query?: string;
  activities: Activity[];
};

type Itinerary = {
  summary?: string;
  days: Day[];
};

function formatDateRange(start: string, end: string, lang: string): string {
  const fmt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const locale = lang.startsWith("en") ? "en-US" : lang;
  const a = new Date(`${start}T00:00:00`).toLocaleDateString(locale, fmt);
  const b = new Date(`${end}T00:00:00`).toLocaleDateString(locale, fmt);
  return `${a} – ${b}`;
}

function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Acento visual rotatorio: cada día del itinerario tiene su propio color en
// los chips de número y hora, para que los días se distingan de un vistazo.
const DAY_ACCENTS = [
  "from-sky-700 to-cyan-600",
  "from-violet-700 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-emerald-700 to-teal-500",
  "from-rose-600 to-pink-500",
] as const;

function dayAccent(dayIdx: number): string {
  return DAY_ACCENTS[dayIdx % DAY_ACCENTS.length];
}

function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

type BookingInfo = {
  kind: "book" | "view";
  brand: string;
  url: string;
};

// Etiqueta el enlace por su dominio real — nunca "Booking" para un enlace que
// en realidad es Google Maps. Los enlaces del modelo solo se aceptan en https.
function brandFromUrl(url: string): { brand: string; kind: "book" | "view" } | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("booking.com")) return { brand: "Booking", kind: "book" };
    if (host.includes("thefork")) return { brand: "TheFork", kind: "book" };
    if (host.includes("getyourguide")) return { brand: "GetYourGuide", kind: "book" };
    if (host.includes("tripadvisor")) return { brand: "TripAdvisor", kind: "view" };
    if (host.includes("google.")) return null; // ya hay chip de Maps: no duplicar
    return { brand: host.split(".")[0], kind: "view" };
  } catch {
    return null;
  }
}

function bookingForCategory(
  category: ActivityCategory | undefined,
  placeOrTitle: string,
  destination: string,
  aiUrl?: string,
): BookingInfo | null {
  if (aiUrl && aiUrl.startsWith("https://")) {
    const fromUrl = brandFromUrl(aiUrl);
    if (fromUrl) return { kind: fromUrl.kind, brand: fromUrl.brand, url: aiUrl };
    // Enlace de Maps u opaco → seguimos con el deep-link por categoría.
  }
  const q = `${placeOrTitle} ${destination}`.trim();

  switch (category) {
    case "hotel":
      return {
        kind: "book",
        brand: "Booking",
        url: `https://www.booking.com/search.html?ss=${encodeURIComponent(placeOrTitle)}`,
      };
    case "restaurant":
      return {
        kind: "book",
        brand: "TheFork",
        url: `https://www.thefork.com/search?cityName=${encodeURIComponent(destination)}&searchText=${encodeURIComponent(placeOrTitle)}`,
      };
    case "nightlife":
      return {
        kind: "view",
        brand: "TripAdvisor",
        url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q)}`,
      };
    case "activity":
    case "sight":
      return {
        kind: "book",
        brand: "GetYourGuide",
        url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}`,
      };
    default:
      return null;
  }
}

function ItineraryPage() {
  const { t, i18n } = useTranslation();
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const generate = useServerFn(generateItinerary);
  const reduceMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [loadingDestination, setLoadingDestination] = useState<string | null>(null);
  const [loadingStartDate, setLoadingStartDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [trip, setTrip] = useState<{
    id: string;
    destination: string;
    hero_image_url: string | null;
    itinerary: Itinerary | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    companion?: string | null;
    geo_lat?: number | null;
    geo_lng?: number | null;
  } | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [plan, setPlan] = useState<"free" | "viajero" | "explorador" | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const updateActivity = (dayIdx: number, actIdx: number, updates: Partial<Activity>) => {
    setTrip((prev) => {
      if (!prev?.itinerary) return prev;
      const newDays = prev.itinerary.days.map((d, di) => {
        if (di !== dayIdx) return d;
        return {
          ...d,
          activities: d.activities.map((a, ai) => (ai === actIdx ? { ...a, ...updates } : a)),
        };
      });
      const newItinerary = { ...prev.itinerary, days: newDays };
      void supabase
        .from("trips")
        .update({ itinerary: newItinerary } as never)
        .eq("id", prev.id)
        .then(({ error }) => {
          // RLS silently rejects updates from non-owners (invited tripmates);
          // surface it instead of pretending the change was saved.
          if (error) toast.error(t("trip.somethingWrong"));
        });
      return { ...prev, itinerary: newItinerary };
    });
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", u.user.id)
        .maybeSingle();
      setPlan(
        ((profile as { plan?: string } | null)?.plan ?? "free") as
          "free" | "viajero" | "explorador",
      );
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: e1 } = await supabase
          .from("trips")
          .select(
            "id,destination,hero_image_url,itinerary,status,start_date,end_date,companion,geo_lat,geo_lng",
          )
          .eq("id", tripId)
          .maybeSingle();
        if (e1) throw e1;
        if (!data) throw new Error(t("trip.notFound"));
        if (!cancelled) {
          setLoadingDestination(data.destination);
          setLoadingStartDate(data.start_date ?? null);
        }

        if (data.status === "ready" && data.itinerary) {
          if (!cancelled) {
            setTrip({
              ...data,
              itinerary: data.itinerary as unknown as Itinerary,
              geo_lat: (data as { geo_lat?: number | null }).geo_lat ?? null,
              geo_lng: (data as { geo_lng?: number | null }).geo_lng ?? null,
            });
            setLoading(false);
          }
          return;
        }

        const result = await generate({ data: { tripId, language: i18n.language } });
        if (cancelled) return;
        if (!result) throw new Error("Itinerary generation failed");
        setTrip({
          id: tripId,
          destination: data.destination,
          hero_image_url: result.hero_image_url ?? null,
          itinerary: result.itinerary as unknown as Itinerary,
          status: "ready",
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
          companion: (data as { companion?: string | null }).companion ?? null,
          geo_lat: (data as { geo_lat?: number | null }).geo_lat ?? null,
          geo_lng: (data as { geo_lng?: number | null }).geo_lng ?? null,
        });
        // Momento de máxima motivación: el itinerario acaba de aparecer.
        // Proponer compartirlo aquí multiplica el alcance del enlace público.
        toast.success(t("trip.readyShare"), { duration: 5000 });
        setTimeout(() => {
          if (!cancelled) setShareOpen(true);
        }, 1600);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("trip.somethingWrong"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, generate, t, i18n.language, retryKey]);

  if (loading)
    return <LoadingScreen destination={loadingDestination} startDate={loadingStartDate} />;

  // El momento de máxima motivación para pagar: el usuario acaba de describir
  // su viaje, ha pulsado "generar" y choca con el límite. Aquí el error
  // genérico se sustituye por la oferta concreta (Pase 4,99 € / Viajero).
  if (error?.includes("LIMIT_REACHED")) {
    return (
      <LimitPaywall
        plan={plan}
        onRetry={() => {
          setError(null);
          setRetryKey((k) => k + 1);
        }}
        onBack={() => navigate({ to: "/dashboard" })}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-sky-950 to-sky-900 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <MapIcon className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">{t("trip.errorTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setError(null);
                setRetryKey((k) => k + 1);
              }}
              className="rounded-full bg-sky-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              {t("trip.errorRetry")}
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-full bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              {t("trip.errorBack")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trip?.itinerary) return null;
  const itin = trip.itinerary;

  return (
    <PageTransition className="min-h-dvh bg-slate-50" personality="focus">
      {/* Progress bar de lectura del itinerario */}
      <ReadingProgress />
      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <Link
            to="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            aria-label={t("trip.backDashboard")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("trip.backDashboard")}</span>
          </Link>

          {/* 4 botones principales: Tarjetas, Mapa, Compartir, Editar */}
          <div className="flex items-center gap-2.5">
            {/* Tarjetas */}
            <span className="inline-flex h-11 items-center gap-2 rounded-full bg-sky-900 px-3.5 text-xs font-semibold text-white">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.viewCards")}</span>
            </span>

            {/* Mapa */}
            <button
              onClick={() => setMapModalOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.viewMap")}</span>
            </button>

            {/* Compartir */}
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.share")}</span>
            </button>
            {plan && plan !== "free" ? (
              <button
                onClick={() => setAssistantOpen(true)}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-sky-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("trip.editAssistant")}</span>
              </button>
            ) : plan === "free" ? (
              <Link
                to="/pricing"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                title={t("trip.editAssistantLocked")}
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("trip.editAssistant")}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Hero image ── */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
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
          <div className="mx-auto max-w-5xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-md">
              <MapPin className="h-3 w-3" />
              {t("trip.heroTag")}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white drop-shadow-md md:text-4xl lg:text-5xl">
              {trip.destination}
            </h1>
            {itin.summary && (
              <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">{itin.summary}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t("trip.daysCount", { count: itin.days.length })}
              </span>
              {trip.start_date && trip.end_date && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {formatDateRange(trip.start_date, trip.end_date, i18n.language)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 md:py-8 lg:px-8">
        {/* Boarding pass del viaje: el itinerario empieza como empieza un
            vuelo. Descargable como imagen. */}
        <div className="mb-8">
          <BoardingPass
            tripId={trip.id}
            destination={trip.destination}
            startDate={trip.start_date}
            daysCount={itin.days.length}
            companion={trip.companion}
            plan={plan}
          />
        </div>

        {/* Mapa prominente en móvil: en desktop vive fijo a la derecha, pero en
            móvil quedaba escondido tras un botón del toolbar. El panel se
            "despliega" (clip-path) al entrar en pantalla. */}
        <motion.button
          type="button"
          onClick={() => setMapModalOpen(true)}
          initial={reduceMotion ? undefined : { clipPath: "inset(0 0 100% 0 round 16px)" }}
          whileInView={{ clipPath: "inset(0 0 0% 0 round 16px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="relative mb-5 block w-full overflow-hidden rounded-2xl text-left shadow-sm ring-1 ring-slate-200 transition hover:shadow-md lg:hidden"
        >
          <div className="relative h-28 bg-[#EAF4FB]">
            <svg
              viewBox="0 0 400 112"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <path
                d="M0 30 H400 M0 66 H400 M0 96 H400 M80 0 V112 M190 0 V112 M300 0 V112"
                stroke="#C9E4F5"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M30 88 Q 110 62 160 50 T 280 62 T 375 22"
                stroke="#1E6B9A"
                strokeWidth="3"
                strokeDasharray="7 5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            {[
              { x: "6%", y: "72%", n: 1 },
              { x: "39%", y: "38%", n: 2 },
              { x: "69%", y: "50%", n: 3 },
              { x: "92%", y: "14%", n: 4 },
            ].map((p) => (
              <span
                key={p.n}
                className="absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sky-900 text-[10px] font-bold text-white ring-2 ring-white shadow"
                style={{ left: p.x, top: p.y }}
              >
                {p.n}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{t("trip.mapPreviewTitle")}</p>
              <p className="text-xs text-slate-500">
                {t("trip.mapPreviewSubtitle", { count: itin.days.length })}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-900 px-3.5 py-2 text-xs font-bold text-white">
              <MapIcon className="h-3.5 w-3.5" />
              {t("trip.mapPreviewCta")}
            </span>
          </div>
        </motion.button>

        <div className="mb-5">
          <PublishToggle tripId={trip.id} />
        </div>

        {/* Navegación de días: sticky bajo el toolbar, el indicador sigue el
            scroll con animación suave (layoutId). */}
        {itin.days.length > 1 && (
          <DayScrollNav count={itin.days.length} active={activeDay} onActiveChange={setActiveDay} />
        )}

        {/* grid-cols-1 + minmax(0,1fr) es CRÍTICO: sin columna base explícita, en
            móvil la rejilla creaba una columna implícita auto que se estiraba al
            ancho intrínseco de la imagen del día (~640px) y quedaba recortada por
            el overflow-x:clip global → las cards "se cortaban". */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Cards / Text / Timeline panel */}
          <div className="min-w-0">
            {/* Tarjetas de días: reveladas en cascada al aparecer la página. */}
            <div className="space-y-6 sm:space-y-7">
              {itin.days.map((day, dayIdx) => (
                <div key={day.day} id={`day-section-${dayIdx}`} data-day-anchor={dayIdx}>
                  <DayReveal index={dayIdx}>
                    <DayCard
                      day={day}
                      destination={trip.destination}
                      dayIdx={dayIdx}
                      date={trip.start_date ? addDaysToDateString(trip.start_date, dayIdx) : null}
                      onActivityUpdate={updateActivity}
                    />
                  </DayReveal>
                </div>
              ))}
            </div>
          </div>

          {/* Map panel (persistent preview on desktop) — se despliega de
              arriba abajo (clip-path) la primera vez que entra en pantalla */}
          <div className="hidden lg:block">
            <motion.div
              initial={
                reduceMotion
                  ? undefined
                  : { clipPath: "inset(0 0 100% 0 round 16px)", opacity: 0.5 }
              }
              animate={{ clipPath: "inset(0 0 0% 0 round 16px)", opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.25 }}
              className="lg:sticky lg:top-[60px]"
            >
              <Suspense
                fallback={
                  <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                  </div>
                }
              >
                <TripMap
                  destination={trip.destination}
                  days={itin.days}
                  tripId={trip.id}
                  geo_lat={trip.geo_lat}
                  geo_lng={trip.geo_lng}
                />
              </Suspense>
            </motion.div>
          </div>
        </div>

        {/* Info del destino + noticias: viven fuera de la grid de dos
            columnas para ocupar el ancho completo en cualquier tamaño. */}
        <div className="mt-6 space-y-6">
          <DestinationInfoPanel destination={trip.destination} />
          <BeforeYouGoNews destination={trip.destination} />
        </div>
      </div>

      {/* Fullscreen map modal */}
      {mapModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm sm:px-6">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-sky-900">
              <MapIcon className="h-4.5 w-4.5 text-[#1E6B9A]" />
              {t("trip.mapTitle")}
            </h2>
            <button
              type="button"
              onClick={() => setMapModalOpen(false)}
              aria-label={t("layout.back")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-5">
            <Suspense
              fallback={
                <div className="flex h-full min-h-[60vh] items-center justify-center rounded-2xl bg-white">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                </div>
              }
            >
              <TripMap
                destination={trip.destination}
                days={itin.days}
                tripId={trip.id}
                geo_lat={trip.geo_lat}
                geo_lng={trip.geo_lng}
              />
            </Suspense>
          </div>
        </div>
      )}

      <AssistantEditPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        tripId={trip.id}
        destination={trip.destination}
        onItineraryUpdated={(itinerary) =>
          setTrip((prev) => (prev ? { ...prev, itinerary: itinerary as Itinerary } : prev))
        }
      />
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        tripId={trip.id}
        destination={trip.destination}
        days={itin.days}
        startDate={trip.start_date}
        endDate={trip.end_date}
      />
    </PageTransition>
  );
}

// Bandera, idioma, moneda, zona horaria y clima actual del destino — todo
// viene de APIs gratuitas (RestCountries + OpenWeatherMap) y cachea en
// localStorage, así que si fallan la sección simplemente no aparece.
function DestinationInfoPanel({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const [country, setCountry] = useState<CountryInfo | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);

  const countryName = destination.includes(",")
    ? destination.split(",").slice(-1)[0].trim()
    : destination;

  useEffect(() => {
    let cancelled = false;
    void getCountryInfo(countryName).then((info) => {
      if (!cancelled) setCountry(info);
    });
    return () => {
      cancelled = true;
    };
  }, [countryName]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await geocodeDestination(destination);
      if (!coords || cancelled) return;
      const { current } = await getWeather(coords[0], coords[1]);
      if (!cancelled) setWeather(current);
    })();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  const items: Array<{ label: string; value: string }> = [];
  if (country?.languages.length) {
    items.push({ label: t("trip.destInfoLanguage"), value: country.languages.join(", ") });
  }
  if (country?.currencyCode) {
    items.push({
      label: t("trip.destInfoCurrency"),
      value: country.currencySymbol
        ? `${country.currencyName || country.currencyCode} (${country.currencySymbol})`
        : country.currencyCode,
    });
  }
  if (country?.utcOffsetHours !== null && country?.utcOffsetHours !== undefined) {
    const sign = country.utcOffsetHours >= 0 ? "+" : "";
    items.push({ label: t("trip.destInfoTimezone"), value: `UTC${sign}${country.utcOffsetHours}` });
  }
  if (weather) {
    items.push({
      label: t("trip.destInfoTypicalWeather"),
      value: `${weatherEmoji(weather.main)} ${weather.temp}°C · ${t(`weather.${weather.main}`, { defaultValue: weather.main })}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-sky-900">
        <Globe2 className="h-4.5 w-4.5 text-[#1E6B9A]" />
        {country?.flagEmoji ? `${country.flagEmoji} ` : ""}
        {t("trip.destInfoTitle")}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {item.label}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Noticias de viaje/turismo/cultura de los últimos 30 días. Se piden a un
// server function (NewsAPI bloquea CORS en cliente) que cachea 24h en
// Supabase; si no hay resultados, la sección no se renderiza.
function BeforeYouGoNews({ destination }: { destination: string }) {
  const { t, i18n } = useTranslation();
  const fetchNews = useServerFn(getDestinationNews);
  const [articles, setArticles] = useState<NewsArticle[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNews({ data: { destination } })
      .then((result) => {
        if (!cancelled) setArticles(result);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [destination, fetchNews]);

  if (!articles || articles.length === 0) return null;

  const locale = i18n.language.startsWith("en") ? "en-US" : i18n.language;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-sky-900">
        <Newspaper className="h-4.5 w-4.5 text-[#1E6B9A]" />
        {t("trip.newsTitle")}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {articles.map((a) => (
          <a
            key={a.url}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-xl ring-1 ring-slate-100 transition hover:shadow-md"
          >
            {a.imageUrl && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <img
                  src={a.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-semibold text-slate-800">{a.title}</p>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {t("trip.newsSource", {
                  source: a.source,
                  date: new Date(a.publishedAt).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                  }),
                })}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Navegación de días pegajosa: chips "Día N" cuyo estado activo sigue el
// scroll (IntersectionObserver sobre las secciones de día) y cuyo indicador
// se desliza con animación de layout compartido.
function DayScrollNav({
  count,
  active,
  onActiveChange,
}: {
  count: number;
  active: number;
  onActiveChange: (idx: number) => void;
}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-day-anchor]"));
    if (sections.length === 0) return;
    // La franja central del viewport decide qué día está "activo".
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.dayAnchor);
            if (!Number.isNaN(idx)) onActiveChange(idx);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [count, onActiveChange]);

  const jumpTo = (idx: number) => {
    onActiveChange(idx);
    document
      .getElementById(`day-section-${idx}`)
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav
      aria-label={t("trip.dayNavAria")}
      className="sticky top-16 z-10 -mx-4 mb-6 overflow-x-auto bg-slate-50/95 px-4 py-2.5 backdrop-blur-sm scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-6 md:px-6"
    >
      <div className="flex w-max gap-1.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-100">
        {Array.from({ length: count }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => jumpTo(idx)}
            className={`relative flex h-11 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
              active === idx ? "text-white" : "text-slate-500 hover:text-slate-800"
            }`}
            aria-current={active === idx ? "true" : undefined}
          >
            {active === idx && (
              <motion.span
                layoutId="day-nav-pill"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                }
                className="absolute inset-0 rounded-full bg-sky-900 shadow-sm"
              />
            )}
            <span className="relative">{t("trip.dayLabel", { n: idx + 1 })}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Envoltorio de revelado por día. Los tres primeros días entran en cascada
// (stagger); los demás se animan cuando el usuario los alcanza al hacer scroll.
function DayReveal({ index, children }: { index: number; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.985, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: isMobile ? 0.4 : 0.55,
        ease: EASE_OUT,
        delay: index < 3 ? index * (isMobile ? 0.1 : 0.14) : 0,
      }}
    >
      {children}
    </motion.div>
  );
}

function DayCard({
  day,
  destination,
  dayIdx,
  date,
  onActivityUpdate,
}: {
  day: Day;
  destination: string;
  dayIdx: number;
  date: string | null;
  onActivityUpdate: (dayIdx: number, actIdx: number, updates: Partial<Activity>) => void;
}) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState<null | "download" | "share">(null);
  const [dayWeather, setDayWeather] = useState<WeatherDay | null>(null);

  // Clima previsto de este día concreto (solo disponible dentro de la
  // ventana de 5 días de OpenWeatherMap; fuera de rango, no se muestra nada).
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    (async () => {
      const coords = await geocodeDestination(destination);
      if (!coords || cancelled) return;
      const { forecast } = await getWeather(coords[0], coords[1]);
      if (!cancelled) setDayWeather(weatherForDate(forecast, date));
    })();
    return () => {
      cancelled = true;
    };
  }, [destination, date]);

  // Parallax sutil de la foto del día: la imagen (escalada un 12 %) se
  // desplaza con el scroll. Desactivado en móvil y con reduced-motion.
  const imageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const parallaxOn = !reduce && !isMobile;
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const buildPostcard = async (): Promise<string> => {
    return generatePostcardDataUrl({
      destination,
      dayNumber: day.day,
      dayTitle: day.title,
      subtitle: day.subtitle,
      imageUrl: day.image_url ?? null,
      locale: i18n.language,
      activities: day.activities.map((a) => ({
        time: a.time,
        emoji: a.emoji,
        title: a.title,
        place: a.place,
        description: a.description,
        url: a.url,
        category: a.category,
      })),
    });
  };

  const download = async () => {
    setBusy("download");
    try {
      const dataUrl = await buildPostcard();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${destination.replace(/\s+/g, "-").toLowerCase()}-day-${day.day}.png`;
      a.click();
      toast.success(t("trip.postcardDownloaded"));
    } catch {
      toast.error(t("trip.postcardFail"));
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    try {
      const dataUrl = await buildPostcard();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `day-${day.day}.png`, { type: "image/png" });
      const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      const shareTitle = t("trip.shareTitle", { n: day.day, destination });
      const shareText = t("trip.shareText", { title: day.title, destination });
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
      } else if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `${day.title} – ${day.activities.map((a) => `${a.time}: ${a.title}`).join(" • ")}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("trip.linkCopied"));
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") toast.error(t("trip.shareFail"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      {/* Day image */}
      {day.image_url ? (
        <div
          ref={imageRef}
          className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/7]"
        >
          <motion.div
            style={parallaxOn ? { y: parallaxY, scale: 1.12 } : undefined}
            className="h-full w-full will-change-transform"
          >
            <SmartImage
              src={day.image_url}
              fallbackSrc={destinationFallback(`${day.title} ${destination}`, 1400, 620)}
              gradientClassName="bg-gradient-to-br from-sky-700 to-sky-900"
              alt={day.title}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          {dayWeather && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {weatherEmoji(dayWeather.main)} {dayWeather.tempMax}° / {dayWeather.tempMin}°
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <span
              className={`inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm ${dayAccent(dayIdx)}`}
            >
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold text-white drop-shadow sm:text-2xl">
              {day.title}
            </h3>
            {day.subtitle && (
              <p className="mt-0.5 text-sm text-white/80 sm:text-sm">{day.subtitle}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-slate-50 px-5 py-5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${dayAccent(dayIdx)}`}
          >
            <span className="text-sm font-bold">{day.day}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="mt-0.5 font-display text-xl font-bold text-slate-900">{day.title}</h3>
            {day.subtitle && <p className="mt-0.5 text-sm text-slate-500">{day.subtitle}</p>}
          </div>
          {dayWeather && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {weatherEmoji(dayWeather.main)} {dayWeather.tempMax}° / {dayWeather.tempMin}°
            </span>
          )}
        </div>
      )}

      {/* Aviso de lluvia: sutil, no bloquea nada, solo orienta la planificación */}
      {dayWeather?.isRain && (
        <div className="flex items-center gap-2.5 border-b border-blue-100 bg-blue-50/70 px-5 py-3">
          <CloudRain className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-700">{t("trip.rainyDayWarning")}</p>
        </div>
      )}

      {/* Activities — cascada con stagger de 40 ms al entrar en pantalla */}
      <RevealGroup stagger={0.04} amount={0.08} className="space-y-3.5 p-4 sm:space-y-4 sm:p-6">
        {day.activities.map((a, i) => (
          <RevealItem key={i}>
            <ActivityRow
              activity={a}
              destination={destination}
              dayIdx={dayIdx}
              actIdx={i}
              onUpdate={onActivityUpdate}
            />
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Footer actions */}
      <div className="flex gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
        <button
          onClick={download}
          disabled={busy !== null}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60 sm:text-sm"
        >
          {busy === "download" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {t("trip.downloadPostcard")}
        </button>
        <button
          onClick={share}
          disabled={busy !== null}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-sky-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:opacity-60 sm:text-sm"
        >
          {busy === "share" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {t("trip.share")}
        </button>
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
  destination,
  dayIdx = 0,
  actIdx = 0,
  onUpdate = () => {},
}: {
  activity: Activity;
  destination: string;
  dayIdx?: number;
  actIdx?: number;
  onUpdate?: (dayIdx: number, actIdx: number, updates: Partial<Activity>) => void;
}) {
  const { t } = useTranslation();
  const [showNotes, setShowNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(activity.notes ?? "");
  const placeQuery = `${activity.place || activity.title}, ${destination}`;
  const booking = bookingForCategory(
    activity.category,
    activity.place || activity.title,
    destination,
    activity.url,
  );
  const bookingLabel = booking?.kind === "view" ? t("trip.viewVerb") : t("trip.book");
  const CatIcon = getCategoryIcon(activity.category);
  const catColor = getCategoryColor(activity.category);

  const toggleCompleted = () => onUpdate(dayIdx, actIdx, { completed: !activity.completed });
  const saveNote = () => {
    if (noteDraft !== (activity.notes ?? "")) {
      onUpdate(dayIdx, actIdx, { notes: noteDraft });
    }
  };

  return (
    <div
      className={`group flex gap-3 rounded-2xl border p-3.5 transition-all sm:gap-3.5 sm:p-4 ${
        activity.completed
          ? "border-slate-100 bg-slate-50/30 opacity-55"
          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
      }`}
    >
      {/* Time chip — más compacto en móvil para dar aire al contenido */}
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-900 text-white sm:h-14 sm:w-16">
        <CalendarIcon className="h-3 w-3 opacity-60" />
        <span className="mt-1 text-xs font-bold leading-none">{activity.time}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="text-lg leading-tight">{activity.emoji ?? "📍"}</span>
            <div className="min-w-0">
              <p
                className={`font-semibold leading-snug ${
                  activity.completed ? "line-through text-slate-400" : "text-slate-900"
                }`}
              >
                {activity.title}
              </p>
              {activity.place && (
                <p className="mt-0.5 truncate text-xs text-slate-500">{activity.place}</p>
              )}
            </div>
          </div>
          {/* Completed checkbox */}
          <button
            type="button"
            onClick={toggleCompleted}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-300 transition hover:text-emerald-500"
            title={activity.completed ? t("trip.markPending") : t("trip.markDone")}
          >
            {activity.completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Category badge */}
        {activity.category && activity.category !== "other" && (
          <span
            className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${catColor}`}
          >
            <CatIcon className="h-3 w-3" />
            {activity.category}
          </span>
        )}

        <p className="mt-2 text-sm leading-relaxed text-slate-600">{activity.description}</p>

        {/* Insider tip */}
        {activity.tip && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50/70 px-3.5 py-2.5">
            <span className="text-sm leading-tight">💎</span>
            <p className="text-xs leading-relaxed text-amber-800">
              <span className="font-semibold">{t("trip.tipLabel")}</span> {activity.tip}
            </p>
          </div>
        )}

        {/* Inline notes */}
        {showNotes && (
          <div className="mt-2.5">
            <textarea
              className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 sm:text-sm"
              rows={2}
              placeholder={t("trip.notePh")}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={saveNote}
            />
          </div>
        )}
        {!showNotes && activity.notes && (
          <p className="mt-1.5 text-xs italic text-slate-400">"{activity.notes}"</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={googleMapsUrl(placeQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <MapPin className="h-3 w-3 text-slate-500" />
            {t("trip.maps")}
          </a>
          {booking && (
            <a
              href={booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1 rounded-full bg-sky-900 px-2.5 text-[11px] font-semibold text-white transition hover:bg-sky-800"
            >
              <Sparkles className="h-3 w-3" />
              {bookingLabel} · {booking.brand}
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            className="inline-flex h-11 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <StickyNote className="h-3 w-3" />
            {showNotes
              ? t("trip.noteHide")
              : activity.notes
                ? t("trip.noteView")
                : t("trip.noteAdd")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Umbrales de progreso en los que arranca cada etapa del "backstage" de la
// generación. Las etapas cuentan lo que hace la IA de verdad (zonas → sitios
// → rutas → joyas → retoques) para que la espera se sienta como creación.
const LOADING_STAGES = [
  { key: "loadingStage1", at: 0 },
  { key: "loadingStage2", at: 18 },
  { key: "loadingStage3", at: 40 },
  { key: "loadingStage4", at: 64 },
  { key: "loadingStage5", at: 85 },
] as const;

function LoadingScreen({
  destination,
  startDate,
}: {
  destination: string | null;
  startDate: string | null;
}) {
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [weather, setWeather] = useState<WeatherNow | null>(null);

  // Clima actual del destino, solo para el mensaje de bienvenida — el forecast
  // real del viaje se muestra más tarde en cada day card.
  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    (async () => {
      const coords = await geocodeDestination(destination);
      if (!coords || cancelled) return;
      const { current } = await getWeather(coords[0], coords[1]);
      if (!cancelled) setWeather(current);
    })();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  // Asintótico hacia 97 con τ=9 s: ~87 % a los 20 s (duración típica de la
  // generación) y nunca se congela; el contador real de segundos da honestidad.
  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => {
      const s = (Date.now() - started) / 1000;
      setElapsed(Math.floor(s));
      setProgress(Math.min(97, Math.round(97 * (1 - Math.exp(-s / 9)))));
    }, 400);
    return () => clearInterval(tick);
  }, []);

  const destLabel = destination ?? t("trip.loadingDestFallback");
  const stageIdx = LOADING_STAGES.reduce((acc, s, i) => (progress >= s.at ? i : acc), 0);
  const monthLabel = startDate
    ? new Date(`${startDate}T00:00:00`).toLocaleDateString(
        i18n.language.startsWith("en") ? "en-US" : i18n.language,
        { month: "long" },
      )
    : null;
  const weatherMsg =
    weather && monthLabel
      ? t("trip.loadingWeatherMsg", {
          destination: destLabel,
          month: monthLabel,
          temp: weather.temp,
          condition: t(`weather.${weather.main}`, { defaultValue: weather.main }),
        })
      : null;
  // Misma fuente de imágenes sin clave que el fallback del servidor.
  const bgUrl = destination
    ? `https://loremflickr.com/1600/900/${encodeURIComponent(destination.split(",")[0].trim() + ",travel")}`
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-sky-950 p-6">
      {/* Foto del destino a pantalla completa con overlay oscuro */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt=""
          aria-hidden
          onLoad={() => setBgLoaded(true)}
          className={`absolute inset-0 h-full w-full scale-105 object-cover transition-opacity duration-1000 ${
            bgLoaded ? "opacity-60" : "opacity-0"
          }`}
          style={{ animation: bgLoaded ? "loading-kenburns 24s ease-out forwards" : undefined }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-950/80 via-sky-950/60 to-sky-950/90" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-700/25 blur-3xl" />
        <div className="absolute -bottom-16 left-0 h-48 w-72 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        {/* Campo de estrellas: partículas que titilan y ascienden despacio
            mientras la IA trabaja. Posiciones deterministas, GPU-only. */}
        {Array.from({ length: 26 }).map((_, i) => {
          const left = (i * 37 + 13) % 100;
          const top = (i * 53 + 29) % 100;
          const size = 1.5 + ((i * 7) % 3);
          const dur = 3.5 + ((i * 11) % 5);
          const delay = (i * 0.47) % 4;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-sky-200"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                opacity: 0,
                animation: `loading-star ${dur}s ease-in-out ${delay}s infinite`,
                willChange: "transform, opacity",
              }}
            />
          );
        })}
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-sky-100 ring-1 ring-white/20 backdrop-blur-md">
          <Sparkles className="h-3 w-3" />
          {t("trip.loadingTag")}
        </span>

        <h1 className="mt-4 font-display text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
          {destLabel}
        </h1>

        {weatherMsg && <p className="mt-2 text-sm text-sky-200/90">{weatherMsg}</p>}

        <div className="mt-6 min-h-8">
          <TextShimmerWave
            key={stageIdx}
            className="font-display text-lg font-bold md:text-xl"
            duration={1.4}
            spread={1.1}
            zDistance={14}
          >
            {t(`trip.${LOADING_STAGES[stageIdx].key}`, { destination: destLabel })}
          </TextShimmerWave>
        </div>

        {/* Checklist de etapas: lo ya hecho queda marcado, lo pendiente en espera */}
        <ul className="mt-6 w-full max-w-xs space-y-2 text-left">
          {LOADING_STAGES.map((s, i) => (
            <li
              key={s.key}
              className={`flex items-center gap-2.5 text-sm transition-colors duration-500 ${
                i < stageIdx ? "text-sky-200" : i === stageIdx ? "text-white" : "text-sky-200/40"
              }`}
            >
              {i < stageIdx ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : i === stageIdx ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{t(`trip.${s.key}`, { destination: destLabel })}</span>
            </li>
          ))}
        </ul>

        {/* Progress bar */}
        <div className="mt-7 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-sky-200 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs tabular-nums text-sky-200/80">
          {progress}% · {elapsed}s
        </p>
        <p className="mt-1 text-[11px] text-sky-200/60">{t("trip.loadingHint")}</p>
      </div>

      <style>{`
        @keyframes loading-kenburns {
          from { transform: scale(1.05) translateY(0); }
          to { transform: scale(1.12) translateY(-1.5%); }
        }
        @keyframes loading-star {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.8); }
          20% { opacity: 0.9; }
          60% { opacity: 0.45; }
          80% { opacity: 0.1; }
          99% { transform: translateY(-26px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

/* ─── Paywall al chocar con el límite de itinerarios ───
   Se muestra en lugar del error genérico cuando la generación devuelve
   LIMIT_REACHED: el Pase de Viaje (4,99 €, pago único) como héroe y el plan
   Viajero como alternativa de mejor valor. */
function LimitPaywall({
  plan,
  onRetry,
  onBack,
}: {
  plan: "free" | "viajero" | "explorador" | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, checkoutElement, isOpen } = useStripeCheckout();
  const isViajero = plan === "viajero";

  const buyPass = () => {
    if (!isPaymentsConfigured()) {
      navigate({ to: "/pricing" });
      return;
    }
    openCheckout({ priceId: TRIP_PASS_PRICE_ID, mode: "payment" });
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-950 to-sky-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-lg">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-sky-900">
          {t(isViajero ? "trip.limitTitleViajero" : "trip.limitTitle")}
        </h1>
        <p className="mt-2 text-sm text-sky-700">
          {t(isViajero ? "trip.limitSubtitleViajero" : "trip.limitSubtitle")}
        </p>

        {/* Pase de Viaje — héroe */}
        <button
          type="button"
          onClick={buyPass}
          className="mt-6 flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-sky-950 to-sky-800 p-5 text-left text-white shadow-lg transition hover:shadow-xl active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#38bdf8]/20">
            <Ticket className="h-6 w-6 text-[#38bdf8]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{t("trip.limitPassTitle")}</span>
            <span className="block text-xs text-sky-200">{t("trip.limitPassDesc")}</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#38bdf8] px-3 py-1.5 text-sm font-bold text-sky-950">
            4,99 €
          </span>
        </button>

        {/* Alternativa: suscripción */}
        <button
          type="button"
          onClick={() => navigate({ to: "/pricing" })}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-50 px-5 py-3.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-200 transition hover:bg-sky-100"
        >
          <Sparkles className="h-4 w-4" />
          {t(isViajero ? "trip.limitUpgradeViajero" : "trip.limitUpgradeFree")}
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold text-sky-600 hover:underline"
          >
            {t("trip.limitRetry")}
          </button>
          <span className="text-sky-300">·</span>
          <button
            type="button"
            onClick={onBack}
            className="font-semibold text-sky-600 hover:underline"
          >
            {t("trip.errorBack")}
          </button>
        </div>
      </div>

      {/* Checkout embebido del Pase de Viaje */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={closeCheckout}
              className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-sky-700 shadow-md ring-1 ring-sky-100 hover:bg-sky-50"
              aria-label={t("pricing.close")}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto rounded-2xl">{checkoutElement}</div>
          </div>
        </div>
      )}
    </div>
  );
}
