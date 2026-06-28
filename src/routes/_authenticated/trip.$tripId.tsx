import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  FileText,
  LayoutGrid,
  Loader2,
  Wand2,
  Map as MapIcon,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/itinerary.functions";
import { AssistantEditPanel } from "@/components/AssistantEditPanel";
import { ShareDialog } from "@/components/trip/ShareDialog";
import { PublishToggle } from "@/components/trip/PublishToggle";
import { TripmatesModal } from "@/components/trip/TripmatesModal";
import { generatePostcardDataUrl } from "@/lib/postcard";
import { toast } from "sonner";

const TripMap = lazy(() => import("@/components/trip/GoogleTripMap").then((m) => ({ default: m.GoogleTripMap })));

export const Route = createFileRoute("/_authenticated/trip/$tripId")({
  component: ItineraryPage,
  head: () => ({ meta: [{ title: "Your itinerary – Itineraya" }] }),
});

type ActivityCategory =
  | "hotel"
  | "restaurant"
  | "activity"
  | "transport"
  | "sight"
  | "nightlife"
  | "shopping"
  | "other";

type Activity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: ActivityCategory;
  url?: string;
};

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

function bookingForCategory(
  category: ActivityCategory | undefined,
  placeOrTitle: string,
  destination: string,
  aiUrl?: string,
): BookingInfo | null {
  // Prefer AI-generated direct link when available
  if (aiUrl) {
    const brand =
      category === "hotel" ? "Booking" :
      category === "restaurant" ? "TheFork" :
      category === "nightlife" ? "TripAdvisor" :
      "GetYourGuide";
    return { kind: "book", brand, url: aiUrl };
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
  const [trip, setTrip] = useState<{
    id: string;
    destination: string;
    hero_image_url: string | null;
    itinerary: Itinerary | null;
    status: string;
  } | null>(null);
  const [view, setView] = useState<"cards" | "text" | "map">("cards");
  const [msgIdx, setMsgIdx] = useState(0);
  const [plan, setPlan] = useState<"free" | "viajero" | "explorador" | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", u.user.id)
        .maybeSingle();
      setPlan((((profile as { plan?: string } | null)?.plan ?? "free") as "free" | "viajero" | "explorador"));
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
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("trip.somethingWrong"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tripId, generate, t, i18n.language]);

  if (loading) return <LoadingScreen msg={LOADING_MESSAGES[msgIdx]} subtitle={t("trip.loadingSubtitle")} />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <h1 className="font-display text-xl font-bold text-sky-900">{t("trip.errorTitle")}</h1>
          <p className="mt-2 text-sm text-sky-700">{error}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white"
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
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="sticky top-0 z-20 border-b border-sky-100/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-sky-800 hover:bg-white sm:text-sm"
            aria-label={t("trip.backDashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("trip.backDashboard")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-sky-50 p-1">
              <button
                onClick={() => setView("cards")}
                className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                  view === "cards" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t("trip.viewCards")}</span>
              </button>
              <button
                onClick={() => setView("text")}
                className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                  view === "text" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t("trip.viewText")}</span>
              </button>
              <button
                onClick={() => setView("map")}
                className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                  view === "map" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t("trip.viewMap")}</span>
              </button>
            </div>
            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/80 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-white"
              aria-label={t("trip.share")}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("trip.share")}</span>
            </button>
            {plan && plan !== "free" ? (
              <button
                onClick={() => setAssistantOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-3 text-xs font-semibold text-white shadow-md shadow-[#1E6B9A]/25 transition hover:shadow-lg"
                aria-label={t("trip.editAssistant")}
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("trip.editAssistant")}</span>
              </button>
            ) : plan === "free" ? (
              <Link
                to="/pricing"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/80 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-white"
                title={t("trip.editAssistantLocked")}
                aria-label={t("trip.editAssistant")}
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("trip.editAssistant")}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full overflow-hidden md:h-80">
        {trip.hero_image_url ? (
          <img src={trip.hero_image_url} alt={trip.destination} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="mx-auto max-w-4xl text-white">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">{t("trip.heroTag")}</p>
            <h1 className="mt-1 font-display text-3xl font-bold drop-shadow-md md:text-4xl">{trip.destination}</h1>
            {itin.summary && <p className="mt-2 max-w-2xl text-sm opacity-90 md:text-base">{itin.summary}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <PublishToggle tripId={trip.id} />
        </div>
        <AnimatePresence mode="wait">
          {view === "cards" && (
            <motion.div key="cards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {itin.days.map((day, index) => (
                <DayCard day={day} destination={trip.destination} />
              ))}
            </motion.div>
          )}
          {view === "text" && (
            <motion.div key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-xl md:p-8">
              {itin.days.map((day, index) => (
                <div key={day.day} className="mb-6 last:mb-0">
                  <h2 className="font-display text-lg font-bold text-sky-900">
                    {t("trip.dayHeading", { n: day.day, title: day.title })}
                  </h2>
                  {day.subtitle && <p className="text-sm text-sky-600">{day.subtitle}</p>}
                  <ul className="mt-3 space-y-2">
                    {day.activities.map((a, i) => (
                      <li key={i} className="text-sm text-sky-900">
                        <span className="mr-1">{a.emoji ?? "📍"}</span>
                        <span className="font-semibold text-[#1E6B9A]">{a.time}</span>{" "}
                        — <span className="font-semibold">{a.place ?? a.title}</span>.{" "}
                        <span className="text-sky-700">{a.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          )}
          {view === "map" && (
            <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Suspense fallback={<div className="flex h-96 items-center justify-center rounded-3xl bg-white/80"><Loader2 className="h-6 w-6 animate-spin text-sky-500" /></div>}>
                <TripMap destination={trip.destination} days={itin.days} tripId={trip.id} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
    </div>
  );
}

function DayCard({ day, destination }: { day: Day; destination: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<null | "download" | "share">(null);

  const buildPostcard = async (): Promise<string> => {
    return generatePostcardDataUrl({
      destination,
      dayNumber: day.day,
      dayTitle: day.title,
      subtitle: day.subtitle,
      imageUrl: day.image_url ?? null,
      activities: day.activities.map((a) => ({
        time: a.time,
        emoji: a.emoji,
        title: a.title,
        place: a.place,
        description: a.description,
        url: a.url,
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
    <div className="overflow-hidden rounded-3xl bg-white/85 shadow-xl backdrop-blur-xl ring-1 ring-white/60">
      <div className="bg-white">
        {day.image_url && (
          <div className="relative h-48 w-full overflow-hidden md:h-56">
            <img src={day.image_url} alt={day.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <span className="inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                {t("trip.dayLabel", { n: day.day })}
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold drop-shadow">{day.title}</h3>
              {day.subtitle && <p className="text-sm opacity-90">{day.subtitle}</p>}
            </div>
          </div>
        )}
        {!day.image_url && (
          <div className="p-6 pb-2">
            <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E6B9A]">
              {t("trip.dayLabel", { n: day.day })}
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold text-sky-900">{day.title}</h3>
            {day.subtitle && <p className="text-sm text-sky-600">{day.subtitle}</p>}
          </div>
        )}

        <div className="space-y-3 p-5 md:p-6">
          {day.activities.map((a, i) => (
            <ActivityRow key={i} activity={a} destination={destination} />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-sky-100 px-5 py-3 text-xs text-sky-500">
          <img src={logoFull.url} alt="Itineraya" className="h-5 w-auto" />
          <span>{destination}</span>
        </div>
      </div>

      <div className="flex gap-2 border-t border-sky-100 bg-white/60 p-3">
        <button
          onClick={download}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 shadow-sm ring-1 ring-sky-200 transition hover:bg-sky-50 disabled:opacity-60"
        >
          {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t("trip.postcardDownloaded")}
        </button>
        <button
          onClick={share}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#15577E] disabled:opacity-60"
        >
          {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {t("trip.share")}
        </button>
      </div>
    </div>
  );
}

function ActivityRow({ activity, destination }: { activity: Activity; destination: string }) {
  const { t } = useTranslation();
  const placeQuery = `${activity.place || activity.title}, ${destination}`;
  const booking = bookingForCategory(activity.category, activity.place || activity.title, destination, activity.url);
  const bookingLabel = booking?.kind === "view" ? t("trip.viewVerb") : t("trip.book");
  return (
    <div className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/40 p-3">
      <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#1E6B9A] text-white">
        <CalendarIcon className="h-3 w-3 opacity-70" />
        <span className="mt-0.5 text-xs font-bold leading-none">{activity.time}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none">{activity.emoji ?? "📍"}</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sky-900">{activity.title}</div>
            {activity.place && (
              <div className="truncate text-xs font-medium text-sky-700/90">{activity.place}</div>
            )}
          </div>
        </div>
        <div className="mt-1 text-sm text-sky-700">{activity.description}</div>

        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={googleMapsUrl(placeQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-200 transition hover:bg-sky-50"
            title={t("trip.mapsTitle")}
          >
            <MapPin className="h-3.5 w-3.5" />
            {t("trip.maps")}
          </a>
          {booking && (
            <a
              href={booking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1E6B9A] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#15577E]"
              title={t("trip.bookOn", { label: bookingLabel, brand: booking.brand })}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {bookingLabel} · {booking.brand}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ msg, subtitle }: { msg: string; subtitle: string }) {
  const dots = useMemo(() => Array.from({ length: 12 }), []);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }} />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="relative h-32 w-32">
          {dots.map((_, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E6B9A]"
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 56,
                y: Math.sin((i / 12) * Math.PI * 2) * 56,
                opacity: [0.2, 1, 0.2],
              }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E6B9A] shadow-xl shadow-[#1E6B9A]/30">
              <MapIcon className="h-6 w-6 text-white" />
            </div>
          </motion.div>
        </div>

        <Sparkles className="mt-8 h-5 w-5 text-[#1E6B9A]" />
        <AnimatePresence mode="wait">
          <motion.h2
            key={msg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-3 font-display text-xl font-bold text-sky-900 md:text-2xl"
          >
            {msg}
          </motion.h2>
        </AnimatePresence>
        <p className="mt-2 max-w-xs text-sm text-sky-600">{subtitle}</p>
      </div>
    </div>
  );
}
