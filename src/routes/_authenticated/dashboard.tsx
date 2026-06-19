import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  Bookmark,
  Wand2,
  X,
  Eye,
  Share2,
  ArrowRight,
} from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardSidebar, MobileBottomBar } from "@/components/DashboardSidebar";
import { ShareDialog } from "@/components/trip/ShareDialog";
import {
  getSeasonalInspirations,
  fetchWeather,
  weatherEmoji,
  type Inspiration,
} from "@/lib/dashboard-helpers";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My trips – Itineraya" }] }),
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

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [saved, setSaved] = useState<SavedInspo[] | null>(null);
  const [name, setName] = useState<string>("");
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const meta = u.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      setName(meta?.full_name?.split(" ")[0] ?? meta?.name?.split(" ")[0] ?? t("dashboard.traveler"));

      if (u.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("welcome_completed")
          .eq("id", u.user.id)
          .maybeSingle();
        if (prof && !prof.welcome_completed) {
          navigate({ to: "/welcome", replace: true });
          return;
        }
      }

      const [{ data, error }, { data: savedData }] = await Promise.all([
        supabase
          .from("trips")
          .select("id,destination,start_date,end_date,hero_image_url,status,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_inspirations")
          .select("id,slug,destination,hero_image_url,summary,n_days")
          .order("created_at", { ascending: false }),
      ]);
      if (error) {
        toast.error(t("dashboard.loadFail"));
        setTrips([]);
      } else {
        setTrips(data ?? []);
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

  const removeSaved = async (id: string) => {
    const prev = saved ?? [];
    setSaved(prev.filter((x) => x.id !== id));
    const { error } = await supabase.from("saved_inspirations").delete().eq("id", id);
    if (error) {
      setSaved(prev);
      toast.error(t("dashboard.loadFail"));
    }
  };

  const upcoming = (trips ?? [])
    .filter((tr) => tr.start_date && new Date(tr.start_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1))[0];

  const otherTrips = (trips ?? []).filter((tr) => !upcoming || tr.id !== upcoming.id);

  const locale = dateLocale(i18n.language);
  const inspirations = useMemo(() => getSeasonalInspirations(), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />


      <div className="md:pl-60 pb-24 md:pb-12">
        <main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-10">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-semibold text-sky-600">{t("dashboard.hello", { name })}</p>
            <h1 className="font-display text-3xl font-bold text-slate-900 md:text-4xl">
              {t("dashboard.where")}
            </h1>
          </motion.div>

          {/* Hero next trip */}
          {upcoming && upcoming.start_date && (
            <NextTripHero trip={upcoming} locale={locale} />
          )}

          {/* New trip CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6"
          >
            <Link
              to="/new-trip"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-md">
                <Plus className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold text-slate-900">
                  {t("dashboard.newTrip")}
                </div>
                <div className="text-sm text-slate-500">{t("dashboard.newTripDesc")}</div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
            </Link>
          </motion.div>

          {/* My trips */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-slate-900">
              {t("dashboard.savedTrips")}
            </h2>

            {trips === null && (
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("dashboard.loading")}
              </div>
            )}

            {trips?.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-sm text-slate-500">{t("dashboard.empty")}</p>
              </div>
            )}

            {otherTrips.length > 0 && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {otherTrips.map((trip, i) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    locale={locale}
                    index={i}
                    onShare={() => setShareTrip(trip)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Saved inspirations */}
          {saved && saved.length > 0 && (
            <section className="mt-10">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                <Bookmark className="h-5 w-5 text-[#1E6B9A]" />
                {t("dashboard.saved")}
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map((s) => (
                  <div
                    key={s.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <Link to="/trip/$slug" params={{ slug: s.slug }} className="block">
                      <div className="relative h-40 w-full overflow-hidden">
                        {s.hero_image_url ? (
                          <img
                            src={s.hero_image_url}
                            alt={s.destination}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <div className="font-display text-lg font-bold drop-shadow">{s.destination}</div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between gap-2 px-3 py-3">
                      <button
                        type="button"
                        onClick={() => remixSaved(s)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-3 py-2 text-xs font-bold text-white shadow-sm"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        {t("dashboard.savedRemix")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSaved(s.id)}
                        aria-label={t("dashboard.savedRemove")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {t("dashboard.inspirationTitle")}
                </h2>
                <p className="text-sm text-slate-500">{t("dashboard.inspirationSub")}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {inspirations.map((insp, i) => (
                <motion.div
                  key={insp.destination}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={insp.image}
                      alt={insp.destination}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                      {insp.tag}
                    </span>
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="font-display text-lg font-bold drop-shadow">{insp.destination}</div>
                      <div className="text-xs opacity-90">{insp.country}</div>
                    </div>
                  </div>
                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => planInspiration(insp)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("dashboard.plan")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {shareTrip && (
        <ShareDialog
          open
          onClose={() => setShareTrip(null)}
          tripId={shareTrip.id}
          destination={shareTrip.destination}
        />
      )}
    </div>
  );
}

function TripCard({
  trip,
  locale,
  index,
  onShare,
}: {
  trip: Trip;
  locale: Locale;
  index: number;
  onShare: () => void;
}) {
  const { t } = useTranslation();
  const isPast = trip.end_date ? new Date(trip.end_date) < new Date(new Date().toDateString()) : false;
  const isUpcoming = trip.start_date && new Date(trip.start_date) >= new Date(new Date().toDateString());
  const days =
    trip.start_date && trip.end_date
      ? differenceInCalendarDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <Link to="/trip/$tripId" params={{ tripId: trip.id }} className="block">
        <div className="relative h-44 w-full overflow-hidden">
          {trip.hero_image_url ? (
            <img
              src={trip.hero_image_url}
              alt={trip.destination}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute right-3 top-3 flex gap-1.5">
            {trip.status !== "ready" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                {t("dashboard.generating")}
              </span>
            )}
            {isUpcoming && trip.status === "ready" && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {t("dashboard.upcoming")}
              </span>
            )}
            {isPast && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                {t("dashboard.past")}
              </span>
            )}
          </div>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{trip.destination}</span>
            </div>
            <div className="font-display text-lg font-bold drop-shadow">{trip.destination}</div>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {trip.start_date && trip.end_date
              ? `${format(parseISO(trip.start_date), "d MMM", { locale })} – ${format(parseISO(trip.end_date), "d MMM", { locale })}`
              : t("dashboard.flexible")}
          </span>
          {days != null && (
            <span className="ml-1 text-slate-400">· {days}d</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <Link
            to="/trip/$tripId"
            params={{ tripId: trip.id }}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-700"
            aria-label={t("dashboard.view")}
            title={t("dashboard.view")}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to="/assistant"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-700"
            aria-label={t("dashboard.editAi")}
            title={t("dashboard.editAi")}
          >
            <Wand2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-sky-700"
            aria-label={t("dashboard.share")}
            title={t("dashboard.share")}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NextTripHero({ trip, locale }: { trip: Trip; locale: Locale }) {
  const { t } = useTranslation();
  const [days, setDays] = useState(() =>
    Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())),
  );
  const [displayed, setDisplayed] = useState(0);
  const [weather, setWeather] = useState<{ tempC: number; code: number } | null>(null);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <Link to="/trip/$tripId" params={{ tripId: trip.id }} className="block">
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="relative h-56 md:h-72">
            {trip.hero_image_url ? (
              <img
                src={trip.hero_image_url}
                alt={trip.destination}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent md:bg-gradient-to-r" />
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-90">
                {t("dashboard.nextTrip")}
              </p>
              <h3 className="font-display text-2xl font-bold drop-shadow md:text-3xl">
                {trip.destination}
              </h3>
              {trip.start_date && trip.end_date && (
                <p className="mt-1 text-sm opacity-95">
                  {format(parseISO(trip.start_date), fmt, { locale })} –{" "}
                  {format(parseISO(trip.end_date), fmt + " yyyy", { locale })}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 p-5 md:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1E6B9A]">
                {t("dashboard.countdown")}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold tabular-nums text-slate-900 md:text-6xl">
                  {displayed}
                </span>
                <span className="text-base font-semibold text-slate-500">
                  {days === 1 ? t("dashboard.day") : t("dashboard.days")}
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {t("dashboard.weatherNow")}
              </p>
              {weather ? (
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-3xl">{weatherEmoji(weather.code)}</span>
                  <span className="font-display text-2xl font-bold text-slate-900">
                    {weather.tempC}°C
                  </span>
                </div>
              ) : (
                <div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-200" />
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

type Locale = typeof es;
