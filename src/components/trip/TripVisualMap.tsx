// Mapa ilustrado del viaje: un póster SVG oscuro, único por itinerario, con
// la silueta del país, la ruta numerada día a día, iconos por categoría de
// actividad y estadísticas. Descargable como PNG (html-to-image).

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { ICON_PATHS, matchIcon, type IconId } from "@/lib/postcard";
import { COUNTRY_PATHS, countryForDestination } from "@/lib/country-silhouettes";

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

// Paleta del póster — la misma familia oscura que las postales.
const NAVY_DARK = "#050b16";
const NAVY = "#0b1a2e";
const SKY = "#38bdf8"; // sky-400
const SKY_SOFT = "#7dd3fc"; // sky-300

// PRNG determinista: el mismo viaje produce siempre el mismo mapa, pero cada
// viaje (destino + nº de días) tiene un trazado propio.
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

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
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

function formatPosterDate(date: string, lang: string): string {
  const locale = lang.startsWith("en") ? "en-US" : lang;
  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Curva suave que pasa por todos los puntos (midpoint quadratic smoothing).
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

export function TripVisualMap({ open, onClose, destination, days, startDate, endDate }: Props) {
  const { t, i18n } = useTranslation();
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const reduceMotion = useReducedMotion();

  const destinationName = destination.split(",")[0].trim();
  const country = countryForDestination(destination);

  const totalActivities = days.reduce((n, d) => n + d.activities.length, 0);
  const experienceKinds = useMemo(() => {
    const kinds = new Set<IconId>();
    for (const d of days) {
      for (const a of d.activities) {
        kinds.add(
          matchIcon({
            time: a.time,
            title: a.title,
            description: a.description,
            category: a.category,
          }),
        );
      }
    }
    return kinds.size;
  }, [days]);

  // Trazado de la ruta: N puntos que fluyen de arriba a abajo con vaivén
  // horizontal, sembrados por el viaje para que cada mapa sea único.
  const route = useMemo(() => {
    const n = Math.max(1, days.length);
    const rand = mulberry32(hashString(`${destination}|${n}|${startDate ?? ""}`));
    const phase = rand() * Math.PI * 2;
    const amplitude = 150 + rand() * 60;
    const yTop = 400;
    const yBottom = 880;
    const cx = 450;
    return days.map((day, i) => {
      const tt = n === 1 ? 0.5 : i / (n - 1);
      const wobbleX = Math.sin(i * 1.9 + phase) * amplitude + (rand() - 0.5) * 70;
      const wobbleY = (rand() - 0.5) * 46;
      return {
        day,
        icon: dominantIcon(day),
        x: Math.max(120, Math.min(780, cx + wobbleX)),
        y: yTop + tt * (yBottom - yTop) + wobbleY,
      };
    });
  }, [days, destination, startDate]);

  const routeD = useMemo(() => smoothPath(route), [route]);

  // El título escala para caber en una línea aunque el destino sea largo.
  const titleSize = destinationName.length > 18 ? 46 : destinationName.length > 11 ? 58 : 72;

  const dates =
    startDate && endDate
      ? `${formatPosterDate(startDate, i18n.language)}  ·  ${formatPosterDate(endDate, i18n.language)}`
      : null;

  const stats: Array<[string, string]> = [
    [String(days.length), t("trip.visualMapDays")],
    [String(totalActivities), t("trip.visualMapActivities")],
    [String(experienceKinds), t("trip.visualMapExperiences")],
  ];

  // Leyenda en dos columnas para viajes largos.
  const legendCols = days.length > 7 ? 2 : 1;
  const legendRows = Math.ceil(days.length / legendCols);

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
      a.download = `${destinationName.replace(/\s+/g, "-").toLowerCase()}-mapa-viaje.png`;
      a.click();
      toast.success(t("trip.visualMapDownloaded"));
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
            {/* Barra de acciones */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white drop-shadow">
                {t("trip.visualMapTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-sky-900 shadow-lg transition hover:bg-sky-50 active:scale-[0.97] disabled:opacity-60"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Póster */}
            <div
              ref={posterRef}
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: NAVY_DARK }}
            >
              <svg
                viewBox="0 0 900 1240"
                className="block h-auto w-full"
                role="img"
                aria-label={t("trip.visualMapAria", { destination: destinationName })}
              >
                <defs>
                  <radialGradient id="tvm-glow-a" cx="20%" cy="12%" r="60%">
                    <stop offset="0%" stopColor={SKY} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={SKY} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="tvm-glow-b" cx="85%" cy="80%" r="55%">
                    <stop offset="0%" stopColor="#1E6B9A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#1E6B9A" stopOpacity="0" />
                  </radialGradient>
                  <pattern id="tvm-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.2" fill="#ffffff" opacity="0.05" />
                  </pattern>
                  <filter id="tvm-soft" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                </defs>

                {/* Fondo */}
                <rect width="900" height="1240" fill={NAVY_DARK} />
                <rect width="900" height="1240" fill="url(#tvm-glow-a)" />
                <rect width="900" height="1240" fill="url(#tvm-glow-b)" />
                <rect width="900" height="1240" fill="url(#tvm-dots)" />

                {/* Marca */}
                <text
                  x="60"
                  y="76"
                  fontFamily="Outfit, Inter, system-ui, sans-serif"
                  fontWeight="700"
                  fontSize="24"
                  fill="#ffffff"
                  opacity="0.9"
                >
                  ✈ Itineraya
                </text>
                <text
                  x="840"
                  y="76"
                  textAnchor="end"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="600"
                  fontSize="16"
                  letterSpacing="3"
                  fill={SKY_SOFT}
                  opacity="0.75"
                >
                  {t("trip.visualMapEyebrow").toUpperCase()}
                </text>
                <line x1="60" y1="98" x2="840" y2="98" stroke="#ffffff" strokeOpacity="0.1" />

                {/* Título + fechas */}
                <text
                  x="60"
                  y={176}
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
                    y="216"
                    fontFamily="Inter, system-ui, sans-serif"
                    fontWeight="500"
                    fontSize="21"
                    fill={SKY_SOFT}
                    opacity="0.85"
                  >
                    {dates}
                  </text>
                )}

                {/* Estadísticas */}
                {stats.map(([value, label], i) => (
                  <g key={label} transform={`translate(${60 + i * 200}, 268)`}>
                    {i > 0 && (
                      <line
                        x1="-32"
                        y1="-24"
                        x2="-32"
                        y2="16"
                        stroke="#ffffff"
                        strokeOpacity="0.14"
                      />
                    )}
                    <text
                      fontFamily="Outfit, Inter, system-ui, sans-serif"
                      fontWeight="800"
                      fontSize="36"
                      fill="#ffffff"
                    >
                      {value}
                    </text>
                    <text
                      y="26"
                      fontFamily="Inter, system-ui, sans-serif"
                      fontWeight="600"
                      fontSize="14"
                      letterSpacing="1.5"
                      fill={SKY_SOFT}
                      opacity="0.7"
                    >
                      {label.toUpperCase()}
                    </text>
                  </g>
                ))}

                {/* Silueta del país detrás de la ruta */}
                <g transform="translate(130, 330) scale(6.4)" opacity="0.9">
                  {COUNTRY_PATHS[country].map((d, i) => (
                    <path
                      key={`glow-${i}`}
                      d={d}
                      fill={SKY}
                      opacity="0.05"
                      filter="url(#tvm-soft)"
                    />
                  ))}
                  {COUNTRY_PATHS[country].map((d, i) => (
                    <path
                      key={i}
                      d={d}
                      fill="rgba(56,189,248,0.06)"
                      stroke={SKY}
                      strokeOpacity="0.35"
                      strokeWidth="0.7"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>

                {/* Ruta día a día */}
                <path
                  d={routeD}
                  fill="none"
                  stroke={SKY}
                  strokeOpacity="0.85"
                  strokeWidth="3.5"
                  strokeDasharray="2 12"
                  strokeLinecap="round"
                />

                {route.map((p, i) => {
                  const iconRight = p.x < 450;
                  const badgeX = Math.max(56, Math.min(800, iconRight ? p.x + 34 : p.x - 34 - 44));
                  return (
                    <g key={p.day.day}>
                      {/* Punto numerado */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="26"
                        fill={i === 0 ? SKY : NAVY}
                        stroke={SKY}
                        strokeWidth="2.5"
                      />
                      <text
                        x={p.x}
                        y={p.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                        fontWeight="700"
                        fontSize="20"
                        fill={i === 0 ? NAVY_DARK : "#ffffff"}
                      >
                        {p.day.day}
                      </text>
                      {/* Icono de la categoría dominante del día */}
                      <g transform={`translate(${badgeX}, ${p.y - 22})`}>
                        <rect
                          width="44"
                          height="44"
                          rx="12"
                          fill="rgba(56,189,248,0.12)"
                          stroke={SKY}
                          strokeOpacity="0.4"
                          strokeWidth="1.2"
                        />
                        <g
                          transform="translate(10, 10)"
                          fill="none"
                          stroke={SKY_SOFT}
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          dangerouslySetInnerHTML={{ __html: ICON_PATHS[p.icon] }}
                        />
                      </g>
                    </g>
                  );
                })}

                {/* Leyenda de días */}
                <line x1="60" y1="948" x2="840" y2="948" stroke="#ffffff" strokeOpacity="0.1" />
                {route.map((p, i) => {
                  const col = legendCols === 2 ? Math.floor(i / legendRows) : 0;
                  const row = legendCols === 2 ? i % legendRows : i;
                  const x = 60 + col * 400;
                  const y = 992 + row * 30;
                  const maxLen = legendCols === 2 ? 26 : 56;
                  const label =
                    p.day.title.length > maxLen
                      ? `${p.day.title.slice(0, maxLen - 1)}…`
                      : p.day.title;
                  return (
                    <g key={`legend-${p.day.day}`}>
                      <circle
                        cx={x + 10}
                        cy={y - 6}
                        r="11"
                        fill={NAVY}
                        stroke={SKY}
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 10}
                        y={y - 5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="Inter, system-ui, sans-serif"
                        fontWeight="700"
                        fontSize="11"
                        fill="#ffffff"
                      >
                        {p.day.day}
                      </text>
                      <text
                        x={x + 32}
                        y={y}
                        fontFamily="Inter, system-ui, sans-serif"
                        fontWeight="500"
                        fontSize="16"
                        fill="#ffffff"
                        opacity="0.82"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Pie */}
                <line x1="60" y1="1180" x2="840" y2="1180" stroke="#ffffff" strokeOpacity="0.1" />
                <text
                  x="450"
                  y="1214"
                  textAnchor="middle"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="600"
                  fontSize="15"
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
