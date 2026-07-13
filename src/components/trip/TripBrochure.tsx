// Folleto del viaje completo: póster SVG en formato A4 vertical con skyline
// del destino (silueta generada determinista), ruta esquemática con flechas,
// resumen de cada día en una línea con su icono y estadísticas visuales.
// Descargable como PNG (html-to-image), misma familia oscura que las postales.

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { ICON_PATHS, matchIcon, type IconId } from "@/lib/postcard";

type Activity = {
  time: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
};

type Day = {
  day: number;
  title: string;
  activities: Activity[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  destination: string;
  days: Day[];
  startDate?: string | null;
  endDate?: string | null;
};

const NAVY_DARK = "#050b16";
const NAVY = "#0b1a2e";
const SKY = "#38bdf8";
const SKY_SOFT = "#7dd3fc";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Skyline determinista: cada destino genera su propia silueta de edificios
// (alturas, anchuras, antenas y ventanas sembradas por el nombre).
function buildSkyline(destination: string): {
  path: string;
  windows: Array<{ x: number; y: number }>;
} {
  const rand = mulberry32(hashString(`skyline:${destination.toLowerCase()}`));
  const baseY = 250;
  let x = -10;
  let d = `M -10 ${baseY}`;
  const windows: Array<{ x: number; y: number }> = [];
  while (x < 910) {
    const w = 34 + rand() * 66;
    const h = 40 + rand() * 150;
    const top = baseY - h;
    d += ` L ${x} ${top}`;
    // Antena o remate ocasional
    if (rand() > 0.72) {
      const cx = x + w / 2;
      d += ` L ${cx - 3} ${top} L ${cx - 3} ${top - 18 - rand() * 22} L ${cx + 3} ${top - 18 - rand() * 22} L ${cx + 3} ${top}`;
    }
    d += ` L ${x + w} ${top} L ${x + w} ${baseY}`;
    // Ventanas iluminadas
    const cols = Math.max(1, Math.floor(w / 18));
    const rows = Math.max(1, Math.floor(h / 26));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() > 0.78) {
          windows.push({ x: x + 8 + c * 16, y: top + 10 + r * 24 });
        }
      }
    }
    x += w + 2 + rand() * 8;
  }
  d += ` L 910 ${baseY} Z`;
  return { path: d, windows };
}

function dominantIcon(day: Day): IconId {
  const counts = new Map<IconId, number>();
  for (const a of day.activities) {
    const icon = matchIcon({
      time: a.time,
      title: a.title,
      description: a.description,
      category: a.category,
    });
    counts.set(icon, (counts.get(icon) ?? 0) + 1);
  }
  let best: IconId = "pin";
  let bestN = 0;
  for (const [icon, n] of counts) {
    if (n > bestN) {
      best = icon;
      bestN = n;
    }
  }
  return best;
}

function formatDate(date: string, lang: string): string {
  const locale = lang.startsWith("en") ? "en-US" : lang;
  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

export function TripBrochure({ open, onClose, destination, days, startDate, endDate }: Props) {
  const { t, i18n } = useTranslation();
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const reduceMotion = useReducedMotion();

  const destinationName = destination.split(",")[0].trim();
  const skyline = useMemo(() => buildSkyline(destination), [destination]);

  const totalActivities = days.reduce((n, d) => n + d.activities.length, 0);
  const experienceKinds = useMemo(() => {
    const kinds = new Set<IconId>();
    for (const d of days)
      for (const a of d.activities)
        kinds.add(
          matchIcon({
            time: a.time,
            title: a.title,
            description: a.description,
            category: a.category,
          }),
        );
    return kinds.size;
  }, [days]);

  // Ruta esquemática horizontal en zig-zag (2 filas serpenteantes máximo).
  const route = useMemo(() => {
    const n = Math.max(1, days.length);
    const rand = mulberry32(hashString(`${destination}|brochure|${n}`));
    const yMid = 505;
    return days.map((day, i) => {
      const tt = n === 1 ? 0.5 : i / (n - 1);
      return {
        day,
        icon: dominantIcon(day),
        x: 90 + tt * 720,
        y: yMid + Math.sin(i * 1.7 + rand() * 6) * 42,
      };
    });
  }, [days, destination]);

  const routeD = useMemo(() => smoothPath(route), [route]);

  const titleSize = destinationName.length > 18 ? 44 : destinationName.length > 11 ? 56 : 68;

  const dates =
    startDate && endDate
      ? `${formatDate(startDate, i18n.language)}  ·  ${formatDate(endDate, i18n.language)}`
      : null;

  const stats: Array<[string, string]> = [
    [String(days.length), t("trip.visualMapDays")],
    [String(totalActivities), t("trip.visualMapActivities")],
    [String(experienceKinds), t("trip.visualMapExperiences")],
  ];

  // Resumen de días: cabe una línea por día; con viajes largos se compacta.
  const listTop = 640;
  const listBottom = 1130;
  const rowH = Math.min(44, Math.floor((listBottom - listTop) / Math.max(days.length, 1)));

  const download = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        backgroundColor: NAVY_DARK,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${destinationName.replace(/\s+/g, "-").toLowerCase()}-folleto.png`;
      a.click();
      toast.success(t("trip.brochureDownloaded"));
    } catch {
      toast.error(t("trip.postcardFail"));
    } finally {
      setDownloading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white drop-shadow">
                {t("trip.brochureTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-sky-900 shadow-lg transition hover:bg-sky-50 active:scale-[0.97] disabled:opacity-60"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {t("trip.visualMapDownload")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("dashboard.globeClose")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Póster A4 (proporción 1:√2) */}
            <div
              ref={posterRef}
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: NAVY_DARK }}
            >
              <svg
                viewBox="0 0 900 1273"
                className="block h-auto w-full"
                role="img"
                aria-label={t("trip.brochureAria", { destination: destinationName })}
              >
                <defs>
                  <linearGradient id="tb-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0e2440" />
                    <stop offset="100%" stopColor={NAVY_DARK} />
                  </linearGradient>
                  <linearGradient id="tb-building" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} />
                    <stop offset="100%" stopColor="#071223" />
                  </linearGradient>
                  <radialGradient id="tb-moon" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={SKY_SOFT} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={SKY_SOFT} stopOpacity="0" />
                  </radialGradient>
                  <marker
                    id="tb-arrow"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill={SKY} opacity="0.9" />
                  </marker>
                </defs>

                {/* ── Header con skyline ── */}
                <rect width="900" height="260" fill="url(#tb-sky)" />
                <circle cx="740" cy="80" r="60" fill="url(#tb-moon)" />
                <circle cx="740" cy="80" r="16" fill={SKY_SOFT} opacity="0.85" />
                {/* Estrellas deterministas */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={(i * 137 + 40) % 880}
                    cy={20 + ((i * 61) % 130)}
                    r={i % 3 === 0 ? 1.6 : 1}
                    fill="#ffffff"
                    opacity={0.25 + (i % 4) * 0.12}
                  />
                ))}
                <path
                  d={skyline.path}
                  fill="url(#tb-building)"
                  stroke={SKY}
                  strokeOpacity="0.25"
                  strokeWidth="1"
                />
                {skyline.windows.map((w, i) => (
                  <rect
                    key={i}
                    x={w.x}
                    y={w.y}
                    width="5"
                    height="7"
                    fill={SKY_SOFT}
                    opacity="0.4"
                  />
                ))}
                {/* Marca */}
                <text
                  x="60"
                  y="66"
                  fontFamily="Outfit, Inter, system-ui, sans-serif"
                  fontWeight="700"
                  fontSize="24"
                  fill="#ffffff"
                  opacity="0.92"
                >
                  ✈ Itineraya
                </text>
                <text
                  x="840"
                  y="66"
                  textAnchor="end"
                  fontFamily="ui-monospace, Menlo, monospace"
                  fontWeight="600"
                  fontSize="15"
                  letterSpacing="4"
                  fill={SKY_SOFT}
                  opacity="0.75"
                >
                  {t("trip.brochureEyebrow").toUpperCase()}
                </text>

                {/* ── Título + fechas ── */}
                <text
                  x="60"
                  y="330"
                  fontFamily="Outfit, Inter, system-ui, sans-serif"
                  fontWeight="800"
                  fontSize={titleSize}
                  fill="#ffffff"
                  letterSpacing="-1"
                >
                  {destinationName}
                </text>
                {dates && (
                  <text
                    x="60"
                    y="368"
                    fontFamily="ui-monospace, Menlo, monospace"
                    fontWeight="500"
                    fontSize="19"
                    fill={SKY_SOFT}
                    opacity="0.85"
                  >
                    {dates.toUpperCase()}
                  </text>
                )}
                <text
                  x="840"
                  y="330"
                  textAnchor="end"
                  fontFamily="Outfit, Inter, system-ui, sans-serif"
                  fontWeight="800"
                  fontSize="40"
                  fill={SKY}
                >
                  {t("trip.daysCount", { count: days.length })}
                </text>

                {/* ── Ruta esquemática con flechas ── */}
                <line x1="60" y1="408" x2="840" y2="408" stroke="#ffffff" strokeOpacity="0.1" />
                <text
                  x="60"
                  y="444"
                  fontFamily="ui-monospace, Menlo, monospace"
                  fontWeight="600"
                  fontSize="14"
                  letterSpacing="3"
                  fill={SKY_SOFT}
                  opacity="0.7"
                >
                  {t("trip.brochureRoute").toUpperCase()}
                </text>
                <path
                  d={routeD}
                  fill="none"
                  stroke={SKY}
                  strokeOpacity="0.8"
                  strokeWidth="3"
                  strokeDasharray="2 11"
                  strokeLinecap="round"
                  markerMid="url(#tb-arrow)"
                  markerEnd="url(#tb-arrow)"
                />
                {route.map((p, i) => (
                  <g key={p.day.day}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="20"
                      fill={i === 0 ? SKY : NAVY}
                      stroke={SKY}
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={p.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="ui-monospace, Menlo, monospace"
                      fontWeight="700"
                      fontSize="16"
                      fill={i === 0 ? NAVY_DARK : "#ffffff"}
                    >
                      {p.day.day}
                    </text>
                  </g>
                ))}

                {/* ── Resumen de cada día en una línea ── */}
                <line x1="60" y1="600" x2="840" y2="600" stroke="#ffffff" strokeOpacity="0.1" />
                {days.map((day, i) => {
                  const y = listTop + i * rowH;
                  const label = day.title.length > 52 ? `${day.title.slice(0, 51)}…` : day.title;
                  const icon = dominantIcon(day);
                  return (
                    <g key={day.day}>
                      <g
                        transform={`translate(60, ${y - 15}) scale(0.82)`}
                        fill="none"
                        stroke="rgba(255,255,255,0.75)"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        dangerouslySetInnerHTML={{ __html: ICON_PATHS[icon] }}
                      />
                      <text
                        x="100"
                        y={y}
                        fontFamily="ui-monospace, Menlo, monospace"
                        fontWeight="700"
                        fontSize="15"
                        fill={SKY}
                      >
                        {t("trip.dayLabel", { n: day.day }).toUpperCase()}
                      </text>
                      <text
                        x="185"
                        y={y}
                        fontFamily="Inter, system-ui, sans-serif"
                        fontWeight="500"
                        fontSize="17"
                        fill="#ffffff"
                        opacity="0.88"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* ── Estadísticas ── */}
                <line x1="60" y1="1146" x2="840" y2="1146" stroke="#ffffff" strokeOpacity="0.1" />
                {stats.map(([value, label], i) => (
                  <g key={label} transform={`translate(${90 + i * 260}, 1196)`}>
                    <text
                      fontFamily="Outfit, Inter, system-ui, sans-serif"
                      fontWeight="800"
                      fontSize="34"
                      fill="#ffffff"
                    >
                      {value}
                    </text>
                    <text
                      y="24"
                      fontFamily="ui-monospace, Menlo, monospace"
                      fontWeight="600"
                      fontSize="12"
                      letterSpacing="2"
                      fill={SKY_SOFT}
                      opacity="0.7"
                    >
                      {label.toUpperCase()}
                    </text>
                  </g>
                ))}

                {/* ── Pie ── */}
                <text
                  x="450"
                  y="1252"
                  textAnchor="middle"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="600"
                  fontSize="14"
                  fill="#ffffff"
                  opacity="0.55"
                >
                  {t("trip.visualMapFooter")}
                </text>
              </svg>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
