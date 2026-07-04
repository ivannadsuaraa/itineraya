import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  LayoutGrid,
  Loader2,
  Sparkles,
  MapPin,
  Calendar as CalendarIcon,
  Wand2,
  Map as MapIcon,
  Users,
  Clock,
  X,
  GanttChartSquare,
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
} from "lucide-react";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { Timeline, type TimelineEntry } from "@/components/ui/timeline";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/itinerary.functions";
import { AssistantEditPanel } from "@/components/AssistantEditPanel";
import { ShareDialog } from "@/components/trip/ShareDialog";
import { PublishToggle } from "@/components/trip/PublishToggle";
import { TripmatesModal } from "@/components/trip/TripmatesModal";
import { generatePostcardDataUrl } from "@/lib/postcard";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/PageTransition";

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
  completed?: boolean;
  notes?: string;
};

function getCategoryIcon(category: ActivityCategory | undefined) {
  switch (category) {
    case "hotel": return Building2;
    case "restaurant": return UtensilsCrossed;
    case "activity": return Zap;
    case "transport": return Train;
    case "sight": return Landmark;
    case "nightlife": return Music;
    case "shopping": return ShoppingBag;
    default: return MapPin;
  }
}

function getCategoryColor(category: ActivityCategory | undefined): string {
  switch (category) {
    case "hotel": return "bg-purple-100 text-purple-700";
    case "restaurant": return "bg-orange-100 text-orange-700";
    case "activity": return "bg-emerald-100 text-emerald-700";
    case "transport": return "bg-blue-100 text-blue-700";
    case "sight": return "bg-amber-100 text-amber-700";
    case "nightlife": return "bg-pink-100 text-pink-700";
    case "shopping": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-600";
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

  const LOADING_MESSAGES = useMemo(
    () => [t("trip.loading1"), t("trip.loading2"), t("trip.loading3"), t("trip.loading4")],
    [t],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [trip, setTrip] = useState<{
    id: string;
    destination: string;
    hero_image_url: string | null;
    itinerary: Itinerary | null;
    status: string;
  } | null>(null);
  const [view, setView] = useState<"cards" | "text" | "timeline">("cards");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [plan, setPlan] = useState<"free" | "viajero" | "explorador" | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [tripmatesOpen, setTripmatesOpen] = useState(false);

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
    if (!loading) return;
    const tm = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(tm);
  }, [loading, LOADING_MESSAGES.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: e1 } = await supabase
          .from("trips")
          .select("id,destination,hero_image_url,itinerary,status")
          .eq("id", tripId)
          .maybeSingle();
        if (e1) throw e1;
        if (!data) throw new Error(t("trip.notFound"));

        if (data.status === "ready" && data.itinerary) {
          if (!cancelled) {
            setTrip({ ...data, itinerary: data.itinerary as unknown as Itinerary });
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
    return <LoadingScreen msg={LOADING_MESSAGES[msgIdx]} subtitle={t("trip.loadingSubtitle")} />;

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
              onClick={() => { setError(null); setRetryKey((k) => k + 1); }}
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
    <PageTransition className="min-h-dvh bg-slate-50">
      {/* ── Sticky toolbar ── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
          <Link
            to="/dashboard"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            aria-label={t("trip.backDashboard")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("trip.backDashboard")}</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-full bg-slate-100 p-0.5">
              {(["cards", "text", "timeline"] as const).map((v) => {
                const Icon = v === "cards" ? LayoutGrid : v === "text" ? FileText : GanttChartSquare;
                const label = v === "cards" ? t("trip.viewCards") : v === "text" ? t("trip.viewText") : t("trip.viewTimeline");
                return (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`flex h-11 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                      view === v
                        ? "bg-sky-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Fullscreen map */}
            <button
              onClick={() => setMapModalOpen(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.viewMap")}</span>
            </button>

            {/* Action buttons */}
            <button
              onClick={() => setTripmatesOpen(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-3 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.invite")}</span>
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.share")}</span>
            </button>
            {plan && plan !== "free" ? (
              <button
                onClick={() => setAssistantOpen(true)}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sky-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-800"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("trip.editAssistant")}</span>
              </button>
            ) : plan === "free" ? (
              <Link
                to="/pricing"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
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
        {trip.hero_image_url ? (
          <img
            src={trip.hero_image_url}
            alt={trip.destination}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-950 to-sky-800" />
        )}
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
            <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t("trip.daysCount", { count: itin.days.length })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-5">
          <PublishToggle tripId={trip.id} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* Cards / Text / Timeline panel */}
          <div>
            {view === "cards" && (
              <div className="space-y-5">
                {itin.days.map((day, dayIdx) => (
                  <DayCard key={day.day} day={day} destination={trip.destination} dayIdx={dayIdx} onActivityUpdate={updateActivity} />
                ))}
              </div>
            )}
            {view === "text" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
                {itin.days.map((day) => (
                  <div key={day.day} className="mb-6 last:mb-0">
                    <h2 className="font-display text-lg font-bold text-sky-900">
                      {t("trip.dayHeading", { n: day.day, title: day.title })}
                    </h2>
                    {day.subtitle && <p className="text-sm text-slate-500">{day.subtitle}</p>}
                    <ul className="mt-3 space-y-2">
                      {day.activities.map((a, i) => (
                        <li key={i} className="text-sm text-slate-700">
                          <span className="mr-1">{a.emoji ?? "📍"}</span>
                          <span className="font-semibold text-sky-700">{a.time}</span> —{" "}
                          <span className="font-semibold">{a.place ?? a.title}</span>.{" "}
                          <span className="text-slate-500">{a.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {view === "timeline" && (
              <Timeline
                data={itin.days.map((day, dayIdx): TimelineEntry => ({
                  title: t("trip.dayHeading", { n: day.day, title: day.title }),
                  content: (
                    <div className="space-y-3">
                      {day.subtitle && (
                        <p className="text-sm text-slate-500 italic">{day.subtitle}</p>
                      )}
                      {day.activities.map((a, actIdx) => (
                        <ActivityRow key={actIdx} activity={a} destination={trip.destination} dayIdx={dayIdx} actIdx={actIdx} onUpdate={updateActivity} />
                      ))}
                    </div>
                  ),
                }))}
              />
            )}
          </div>

          {/* Map panel (persistent preview on desktop) */}
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-[60px]">
              <Suspense
                fallback={
                  <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                  </div>
                }
              >
                <TripMap destination={trip.destination} days={itin.days} tripId={trip.id} />
              </Suspense>
            </div>
          </div>
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
              <TripMap destination={trip.destination} days={itin.days} tripId={trip.id} />
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
      />
      <TripmatesModal
        open={tripmatesOpen}
        onClose={() => setTripmatesOpen(false)}
        tripId={trip.id}
        destination={trip.destination}
      />
    </PageTransition>
  );
}

function DayCard({ day, destination, dayIdx, onActivityUpdate }: {
  day: Day;
  destination: string;
  dayIdx: number;
  onActivityUpdate: (dayIdx: number, actIdx: number, updates: Partial<Activity>) => void;
}) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState<null | "download" | "share">(null);

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
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      {/* Day image */}
      {day.image_url ? (
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          <img
            src={day.image_url}
            alt={day.title}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="mt-1.5 font-display text-xl font-bold text-white drop-shadow sm:text-2xl">
              {day.title}
            </h3>
            {day.subtitle && <p className="text-xs text-white/80 sm:text-sm">{day.subtitle}</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-slate-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-900 text-white">
            <span className="text-sm font-bold">{day.day}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">{day.title}</h3>
            {day.subtitle && <p className="text-xs text-slate-500">{day.subtitle}</p>}
          </div>
        </div>
      )}

      {/* Activities */}
      <div className="space-y-2.5 p-4 sm:p-5">
        {day.activities.map((a, i) => (
          <ActivityRow key={i} activity={a} destination={destination} dayIdx={dayIdx} actIdx={i} onUpdate={onActivityUpdate} />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:p-4">
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
      className={`group flex gap-3 rounded-xl border p-3 transition-all ${
        activity.completed
          ? "border-slate-100 bg-slate-50/30 opacity-55"
          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
      }`}
    >
      {/* Time chip */}
      <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-900 text-white">
        <CalendarIcon className="h-3 w-3 opacity-60" />
        <span className="mt-0.5 text-xs font-bold leading-none">{activity.time}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="text-base leading-tight">{activity.emoji ?? "📍"}</span>
            <div className="min-w-0">
              <p
                className={`font-semibold leading-tight ${
                  activity.completed ? "line-through text-slate-400" : "text-slate-900"
                }`}
              >
                {activity.title}
              </p>
              {activity.place && (
                <p className="truncate text-xs text-slate-500">{activity.place}</p>
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
            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${catColor}`}
          >
            <CatIcon className="h-3 w-3" />
            {activity.category}
          </span>
        )}

        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{activity.description}</p>

        {/* Inline notes */}
        {showNotes && (
          <div className="mt-2">
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
          <p className="mt-1 text-xs italic text-slate-400">"{activity.notes}"</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <a
            href={googleMapsUrl(placeQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <MapPin className="h-3 w-3 text-slate-500" />
            {t("trip.maps")}
          </a>
          {booking && (
            <a
              href={booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1 rounded-full bg-sky-900 px-2.5 text-[11px] font-semibold text-white transition hover:bg-sky-800"
            >
              <Sparkles className="h-3 w-3" />
              {bookingLabel} · {booking.brand}
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowNotes((s) => !s)}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <StickyNote className="h-3 w-3" />
            {showNotes ? t("trip.noteHide") : activity.notes ? t("trip.noteView") : t("trip.noteAdd")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ msg, subtitle }: { msg: string; subtitle: string }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Progreso asintótico hacia 97: nunca se congela (el anterior moría en 91 %
  // y a los 20 s parecía colgado) + contador real de segundos para honestidad.
  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => {
      const s = (Date.now() - started) / 1000;
      setElapsed(Math.floor(s));
      setProgress(Math.min(97, Math.round(97 * (1 - Math.exp(-s / 18)))));
    }, 500);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-b from-sky-950 to-sky-900 p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-700/25 blur-3xl" />
        <div className="absolute -bottom-16 left-0 h-48 w-72 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-800/10 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
          <MapIcon className="h-7 w-7 text-white" />
        </div>

        <div className="mt-8">
          <TextShimmerWave
            className="font-display text-xl font-bold md:text-2xl"
            duration={1.4}
            spread={1.1}
            zDistance={14}
          >
            {msg}
          </TextShimmerWave>
        </div>

        <p className="mt-4 max-w-xs text-sm text-sky-400/80">{subtitle}</p>

        {/* Progress bar */}
        <div className="mt-8 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-sky-300 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs tabular-nums text-sky-500">
          {progress}% · {elapsed}s
        </p>
        <p className="mt-1 text-[11px] text-sky-500/80">{t("trip.loadingHint")}</p>

        <div className="mt-5 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          <Sparkles className="h-4 w-4 animate-pulse text-sky-300" />
        </div>
      </div>
    </div>
  );
}
