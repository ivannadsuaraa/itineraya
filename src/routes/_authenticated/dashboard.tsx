import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, LogOut, MapPin, Calendar, Sparkles, Loader2, ArrowLeft, Bookmark, Wand2, X } from "lucide-react";
import logoFull from "@/assets/itineraya-logo.png.asset.json";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

function dateLocale(lang: string) {
  return lang.toLowerCase().startsWith("en") ? enUS : es;
}

type SavedInspo = {
  id: string;
  slug: string;
  destination: string;
  hero_image_url: string | null;
  summary: string | null;
  n_days: number | null;
};

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [saved, setSaved] = useState<SavedInspo[] | null>(null);
  const [name, setName] = useState<string>("");

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
    const payload = {
      destination: s.destination,
      nDays: s.n_days ?? undefined,
    };
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
    .filter((t) => t.start_date && new Date(t.start_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1))[0];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const locale = dateLocale(i18n.language);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }}
        />
      </div>

      <header className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white sm:text-sm"
            aria-label={t("dashboard.back")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("dashboard.back")}</span>
          </Link>
          <Link to="/dashboard" className="inline-flex min-w-0 items-center transition hover:opacity-80">
            <img src={logoFull.url} alt="Itineraya" className="h-8 w-auto select-none sm:h-9" draggable={false} />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/assistant"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-sky-800 backdrop-blur-md hover:bg-white"
            aria-label={t("dashboard.assistant")}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("dashboard.assistant")}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-sky-800 backdrop-blur-md hover:bg-white"
            aria-label={t("dashboard.logout")}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("dashboard.logout")}</span>
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-semibold text-sky-600">{t("dashboard.hello", { name })}</p>
          <h1 className="font-display text-3xl font-bold text-sky-900 md:text-4xl">{t("dashboard.where")}</h1>
        </motion.div>

        {upcoming && upcoming.start_date && <Countdown trip={upcoming} locale={locale} />}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6"
        >
          <Link
            to="/new-trip"
            className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] p-6 shadow-2xl shadow-[#1E6B9A]/25 transition-transform hover:scale-[1.01]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-bold text-white md:text-2xl">
                {t("dashboard.newTrip")}
              </div>
              <div className="text-sm text-white/85">{t("dashboard.newTripDesc")}</div>
            </div>
            <Sparkles className="hidden h-8 w-8 text-white/70 sm:block" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          </Link>
        </motion.div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-sky-900">{t("dashboard.savedTrips")}</h2>

          {trips === null && (
            <div className="mt-6 flex items-center gap-2 text-sm text-sky-600">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("dashboard.loading")}
            </div>
          )}

          {trips?.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-sky-300 bg-white/50 p-8 text-center">
              <p className="text-sm text-sky-700">{t("dashboard.empty")}</p>
            </div>
          )}

          {trips && trips.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    to="/trip/$tripId"
                    params={{ tripId: trip.id }}
                    className="group block overflow-hidden rounded-3xl bg-white/85 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      {trip.hero_image_url ? (
                        <img
                          src={trip.hero_image_url}
                          alt={trip.destination}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {trip.status !== "ready" && (
                        <div className="absolute right-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          {t("dashboard.generating")}
                        </div>
                      )}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="flex items-center gap-1.5 text-xs opacity-90">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{trip.destination}</span>
                        </div>
                        <div className="font-display text-lg font-bold drop-shadow">{trip.destination}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-sky-700">
                      <Calendar className="h-3.5 w-3.5" />
                      {trip.start_date && trip.end_date
                        ? `${format(parseISO(trip.start_date), "d MMM", { locale })} – ${format(parseISO(trip.end_date), "d MMM yyyy", { locale })}`
                        : t("dashboard.flexible")}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Countdown({ trip, locale }: { trip: Trip; locale: Locale }) {
  const { t } = useTranslation();
  const [days, setDays] = useState(() =>
    Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())),
  );
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDays(Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())));
  }, [trip.start_date]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const from = 0;
    const to = days;
    const tick = (ts: number) => {
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [days]);

  const isEs = locale === es;
  const fmt = isEs ? "d 'de' MMMM yyyy" : "MMMM d, yyyy";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-6 overflow-hidden rounded-3xl bg-white/80 p-5 shadow-xl backdrop-blur-xl ring-1 ring-white/60 md:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1E6B9A]">
            {t("dashboard.nextTrip")}
          </p>
          <h3 className="mt-0.5 font-display text-xl font-bold text-sky-900 truncate md:text-2xl">
            {trip.destination}
          </h3>
          <p className="text-xs text-sky-600">
            {format(parseISO(trip.start_date!), fmt, { locale })}
          </p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tabular-nums text-[#1E6B9A] md:text-5xl">
            {displayed}
          </span>
          <span className="text-sm font-semibold text-sky-700">
            {days === 1 ? t("dashboard.day") : t("dashboard.days")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

type Locale = typeof es;
