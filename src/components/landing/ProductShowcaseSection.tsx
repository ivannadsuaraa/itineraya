import { Link } from "@tanstack/react-router";
import {
  Map as MapIcon,
  Clock,
  Download,
  Compass,
  Sparkles,
  ArrowRight,
  Star,
  Eye,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// Sustituye al grid genérico de iconos (FeaturesSection): en vez de contar lo
// que hace la app, la enseña. Cuatro mockups construidos en CSS de lo que un
// chat de IA nunca puede dar: mapa del recorrido, agenda con horarios,
// postales descargables y el feed de viajes de la comunidad con Remix.
export function ProductShowcaseSection() {
  const { t } = useTranslation();

  return (
    <section id="product" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" amount={0.5}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              {t("showcase.kicker")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
              {t("showcase.title")}
            </h2>
            <p className="mt-4 text-lg text-sky-600">{t("showcase.subtitle")}</p>
          </div>
        </ScrollReveal>

        {/* Cada bloque entra desde su lado del grid: izquierda/derecha alternos */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <ScrollReveal direction="left" amount={0.25}>
            <MapBlock />
          </ScrollReveal>
          <ScrollReveal direction="right" amount={0.25} delay={0.08}>
            <ScheduleBlock />
          </ScrollReveal>
          <ScrollReveal direction="left" amount={0.25}>
            <PostcardBlock />
          </ScrollReveal>
          <ScrollReveal direction="right" amount={0.25} delay={0.08}>
            <FeedBlock />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function BlockShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group overflow-hidden rounded-3xl bg-sky-50/60 ring-1 ring-sky-100 transition-all hover:shadow-xl hover:shadow-sky-900/8">
      <div className="p-6 pb-0 sm:p-8 sm:pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-900 text-white">
            {icon}
          </div>
          <h3 className="font-display text-xl font-bold text-sky-900">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-sky-700/80 sm:text-base">{description}</p>
      </div>
      <div className="mt-6 px-6 sm:px-8">{children}</div>
    </div>
  );
}

/* ── 1. Mapa del recorrido ── */
function MapBlock() {
  const { t } = useTranslation();
  const stops = [
    { x: "10%", y: "70%", n: 1 },
    { x: "34%", y: "42%", n: 2 },
    { x: "58%", y: "58%", n: 3 },
    { x: "82%", y: "24%", n: 4 },
  ];
  return (
    <BlockShell
      icon={<MapIcon className="h-5 w-5" />}
      title={t("showcase.mapTitle")}
      description={t("showcase.mapDesc")}
    >
      <div className="relative h-56 overflow-hidden rounded-t-2xl bg-[#EAF4FB] ring-1 ring-sky-100 sm:h-64">
        {/* Calles */}
        <svg
          viewBox="0 0 400 240"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60 H400 M0 130 H400 M0 200 H400 M70 0 V240 M170 0 V240 M290 0 V240"
            stroke="#C9E4F5"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0 95 H400 M230 0 V240 M350 0 V240"
            stroke="#D9EDF9"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Ruta del día */}
          <path
            d="M40 168 Q 100 130 136 100 T 232 140 T 328 58"
            stroke="#1E6B9A"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        {stops.map((p) => (
          <span
            key={p.n}
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sky-900 text-[11px] font-bold text-white ring-[3px] ring-white shadow-lg"
            style={{ left: p.x, top: p.y }}
          >
            {p.n}
          </span>
        ))}
        {/* Etiqueta de parada */}
        <div className="absolute left-[34%] top-[42%] ml-5 -mt-3 rounded-lg bg-white px-2.5 py-1.5 shadow-md ring-1 ring-slate-100">
          <p className="text-[10px] font-bold text-slate-800">Trattoria da Enzo</p>
          <p className="text-[9px] text-slate-400">🚶 8 min</p>
        </div>
      </div>
    </BlockShell>
  );
}

/* ── 2. Agenda con horarios ── */
function ScheduleBlock() {
  const { t } = useTranslation();
  const rows = [
    { time: "09:30", emoji: "🏛️", label: "Colosseo", sub: null },
    { time: "12:00", emoji: "⛲", label: "Fontana di Trevi", sub: "🚶 15 min" },
    { time: "14:00", emoji: "🍝", label: "Trattoria da Enzo", sub: "🚇 12 min" },
    { time: "17:30", emoji: "🌅", label: "Gianicolo", sub: "🚶 20 min" },
  ];
  return (
    <BlockShell
      icon={<Clock className="h-5 w-5" />}
      title={t("showcase.scheduleTitle")}
      description={t("showcase.scheduleDesc")}
    >
      <div className="rounded-t-2xl bg-white p-4 ring-1 ring-sky-100">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-700 to-purple-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            {t("showcase.scheduleDayLabel")}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">Roma · Trastevere</span>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-sky-900 text-white">
                <span className="text-[11px] font-bold leading-none">{r.time}</span>
              </div>
              <span className="text-base">{r.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">{r.label}</p>
                {r.sub && <p className="text-[10px] text-slate-400">{r.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlockShell>
  );
}

/* ── 3. Postales descargables ── */
function PostcardBlock() {
  const { t } = useTranslation();
  return (
    <BlockShell
      icon={<Download className="h-5 w-5" />}
      title={t("showcase.postcardTitle")}
      description={t("showcase.postcardDesc")}
    >
      <div className="relative h-56 sm:h-64">
        {/* Postal trasera */}
        <div className="absolute left-1/2 top-4 w-56 -translate-x-[62%] -rotate-6 overflow-hidden rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200 sm:w-64">
          <img
            src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=70"
            alt=""
            aria-hidden
            className="h-28 w-full rounded-lg object-cover sm:h-32"
            loading="lazy"
          />
          <p className="px-1 pt-2 text-[10px] font-bold text-slate-800">
            París · {t("showcase.postcardDay", { n: 2 })}
          </p>
          <p className="px-1 pb-1 text-[9px] text-slate-400">Montmartre & Sacré-Cœur</p>
        </div>
        {/* Postal delantera */}
        <div className="absolute left-1/2 top-8 w-56 -translate-x-[38%] rotate-3 overflow-hidden rounded-xl bg-white p-2 shadow-2xl ring-1 ring-slate-200 sm:w-64">
          <img
            src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=500&q=70"
            alt=""
            aria-hidden
            className="h-28 w-full rounded-lg object-cover sm:h-32"
            loading="lazy"
          />
          <div className="flex items-center justify-between px-1 pt-2 pb-1">
            <div>
              <p className="text-[10px] font-bold text-slate-800">
                Venezia · {t("showcase.postcardDay", { n: 4 })}
              </p>
              <p className="text-[9px] text-slate-400">Canal Grande</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-900 px-2 py-1 text-[9px] font-bold text-white">
              <Download className="h-2.5 w-2.5" />
              PNG
            </span>
          </div>
        </div>
      </div>
    </BlockShell>
  );
}

/* ── 4. Feed de la comunidad + Remix ── */
function FeedBlock() {
  const { t } = useTranslation();
  const cards = [
    {
      img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=60",
      title: "Tokio · 6 días",
      rating: 5,
      views: 214,
    },
    {
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60",
      title: "Maldivas · 5 días",
      rating: 4,
      views: 156,
    },
  ];
  return (
    <BlockShell
      icon={<Compass className="h-5 w-5" />}
      title={t("showcase.feedTitle")}
      description={t("showcase.feedDesc")}
    >
      <div className="rounded-t-2xl bg-white p-4 ring-1 ring-sky-100">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <div key={i} className="overflow-hidden rounded-xl ring-1 ring-slate-100">
              <div className="relative h-20 sm:h-24">
                <img
                  src={c.img}
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <p className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white drop-shadow">
                  {c.title}
                </p>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${s < c.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                  <Eye className="h-2.5 w-2.5" />
                  {c.views}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2.5 ring-1 ring-sky-100">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-800">
            <Sparkles className="h-3.5 w-3.5 text-[#1E6B9A]" />
            {t("showcase.remixHint")}
          </p>
          <Link
            to="/explore"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-800"
          >
            {t("showcase.feedCta")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </BlockShell>
  );
}
