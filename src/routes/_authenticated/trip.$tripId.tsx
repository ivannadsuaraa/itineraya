import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  LayoutGrid,
  Loader2,
  Plane,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Wand2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/itinerary.functions";
import { AssistantEditPanel } from "@/components/AssistantEditPanel";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trip/$tripId")({
  head: () => ({ meta: [{ title: "Tu itinerario – Itineraya" }] }),
  component: TripPage,
});

type Activity = { time: string; title: string; description: string };
type Day = {
  day: number;
  title: string;
  subtitle?: string;
  image_url?: string | null;
  image_query?: string;
  activities: Activity[];
};
type Itinerary = { summary?: string; days: Day[] };

const LOADING_MESSAGES = [
  "Preparando tu aventura…",
  "Buscando los mejores planes…",
  "Eligiendo rincones especiales…",
  "Casi listo…",
];

function TripPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const generate = useServerFn(generateItinerary);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<{
    id: string;
    destination: string;
    hero_image_url: string | null;
    itinerary: Itinerary | null;
    status: string;
  } | null>(null);
  const [view, setView] = useState<"cards" | "text">("cards");
  const [msgIdx, setMsgIdx] = useState(0);
  const [plan, setPlan] = useState<"free" | "viajero" | "explorador" | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Load plan
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

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

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
        if (!data) throw new Error("Viaje no encontrado");

        if (data.status === "ready" && data.itinerary) {
          if (!cancelled) {
            setTrip({ ...data, itinerary: data.itinerary as unknown as Itinerary });
            setLoading(false);
          }
          return;
        }

        const result = await generate({ data: { tripId } });
        if (cancelled) return;
        setTrip({
          id: tripId,
          destination: data.destination,
          hero_image_url: result.hero_image_url ?? null,
          itinerary: result.itinerary as unknown as Itinerary,
          status: "ready",
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Algo salió mal");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, generate]);

  if (loading) return <LoadingScreen msg={LOADING_MESSAGES[msgIdx]} />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <h1 className="font-display text-xl font-bold text-sky-900">No pudimos crear tu itinerario</h1>
          <p className="mt-2 text-sm text-sky-700">{error}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Volver
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
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-sky-100/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-sky-50 p-1">
              <button
                onClick={() => setView("cards")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  view === "cards" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Tarjetas
              </button>
              <button
                onClick={() => setView("text")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  view === "text" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Texto
              </button>
            </div>
            {plan && plan !== "free" ? (
              <button
                onClick={() => setAssistantOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-[#1E6B9A]/25 transition hover:shadow-lg"
              >
                <Wand2 className="h-3.5 w-3.5" /> Editar con asistente
              </button>
            ) : plan === "free" ? (
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-white"
                title="Disponible en planes Viajero y Explorador"
              >
                <Wand2 className="h-3.5 w-3.5" /> Editar con asistente
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden md:h-80">
        {trip.hero_image_url ? (
          <img src={trip.hero_image_url} alt={trip.destination} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="mx-auto max-w-4xl text-white">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Tu itinerario</p>
            <h1 className="mt-1 font-display text-3xl font-bold drop-shadow-md md:text-4xl">{trip.destination}</h1>
            {itin.summary && <p className="mt-2 max-w-2xl text-sm opacity-90 md:text-base">{itin.summary}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <AnimatePresence mode="wait">
          {view === "cards" ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {itin.days.map((day) => (
                <DayCard key={day.day} day={day} destination={trip.destination} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-xl md:p-8"
            >
              {itin.days.map((day) => (
                <div key={day.day} className="mb-6 last:mb-0">
                  <h2 className="font-display text-lg font-bold text-sky-900">
                    Día {day.day}: {day.title}
                  </h2>
                  {day.subtitle && <p className="text-sm text-sky-600">{day.subtitle}</p>}
                  <ul className="mt-3 space-y-2">
                    {day.activities.map((a, i) => (
                      <li key={i} className="text-sm text-sky-900">
                        <span className="font-semibold text-[#1E6B9A]">{a.time}:</span>{" "}
                        <span className="font-semibold">{a.title}.</span>{" "}
                        <span className="text-sky-700">{a.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function timeIcon(time: string) {
  const t = time.toLowerCase();
  if (t.includes("noche")) return <Moon className="h-3.5 w-3.5" />;
  if (t.includes("tarde")) return <Sunset className="h-3.5 w-3.5" />;
  return <Sun className="h-3.5 w-3.5" />;
}

function DayCard({ day, destination }: { day: Day; destination: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "download" | "share">(null);

  const download = async () => {
    if (!cardRef.current) return;
    setBusy("download");
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${destination.replace(/\s+/g, "-").toLowerCase()}-dia-${day.day}.png`;
      a.click();
      toast.success("Imagen descargada ✨");
    } catch {
      toast.error("No se pudo generar la imagen");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    if (!cardRef.current) return;
    setBusy("share");
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `dia-${day.day}.png`, { type: "image/png" });
      const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (navAny.canShare && navAny.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Día ${day.day} en ${destination}`,
          text: `${day.title} – mi viaje a ${destination} con Itineraya`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Día ${day.day} en ${destination}`,
          text: `${day.title} – ${day.activities.map((a) => `${a.time}: ${a.title}`).join(" • ")}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Enlace copiado");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") toast.error("No se pudo compartir");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-white/85 shadow-xl backdrop-blur-xl ring-1 ring-white/60">
      <div ref={cardRef} className="bg-white">
        {day.image_url && (
          <div className="relative h-48 w-full overflow-hidden md:h-56">
            <img src={day.image_url} alt={day.title} className="h-full w-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <span className="inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                Día {day.day}
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold drop-shadow">{day.title}</h3>
              {day.subtitle && <p className="text-sm opacity-90">{day.subtitle}</p>}
            </div>
          </div>
        )}
        {!day.image_url && (
          <div className="p-6 pb-2">
            <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E6B9A]">
              Día {day.day}
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold text-sky-900">{day.title}</h3>
            {day.subtitle && <p className="text-sm text-sky-600">{day.subtitle}</p>}
          </div>
        )}

        <div className="space-y-3 p-5 md:p-6">
          {day.activities.map((a, i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/40 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E6B9A] text-white">
                {timeIcon(a.time)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#1E6B9A]">
                  {a.time}
                </div>
                <div className="font-semibold text-sky-900">{a.title}</div>
                <div className="mt-0.5 text-sm text-sky-700">{a.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-sky-100 px-5 py-3 text-xs text-sky-500">
          <span className="flex items-center gap-1.5 font-semibold">
            <Plane className="h-3.5 w-3.5 -rotate-45" /> Itineraya
          </span>
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
          Descargar
        </button>
        <button
          onClick={share}
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#15577E] disabled:opacity-60"
        >
          {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Compartir
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ msg }: { msg: string }) {
  const dots = useMemo(() => Array.from({ length: 12 }), []);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6">
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
              <Plane className="h-6 w-6 -rotate-45 text-white" />
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
        <p className="mt-2 max-w-xs text-sm text-sky-600">
          Nuestra IA está diseñando un itinerario único para ti
        </p>
      </div>
    </div>
  );
}
