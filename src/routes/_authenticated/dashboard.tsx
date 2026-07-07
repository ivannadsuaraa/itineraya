import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {
  Plus,
  MapPin,
  Calendar,
  Sparkles,
  Bookmark,
  Wand2,
  X,
  Eye,
  Share2,
  ArrowRight,
  Lock,
  CalendarDays,
  Trash2,
  Clock,
  Zap,
  LayoutGrid,
  Plane,
  Gift,
  Copy,
  Check,
} from "lucide-react";
import { DepartureBoard } from "@/components/airport/DepartureBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShareDialog } from "@/components/trip/ShareDialog";
import {
  getSeasonalInspirations,
  fetchWeather,
  weatherEmoji,
  type Inspiration,
} from "@/lib/dashboard-helpers";
import { lazy, Suspense } from "react";
import { geocodeAndPersistTrip, primeGeocodeCache } from "@/lib/geocode";
import { SmartImage, destinationFallback } from "@/components/ui/SmartImage";
import type { PolaroidMarker } from "@/components/ui/cobe-globe-polaroids";

const GlobePolaroids = lazy(() =>
  import("@/components/ui/cobe-globe-polaroids").then((m) => ({ default: m.GlobePolaroids })),
);
const TripsCalendar = lazy(() =>
  import("@/components/ui/trips-calendar").then((m) => ({ default: m.TripsCalendar })),
);
import { PageTransition } from "@/components/ui/PageTransition";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Mis viajes – Itineraya" }] }),
  component: DashboardPage,
});

type Trip = {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  hero_image_url: string | null;
  status: string;
  created_at: string;
  geo_lat?: number | null;
  geo_lng?: number | null;
};

type SavedInspo = {
  id: string;
  slug: string;
  destination: string;
  hero_image_url: string | null;
  summary: string | null;
  n_days: number | null;
};

function dateLocale(lang: string) {
  return lang.toLowerCase().startsWith("en") ? enUS : es;
}

const UNSPLASH_FALLBACK = [
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=400&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=400&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=400&fit=crop&auto=format&q=75",
];

// Carga de viajes tolerante a migraciones: si las columnas geo_lat/geo_lng
// aún no existen en prod, la query con ellas falla entera y el dashboard se
// quedaba vacío. Reintenta sin las columnas geo antes de rendirse.
async function fetchTrips(userId: string) {
  const base = "id,destination,start_date,end_date,hero_image_url,status,created_at";
  const withGeo = await supabase
    .from("trips")
    .select(`${base},geo_lat,geo_lng`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!withGeo.error) return withGeo;
  return supabase
    .from("trips")
    .select(base)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [saved, setSaved] = useState<SavedInspo[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [isFree, setIsFree] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"viajes" | "calendario">("viajes");
  const [tripsView, setTripsView] = useState<"board" | "cards">("board");
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Inclinación sutil de las cards según la dirección del scroll: la
  // velocidad de scroll (suavizada con muelle) se mapea a unos grados de
  // rotateX. Al parar, vuelve a 0. Solo desktop y sin reduced-motion.
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 160, damping: 34, mass: 0.6 });
  const cardTilt = useTransform(smoothVelocity, [-1400, 0, 1400], [3, 0, -3]);
  const tiltOn = !reduceMotion && !isMobile;

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUserId(u.user?.id ?? null);
      const meta = u.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      // Fallback al prefijo del email antes que al genérico "viajero": un saludo
      // con nombre real se siente personal aunque el usuario no rellenara perfil.
      const emailPrefix = u.user?.email
        ?.split("@")[0]
        ?.replace(/[._-]+/g, " ")
        .split(" ")[0];
      const prettyPrefix = emailPrefix
        ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
        : undefined;
      setName(
        meta?.full_name?.split(" ")[0] ??
          meta?.name?.split(" ")[0] ??
          prettyPrefix ??
          t("dashboard.traveler"),
      );

      if (!u.user) {
        setTrips([]);
        setSaved([]);
        return;
      }

      const { data: profRaw } = await supabase
        .from("profiles")
        .select("welcome_completed, plan, trial_ends_at, referral_count")
        .eq("id", u.user.id)
        .maybeSingle();
      const prof = profRaw as unknown as {
        welcome_completed?: boolean;
        plan?: string;
        trial_ends_at?: string | null;
        referral_count?: number;
      } | null;
      const userPlan = prof?.plan ?? "free";
      const trialEndsAt = prof?.trial_ends_at ?? null;
      setIsFree(userPlan === "free");
      setReferralCount(prof?.referral_count ?? 0);
      if (userPlan === "free" && trialEndsAt) {
        const msLeft = new Date(trialEndsAt).getTime() - Date.now();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) setTrialDaysLeft(daysLeft);
      }
      if (prof && !prof.welcome_completed) {
        navigate({ to: "/welcome", replace: true });
        return;
      }

      const [{ data, error }, { data: savedData }] = await Promise.all([
        fetchTrips(u.user.id),
        supabase
          .from("saved_inspirations")
          .select("id,slug,destination,hero_image_url,summary,n_days")
          .order("created_at", { ascending: false }),
      ]);
      if (error) {
        toast.error(t("dashboard.loadFail"));
        setTrips([]);
      } else {
        setTrips((data ?? []) as unknown as Trip[]);
      }
      setSaved((savedData ?? []) as SavedInspo[]);
    })();
  }, [navigate, t]);

  const remixSaved = (s: SavedInspo) => {
    const payload = { destination: s.destination, nDays: s.n_days ?? undefined };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  const planInspiration = (i: Inspiration) => {
    const payload = { destination: `${i.destination}, ${i.country}` };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  const deleteTrip = async (id: string) => {
    if (!userId) return;
    const prev = trips ?? [];
    setTrips(prev.filter((tr) => tr.id !== id));
    const { error } = await supabase.from("trips").delete().eq("id", id).eq("user_id", userId);
    if (error) {
      setTrips(prev);
      toast.error(t("dashboard.deleteFail"));
    }
  };

  const copyReferralLink = async () => {
    if (!userId) return;
    const url = `https://itineraya.com?ref=${userId}`;
    await navigator.clipboard.writeText(url);
    setReferralCopied(true);
    toast.success(t("dashboard.referral.copied"));
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const removeSaved = async (id: string) => {
    const prev = saved ?? [];
    setSaved(prev.filter((x) => x.id !== id));
    const { error } = await supabase.from("saved_inspirations").delete().eq("id", id);
    if (error) {
      setSaved(prev);
      toast.error(t("dashboard.loadFail"));
    }
  };

  const upcoming = useMemo(
    () =>
      (trips ?? [])
        .filter(
          (tr) => tr.start_date && new Date(tr.start_date) >= new Date(new Date().toDateString()),
        )
        .sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1))[0],
    [trips],
  );

  const otherTrips = useMemo(
    () => (trips ?? []).filter((tr) => !upcoming || tr.id !== upcoming.id),
    [trips, upcoming],
  );

  const locale = dateLocale(i18n.language);
  const inspirations = useMemo(() => getSeasonalInspirations(), []);

  const [globeMarkers, setGlobeMarkers] = useState<PolaroidMarker[] | undefined>(undefined);
  const geocodeAbortRef = useRef(false);

  // Cada viaje del usuario se convierte en un punto del globo en su posición
  // real. Las coordenadas ya guardadas pintan al instante; las que faltan se
  // geocodifican en segundo plano (cola secuencial de Nominatim) y el globo
  // se va completando marcador a marcador.
  useEffect(() => {
    if (!trips || trips.length === 0) {
      setGlobeMarkers(undefined);
      return;
    }
    geocodeAbortRef.current = false;
    const rotations = [-5, 4, -3, 6, -4, 3, -2, 5];

    const toMarker = (trip: Trip, i: number, coords: [number, number]): PolaroidMarker => ({
      id: trip.id,
      location: coords,
      image: trip.hero_image_url ?? UNSPLASH_FALLBACK[i % UNSPLASH_FALLBACK.length],
      caption: trip.destination.split(",")[0],
      rotate: rotations[i % rotations.length],
    });

    const resolved = new Map<string, PolaroidMarker>();
    const publish = () => {
      if (geocodeAbortRef.current) return;
      // Mantiene el orden de la lista de viajes, no el orden de resolución
      const ordered = trips
        .map((tr) => resolved.get(tr.id))
        .filter((m): m is PolaroidMarker => m !== undefined);
      setGlobeMarkers(ordered.length > 0 ? ordered : undefined);
    };

    const pending: Trip[] = [];
    trips.forEach((trip, i) => {
      if (trip.geo_lat != null && trip.geo_lng != null) {
        const coords: [number, number] = [trip.geo_lat, trip.geo_lng];
        primeGeocodeCache(trip.destination, coords);
        resolved.set(trip.id, toMarker(trip, i, coords));
      } else {
        pending.push(trip);
      }
    });
    publish();

    pending.forEach((trip) => {
      const i = trips.indexOf(trip);
      void geocodeAndPersistTrip(trip.id, trip.destination).then((coords) => {
        if (!coords || geocodeAbortRef.current) return;
        resolved.set(trip.id, toMarker(trip, i, coords));
        publish();
      });
    });

    return () => {
      geocodeAbortRef.current = true;
    };
  }, [trips]);

  const calendarTrips = useMemo(
    () =>
      (trips ?? [])
        .filter((t) => t.start_date && t.end_date)
        .map((t) => ({
          id: t.id,
          destination: t.destination,
          start_date: t.start_date!,
          end_date: t.end_date!,
          hero_image_url: t.hero_image_url,
        })),
    [trips],
  );

  return (
    <PageTransition className="min-h-dvh bg-slate-50">
      {/* ── Dark header with globe ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-700/25 blur-3xl" />
          <div className="absolute -bottom-8 left-0 h-48 w-80 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_320px]">
            {/* Left: text + CTA + next trip */}
            <div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-sky-300">
                    {t("dashboard.hello", { name })}
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                    {t("dashboard.where")}
                  </h1>
                </div>
                <Link
                  to="/new-trip"
                  className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-bold text-sky-900 shadow-md transition hover:bg-sky-50 active:scale-[0.97] sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  {t("dashboard.newTrip")}
                </Link>
              </div>

              {upcoming && upcoming.start_date && (
                <div className="mt-6">
                  <NextTripHero trip={upcoming} locale={locale} />
                </div>
              )}
            </div>

            {/* Right: Globe */}
            <div className="mx-auto w-full max-w-[300px] lg:max-w-none">
              <Suspense
                fallback={
                  <div className="aspect-square w-full rounded-full bg-sky-100/50 animate-pulse" />
                }
              >
                {/* Solo los destinos reales del usuario: nunca los marcadores
                    de muestra del componente (eso es cosa de la landing). */}
                <GlobePolaroids markers={globeMarkers ?? []} className="w-full" speed={0.003} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trial Banner ── */}
      {trialDaysLeft !== null && (
        <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="font-semibold text-amber-800">
                {trialDaysLeft === 1
                  ? t("dashboard.trialLastDay")
                  : t("dashboard.trialDaysLeft", { count: trialDaysLeft })}
              </span>
              <span className="hidden text-amber-600 sm:inline">{t("dashboard.trialPerk")}</span>
            </div>
            <Link
              to="/pricing"
              className="flex h-11 shrink-0 items-center rounded-full bg-amber-500 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95"
            >
              {t("dashboard.trialKeep")}
            </Link>
          </div>
        </div>
      )}

      {/* ── Referral Banner ── */}
      {isFree && referralCount < 3 && (
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-[#EAF4FA] px-4 py-3.5">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E6B9A]/10">
                <Gift className="h-4 w-4 text-[#1E6B9A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-900">{t("dashboard.referral.title")}</p>
                <p className="text-xs text-sky-700">{t("dashboard.referral.subtitle")}</p>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <div className="flex flex-1 items-center gap-2 sm:w-40">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-sky-100">
                  <div
                    className="h-full rounded-full bg-[#1E6B9A] transition-all"
                    style={{ width: `${Math.min(100, (referralCount / 3) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-bold text-sky-800">
                  {t("dashboard.referral.progress", { count: referralCount })}
                </span>
              </div>
              <button
                type="button"
                onClick={copyReferralLink}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#1E6B9A] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#15577E] active:scale-95"
              >
                {referralCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {t("dashboard.referral.copyLink")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-12 lg:px-8">
        {/* Tab bar */}
        <div className="mt-6 flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-100 w-fit">
          {(["viajes", "calendario"] as const).map((tab) => {
            const Icon = tab === "viajes" ? MapPin : CalendarDays;
            const label = tab === "viajes" ? t("dashboard.savedTrips") : t("dashboard.calendarTab");
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-sky-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* My trips tab */}
        {activeTab === "viajes" && (
          <>
            <section className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {t("dashboard.savedTrips")}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Toggle panel de salidas / tarjetas */}
                  {trips && trips.length > 0 && (
                    <div className="flex rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-100">
                      {(["board", "cards"] as const).map((v) => {
                        const Icon = v === "board" ? Plane : LayoutGrid;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setTripsView(v)}
                            aria-pressed={tripsView === v}
                            className={`flex h-11 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition ${
                              tripsView === v
                                ? "bg-sky-900 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <Icon className={`h-3 w-3 ${v === "board" ? "-rotate-45" : ""}`} />
                            {v === "board"
                              ? t("airport.board.viewBoard")
                              : t("airport.board.viewCards")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {trips && trips.length > 0 && (
                    <Link
                      to="/new-trip"
                      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#1E6B9A]/10 px-3.5 text-xs font-semibold text-[#1E6B9A] transition hover:bg-[#1E6B9A]/15"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("dashboard.newTrip")}
                    </Link>
                  )}
                </div>
              </div>

              {trips === null && (
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
                    >
                      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {trips?.length === 0 && (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-50 ring-1 ring-sky-100">
                    <MapPin className="h-6 w-6 text-sky-500" />
                  </div>
                  <p className="mt-4 font-semibold text-slate-800">{t("dashboard.empty")}</p>
                  <Link
                    to="/new-trip"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#15577E] active:scale-[0.97]"
                  >
                    <Plus className="h-4 w-4" />
                    {t("dashboard.newTrip")}
                  </Link>
                </div>
              )}

              {/* Panel de salidas estilo aeropuerto: todos los viajes como
                  filas de un tablón con letras que giran al cargar. */}
              {tripsView === "board" && trips && trips.length > 0 && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="mt-5"
                >
                  <DepartureBoard trips={trips} />
                </motion.div>
              )}

              {tripsView === "cards" && otherTrips.length > 0 && (
                <div
                  className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                  style={{ perspective: 1100 }}
                >
                  {otherTrips.map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      style={tiltOn ? { rotateX: cardTilt as MotionValue<number> } : undefined}
                      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.23, 1, 0.32, 1],
                        delay: Math.min(i * 0.055, 0.5),
                      }}
                    >
                      <TripCard
                        trip={trip}
                        locale={locale}
                        onShare={() => setShareTrip(trip)}
                        onDelete={() => deleteTrip(trip.id)}
                        isFree={isFree}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Saved inspirations */}
            {saved && saved.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
                  <Bookmark className="h-4.5 w-4.5 text-[#1E6B9A]" />
                  {t("dashboard.saved")}
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {saved.map((s) => (
                    <div
                      key={s.id}
                      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Link to="/trip/$slug" params={{ slug: s.slug }} className="block">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <SmartImage
                            src={s.hero_image_url}
                            fallbackSrc={destinationFallback(s.destination)}
                            gradientClassName="bg-gradient-to-br from-sky-300 to-sky-600"
                            alt={s.destination}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 text-white">
                            <div className="font-display text-base font-bold drop-shadow">
                              {s.destination}
                            </div>
                            {s.n_days && (
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                                <Calendar className="h-2.5 w-2.5" />
                                {t("dashboard.nDays", { count: s.n_days })}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => remixSaved(s)}
                          className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-sky-900 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-sky-800 active:scale-95"
                        >
                          <Wand2 className="h-3 w-3" />
                          {t("dashboard.savedRemix")}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSaved(s.id)}
                          aria-label={t("dashboard.savedRemove")}
                          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Seasonal inspiration */}
            <section className="mt-10">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {t("dashboard.inspirationTitle")}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{t("dashboard.inspirationSub")}</p>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {inspirations.map((insp) => (
                  <div
                    key={insp.destination}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={insp.image}
                        alt={insp.destination}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                        {insp.tag}
                      </span>
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="font-display text-sm font-bold drop-shadow">
                          {insp.destination}
                        </div>
                        <div className="text-[11px] opacity-80">{insp.country}</div>
                      </div>
                    </div>
                    <div className="p-3">
                      <button
                        type="button"
                        onClick={() => planInspiration(insp)}
                        className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-sky-900 px-3 text-xs font-bold text-white transition hover:bg-sky-800 active:scale-95"
                      >
                        <Sparkles className="h-3 w-3" />
                        {t("dashboard.plan")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Calendar tab */}
        {activeTab === "calendario" && (
          <section className="mt-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {t("dashboard.calendarTitle")}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{t("dashboard.calendarSub")}</p>
            </div>
            <div className="max-w-lg">
              <Suspense fallback={<div className="h-72 rounded-2xl bg-sky-50 animate-pulse" />}>
                <TripsCalendar trips={calendarTrips} />
              </Suspense>
            </div>
            {calendarTrips.length === 0 && trips !== null && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">{t("dashboard.calendarEmpty")}</p>
                <Link
                  to="/new-trip"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#15577E]"
                >
                  <Plus className="h-4 w-4" />
                  {t("dashboard.newTrip")}
                </Link>
              </div>
            )}
          </section>
        )}
      </div>

      {shareTrip && (
        <ShareDialog
          open
          onClose={() => setShareTrip(null)}
          tripId={shareTrip.id}
          destination={shareTrip.destination}
        />
      )}
    </PageTransition>
  );
}

/* ─── Trip Card ─── */

function TripCard({
  trip,
  locale,
  onShare,
  onDelete,
  isFree,
}: {
  trip: Trip;
  locale: Locale;
  onShare: () => void;
  onDelete: () => void;
  isFree: boolean;
}) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPast = trip.end_date
    ? new Date(trip.end_date) < new Date(new Date().toDateString())
    : false;
  const isUpcoming =
    trip.start_date && new Date(trip.start_date) >= new Date(new Date().toDateString());
  const days =
    trip.start_date && trip.end_date
      ? differenceInCalendarDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
      : null;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to="/my-trip/$tripId" params={{ tripId: trip.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <SmartImage
            src={trip.hero_image_url}
            fallbackSrc={destinationFallback(trip.destination)}
            alt={trip.destination}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

          <div className="absolute right-3 top-3">
            {trip.status !== "ready" && (
              <span className="rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 backdrop-blur-sm">
                {t("dashboard.generating")}
              </span>
            )}
            {isUpcoming && trip.status === "ready" && (
              <span className="rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 backdrop-blur-sm">
                {t("dashboard.upcoming")}
              </span>
            )}
            {isPast && (
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 backdrop-blur-sm">
                {t("dashboard.past")}
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-display text-base font-bold leading-tight drop-shadow">
              {trip.destination}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/80">
              <Calendar className="h-2.5 w-2.5" />
              <span>
                {trip.start_date && trip.end_date
                  ? `${format(parseISO(trip.start_date), "d MMM", { locale })} – ${format(parseISO(trip.end_date), "d MMM", { locale })}`
                  : t("dashboard.flexible")}
              </span>
              {days != null && <span className="text-white/60">· {days}d</span>}
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <Link
          to="/my-trip/$tripId"
          params={{ tripId: trip.id }}
          className="inline-flex h-11 items-center gap-1 rounded-full bg-slate-100 px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
        >
          <Eye className="h-3 w-3" />
          {t("dashboard.view")}
        </Link>
        <div className="flex items-center gap-0.5">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1">
              <span className="text-[11px] text-red-600">{t("dashboard.deleteTripConfirm")}</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
                className="flex h-11 items-center px-2 text-[11px] font-bold text-red-600 hover:text-red-700"
              >
                {t("dashboard.deleteTripYes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex h-11 items-center px-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              {isFree ? (
                <Link
                  to="/pricing"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100"
                  aria-label={t("sidebar.assistantLocked")}
                >
                  <Lock className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  to="/assistant"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-sky-700"
                  aria-label={t("dashboard.editAi")}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                </Link>
              )}
              <button
                type="button"
                onClick={onShare}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-sky-700"
                aria-label={t("dashboard.share")}
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                aria-label={t("dashboard.deleteTrip")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Next Trip Hero ─── */

function NextTripHero({ trip, locale }: { trip: Trip; locale: Locale }) {
  const { t } = useTranslation();
  const [days, setDays] = useState(() =>
    Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())),
  );
  const [displayed, setDisplayed] = useState(0);
  const [weather, setWeather] = useState<{ tempC: number; code: number } | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setDays(Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())));
  }, [trip.start_date]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const to = days;
    const tick = (ts: number) => {
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [days]);

  useEffect(() => {
    let cancelled = false;
    fetchWeather(trip.destination).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => {
      cancelled = true;
    };
  }, [trip.destination]);

  const isEs = locale === es;
  const fmt = isEs ? "d 'de' MMMM" : "MMM d";

  return (
    <Link to="/my-trip/$tripId" params={{ tripId: trip.id }}>
      <div className="group overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/15">
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="relative h-44 overflow-hidden md:h-56 md:rounded-l-2xl">
            <SmartImage
              src={trip.hero_image_url}
              fallbackSrc={destinationFallback(trip.destination, 1200, 700)}
              gradientClassName="bg-gradient-to-br from-sky-600 to-sky-800"
              alt={trip.destination}
              loading="eager"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:bg-gradient-to-r" />
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                {t("dashboard.nextTrip")}
              </p>
              <h3 className="font-display text-xl font-bold drop-shadow md:text-2xl">
                {trip.destination}
              </h3>
              {trip.start_date && trip.end_date && (
                <p className="mt-0.5 text-xs text-white/85">
                  {format(parseISO(trip.start_date), fmt, { locale })} –{" "}
                  {format(parseISO(trip.end_date), fmt + " yyyy", { locale })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 p-5 md:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300">
                {t("dashboard.countdown")}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tabular-nums text-white md:text-5xl">
                  {displayed}
                </span>
                <span className="text-sm font-medium text-white/60">
                  {days === 1 ? t("dashboard.day") : t("dashboard.days")}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300">
                {t("dashboard.weatherNow")}
              </p>
              {weather === undefined ? (
                <div className="mt-2 h-6 w-20 animate-pulse rounded bg-white/20" />
              ) : weather ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl">{weatherEmoji(weather.code)}</span>
                  <span className="font-display text-xl font-bold text-white">
                    {weather.tempC}°C
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm text-sky-300">—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

type Locale = typeof es;
