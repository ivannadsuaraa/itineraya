import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plane, Plus, LogOut, MapPin, Calendar, Sparkles, Loader2 } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
};

function DashboardPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const meta = u.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      setName(meta?.full_name?.split(" ")[0] ?? meta?.name?.split(" ")[0] ?? "viajero");

      const { data, error } = await supabase
        .from("trips")
        .select("id,destination,start_date,end_date,hero_image_url,status,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("No pudimos cargar tus viajes");
        setTrips([]);
        return;
      }
      setTrips(data ?? []);
    })();
  }, []);

  const upcoming = (trips ?? [])
    .filter((t) => t.start_date && new Date(t.start_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1))[0];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

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

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 text-sky-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E6B9A] shadow-md shadow-[#1E6B9A]/30">
            <Plane className="h-4 w-4 -rotate-45 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Itineraya</span>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-sky-800 backdrop-blur-md hover:bg-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </header>

      <main className="relative mx-auto max-w-5xl px-5">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-semibold text-sky-600">Hola, {name} 👋</p>
          <h1 className="font-display text-3xl font-bold text-sky-900 md:text-4xl">
            ¿A dónde vamos hoy?
          </h1>
        </motion.div>

        {/* Countdown */}
        {upcoming && upcoming.start_date && <Countdown trip={upcoming} />}

        {/* Create new trip CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6"
        >
          <Link
            to="/onboarding"
            className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] p-6 shadow-2xl shadow-[#1E6B9A]/25 transition-transform hover:scale-[1.01]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-bold text-white md:text-2xl">
                Crear nuevo viaje
              </div>
              <div className="text-sm text-white/85">
                Cuéntanos a dónde y nuestra IA hará el resto
              </div>
            </div>
            <Sparkles className="hidden h-8 w-8 text-white/70 sm:block" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          </Link>
        </motion.div>

        {/* Saved trips */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-sky-900">Tus viajes guardados</h2>

          {trips === null && (
            <div className="mt-6 flex items-center gap-2 text-sm text-sky-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          )}

          {trips?.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-sky-300 bg-white/50 p-8 text-center">
              <p className="text-sm text-sky-700">
                Aún no tienes viajes. ¡Crea el primero y empieza la aventura!
              </p>
            </div>
          )}

          {trips && trips.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    to="/trip/$tripId"
                    params={{ tripId: t.id }}
                    className="group block overflow-hidden rounded-3xl bg-white/85 shadow-lg ring-1 ring-white/60 backdrop-blur-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      {t.hero_image_url ? (
                        <img
                          src={t.hero_image_url}
                          alt={t.destination}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {t.status !== "ready" && (
                        <div className="absolute right-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          Generando…
                        </div>
                      )}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="flex items-center gap-1.5 text-xs opacity-90">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{t.destination}</span>
                        </div>
                        <div className="font-display text-lg font-bold drop-shadow">{t.destination}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-sky-700">
                      <Calendar className="h-3.5 w-3.5" />
                      {t.start_date && t.end_date
                        ? `${format(parseISO(t.start_date), "d MMM", { locale: es })} – ${format(parseISO(t.end_date), "d MMM yyyy", { locale: es })}`
                        : "Fechas flexibles"}
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

function Countdown({ trip }: { trip: Trip }) {
  const [days, setDays] = useState(() =>
    Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())),
  );
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    setDays(Math.max(0, differenceInCalendarDays(parseISO(trip.start_date!), new Date())));
  }, [trip.start_date]);

  // Animated counter
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const from = 0;
    const to = days;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [days]);

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
            Próximo viaje
          </p>
          <h3 className="mt-0.5 font-display text-xl font-bold text-sky-900 truncate md:text-2xl">
            {trip.destination}
          </h3>
          <p className="text-xs text-sky-600">
            {format(parseISO(trip.start_date!), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tabular-nums text-[#1E6B9A] md:text-5xl">
            {displayed}
          </span>
          <span className="text-sm font-semibold text-sky-700">
            {days === 1 ? "día" : "días"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
