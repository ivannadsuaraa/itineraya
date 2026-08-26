import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import {
  Plus,
  MapPin,
  Calendar,
  Bookmark,
  Wand2,
  X,
  Eye,
  Share2,
  ArrowRight,
  Lock,
  Trash2,
  Zap,
} from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShareDialog } from "@/components/trip/ShareDialog";
import { fetchWeather, weatherEmoji } from "@/lib/dashboard-helpers";
import { geocodeAndPersistTrip } from "@/lib/geocode";
import { readDemoTrip, clearDemoTrip } from "@/lib/demo-trip";
import { SmartImage, destinationFallback } from "@/components/ui/SmartImage";
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
  const reduceMotion = useReducedMotion();

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
        .select("welcome_completed, plan, trial_ends_at")
        .eq("id", u.user.id)
        .maybeSingle();
      const prof = profRaw as unknown as {
        welcome_completed?: boolean;
        plan?: string;
        trial_ends_at?: string | null;
      } | null;
      const userPlan = prof?.plan ?? "free";
      const trialEndsAt = prof?.trial_ends_at ?? null;
      setIsFree(userPlan === "free");
      if (userPlan === "free" && trialEndsAt) {
        const msLeft = new Date(trialEndsAt).getTime() - Date.now();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) setTrialDaysLeft(daysLeft);
      }
      // Reclamar el viaje demo generado sin cuenta (/demo): se inserta ya
      // "ready" (el itinerario viene generado) y se lleva al usuario directo
      // a su viaje — el momento de activación más fuerte posible.
      const demoTrip = readDemoTrip();
      let claimedTripId: string | null = null;
      if (demoTrip) {
        const { data: claimed, error: claimErr } = await supabase
          .from("trips")
          .insert({
            user_id: u.user.id,
            destination: demoTrip.destination,
            companion: demoTrip.companion,
            trip_types: demoTrip.tripTypes,
            itinerary: demoTrip.itinerary,
            hero_image_url: demoTrip.hero_image_url,
            status: "ready",
          } as never)
          .select("id")
          .single();
        if (!claimErr && claimed) {
          clearDemoTrip();
          claimedTripId = (claimed as { id: string }).id;
          void geocodeAndPersistTrip(claimedTripId, demoTrip.destination);
          toast.success(t("demo.claimedToast", { destination: demoTrip.destination }));
        } else if (claimErr) {
          // No se borra la demo: se reintentará en la próxima visita.
          console.error("[dashboard] demo trip claim failed", claimErr);
        }
      }

      // El viaje reclamado gana a /welcome: quien acaba de registrarse desde
      // la demo (welcome_completed aún false) debe aterrizar en SU viaje sin
      // desvíos — el cuestionario de bienvenida puede esperar a la próxima
      // visita al dashboard.
      if (claimedTripId) {
        navigate({ to: "/my-trip/$tripId", params: { tripId: claimedTripId } });
        return;
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

  return (
    <PageTransition className="min-h-dvh bg-slate-50">
      {/* Cabecera: saludo + el único CTA que importa, y el próximo viaje. */}
      <section className="bg-slate-50 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="flex min-h-[180px] flex-col justify-between rounded-3xl bg-[#0c1a2e] p-6 sm:p-8">
              <div>
                <p className="text-sm font-semibold text-[#38bdf8]">
                  {t("dashboard.hello", { name })}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {t("dashboard.where")}
                </h1>
              </div>
              <Link
                to="/new-trip"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#38bdf8] px-5 py-3 text-sm font-bold text-[#0c1a2e] transition hover:bg-[#5cc7f9] active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                {t("dashboard.newTrip")}
              </Link>
            </div>

            <div>
              {upcoming && upcoming.start_date ? (
                <NextTripHero trip={upcoming} locale={locale} />
              ) : (
                <Link
                  to="/new-trip"
                  className="flex h-full min-h-[148px] flex-col justify-center rounded-3xl bg-[#0c1a2e] p-6 ring-1 ring-white/10 transition hover:ring-white/25"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#38bdf8]">
                    {t("dashboard.planNextLabel")}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {t("dashboard.planNextTitle")}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#38bdf8]">
                    {t("dashboard.newTrip")}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              )}
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

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-12 lg:px-8">
        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t("dashboard.savedTrips")}
            </h2>
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

          {trips === null && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
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

          {otherTrips.length > 0 && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {otherTrips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
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
                  className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
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
    <article className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
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
      <div className="group h-full overflow-hidden rounded-3xl bg-[#0c1a2e] ring-1 ring-white/10 transition hover:ring-white/25">
        <div className="grid h-full md:grid-cols-[1.4fr_1fr]">
          <div className="relative h-44 overflow-hidden md:h-full md:min-h-[176px] md:rounded-l-3xl">
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#38bdf8]">
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#38bdf8]">
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
                <p className="mt-1 text-sm text-[#38bdf8]">—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

type Locale = typeof es;
