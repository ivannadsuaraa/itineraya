// Tarjeta de embarque visual del itinerario: origen → destino, vuelo IT-xxxx,
// puerta, fecha, pasajeros y clase según plan. Perforación dentada real en el
// lateral, código de barras SVG determinista y descarga como PNG.

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Download, Loader2, Plane } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { geocodeDestination } from "@/lib/geocode";
import {
  destinationCode,
  flightNumber,
  formatCoords,
  gateCode,
  hashString,
  seatCode,
  travelClassForPlan,
} from "@/lib/flight";
import { EASE_OUT } from "@/lib/motion";
import { getCountryInfo, timezoneDiffFromSpain, type CountryInfo } from "@/lib/country";
import { getWeather, weatherEmoji, type WeatherNow } from "@/lib/weather";

const NAVY_DARK = "#050b16";

type Props = {
  tripId: string;
  destination: string;
  startDate: string | null;
  daysCount: number;
  companion?: string | null;
  plan: string | null;
};

function paxLabel(companion: string | null | undefined): string {
  switch (companion) {
    case "pareja":
      return "2 PAX";
    case "amigos":
      return "3+ PAX";
    case "familia":
      return "FAMILY";
    default:
      return "1 PAX";
  }
}

/** Código de barras decorativo: barras deterministas a partir del id. */
function Barcode({ seed, className }: { seed: string; className?: string }) {
  const h = hashString(seed);
  const bars: Array<{ x: number; w: number }> = [];
  let x = 0;
  let n = h;
  while (x < 96) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const w = 1 + (n % 4);
    bars.push({ x, w });
    x += w + 1 + ((n >> 4) % 3);
  }
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={className} aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="40" fill="currentColor" />
      ))}
    </svg>
  );
}

export function BoardingPass({
  tripId,
  destination,
  startDate,
  daysCount,
  companion,
  plan,
}: Props) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const passRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [passenger, setPassenger] = useState<string>("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [country, setCountry] = useState<CountryInfo | null>(null);
  const [weather, setWeather] = useState<WeatherNow | null>(null);

  // ── Objeto que respira: parallax 3D con muelles + brillo holográfico que
  //    sigue al puntero. Todo decorativo → desactivado con reduced-motion, y la
  //    captura PNG usa passRef (el brillo es hermano, no entra en la descarga).
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [7, -7]), {
    stiffness: 140,
    damping: 18,
  });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-9, 9]), {
    stiffness: 140,
    damping: 18,
  });
  const sheenX = useSpring(useTransform(tiltX, [-0.5, 0.5], [12, 88]), {
    stiffness: 120,
    damping: 20,
  });
  const sheenY = useSpring(useTransform(tiltY, [-0.5, 0.5], [8, 78]), {
    stiffness: 120,
    damping: 20,
  });
  const sheen = useMotionTemplate`radial-gradient(340px 340px at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.16), rgba(125,211,252,0.06) 38%, transparent 62%)`;

  const onTilt = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltX.set((e.clientX - r.left) / r.width - 0.5);
    tiltY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const destCity = destination.split(",")[0].trim();
  const destCountryName = destination.includes(",")
    ? destination.split(",").slice(-1)[0].trim()
    : destination;
  const klass = travelClassForPlan(plan);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { full_name?: string; name?: string } | undefined;
      const name =
        meta?.full_name ?? meta?.name ?? data.user?.email?.split("@")[0]?.replace(/[._-]+/g, " ");
      if (name) setPassenger(name);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void geocodeDestination(destination).then((c) => {
      if (!cancelled && c) setCoords(c);
    });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  useEffect(() => {
    let cancelled = false;
    void getCountryInfo(destCountryName).then((info) => {
      if (!cancelled) setCountry(info);
    });
    return () => {
      cancelled = true;
    };
  }, [destCountryName]);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    void getWeather(coords[0], coords[1]).then(({ current }) => {
      if (!cancelled) setWeather(current);
    });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const tzDiff = country ? timezoneDiffFromSpain(country.utcOffsetHours) : null;

  const dateLabel = startDate
    ? new Date(`${startDate}T00:00:00`)
        .toLocaleDateString(i18n.language.startsWith("en") ? "en-GB" : i18n.language, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase()
        .replace(/\./g, "")
    : "TBD";

  const download = async () => {
    if (!passRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(passRef.current, {
        pixelRatio: 2,
        backgroundColor: NAVY_DARK,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `boarding-pass-${destCity.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      toast.success(t("airport.passDownloaded"));
    } catch {
      toast.error(t("trip.postcardFail"));
    } finally {
      setDownloading(false);
    }
  };

  const fields: Array<[string, string]> = [
    [t("airport.flight"), flightNumber(tripId)],
    [t("airport.gate"), gateCode(tripId)],
    [t("airport.date"), dateLabel],
    [t("airport.duration"), `${daysCount}D`],
    [t("airport.passengers"), paxLabel(companion)],
    [t("airport.seat"), seatCode(tripId)],
  ];

  const enrichFields: Array<[string, string]> = [];
  if (weather) {
    enrichFields.push([
      t("airport.weatherLabel"),
      `${weatherEmoji(weather.main)} ${weather.temp}°C`,
    ]);
  }
  if (country?.currencyCode) {
    enrichFields.push([
      t("airport.currencyLabel"),
      country.currencySymbol
        ? `${country.currencyCode} (${country.currencySymbol})`
        : country.currencyCode,
    ]);
  }
  if (tzDiff !== null) {
    enrichFields.push([
      t("airport.timezoneLabel"),
      tzDiff === 0
        ? t("airport.timezoneSame")
        : tzDiff > 0
          ? t("airport.timezoneAhead", { hours: Math.abs(tzDiff) })
          : t("airport.timezoneBehind", { hours: Math.abs(tzDiff) }),
    ]);
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      style={{ perspective: 1400 }}
      onPointerMove={onTilt}
      onPointerLeave={resetTilt}
    >
      <motion.div
        className="boarding-pass-3d relative"
        style={reduce ? undefined : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      >
        {/* Halo que respira: resplandor sky detrás del pase, opacidad en bucle
            suave — el pase se siente vivo sin mover un solo píxel del contenido. */}
        <div
          aria-hidden
          className="boarding-pass-breathe pointer-events-none absolute -inset-3 -z-10 rounded-[1.6rem]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 45%, rgba(56,189,248,0.35), rgba(30,107,154,0.14) 55%, transparent 78%)",
            filter: "blur(14px)",
          }}
        />
        <div
          ref={passRef}
          className="relative z-0 overflow-hidden rounded-2xl text-white shadow-2xl shadow-black/40"
          style={{
            background: `linear-gradient(135deg, ${NAVY_DARK} 0%, #0b1a2e 70%, #0e2440 100%)`,
          }}
        >
          {/* Línea de pista decorativa superior */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-[repeating-linear-gradient(90deg,rgba(56,189,248,0.5)_0_10px,transparent_10px_20px)]"
          />
          <div className="flex flex-col sm:flex-row">
            {/* ── Cuerpo principal ── */}
            <div className="min-w-0 flex-1 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <img src="/itineraya-mark.png" alt="" className="h-5 w-5" draggable={false} />
                  <span className="font-display text-sm font-bold">Itineraya</span>
                </span>
                <span className="font-flight text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-300/80">
                  {t("airport.boardingPass")}
                </span>
              </div>

              {/* Origen → destino */}
              <div className="mt-6 flex items-center gap-3.5 sm:gap-5">
                <div className="min-w-0">
                  <p className="font-flight text-[10px] uppercase tracking-[0.2em] text-sky-300/70">
                    {t("airport.from")}
                  </p>
                  <p className="mt-1 font-flight text-2xl font-bold tracking-wide sm:text-3xl">
                    {t("airport.yourCity")}
                  </p>
                </div>
                <div className="flex flex-1 items-center gap-1.5 px-1">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-[repeating-linear-gradient(90deg,rgba(125,211,252,0.6)_0_8px,transparent_8px_16px)]"
                  />
                  <Plane className="h-4 w-4 shrink-0 text-sky-300" />
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-[repeating-linear-gradient(90deg,rgba(125,211,252,0.6)_0_8px,transparent_8px_16px)]"
                  />
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                </div>
                <div className="min-w-0 text-right">
                  <p className="font-flight text-[10px] uppercase tracking-[0.2em] text-sky-300/70">
                    {t("airport.to")}
                  </p>
                  <p className="mt-1 truncate font-flight text-2xl font-bold tracking-wide text-amber-300 sm:text-3xl">
                    {destinationCode(destination)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="truncate font-display text-lg font-bold text-white/95 sm:text-xl">
                  {country?.flagEmoji && <span className="mr-1.5">{country.flagEmoji}</span>}
                  {destCity}
                </p>
                {coords && (
                  <p className="hidden shrink-0 font-flight text-[10px] tracking-wider text-sky-300/60 sm:block">
                    {formatCoords(coords[0], coords[1])}
                  </p>
                )}
              </div>

              {/* Datos del vuelo */}
              <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-6">
                {fields.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="font-flight text-[9px] uppercase tracking-[0.18em] text-sky-300/60">
                      {label}
                    </p>
                    <p className="mt-1 truncate font-flight text-sm font-bold uppercase">{value}</p>
                  </div>
                ))}
              </div>

              {/* Clima, moneda y huso horario del destino — solo se muestran los
                datos que llegaron a tiempo; si las 3 APIs fallan, la sección
                desaparece sin dejar huecos vacíos. */}
              {enrichFields.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-4 border-t border-white/10 pt-5">
                  {enrichFields.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <p className="font-flight text-[9px] uppercase tracking-[0.18em] text-sky-300/60">
                        {label}
                      </p>
                      <p className="mt-1 truncate font-flight text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pasajero + clase */}
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3.5 border-t border-white/10 pt-5">
                <div className="min-w-0">
                  <p className="font-flight text-[9px] uppercase tracking-[0.18em] text-sky-300/60">
                    {t("airport.passenger")}
                  </p>
                  <p className="mt-1 truncate font-flight text-base font-bold uppercase">
                    {passenger || "—"}
                  </p>
                </div>
                <span className="rounded-md bg-sky-400/15 px-2.5 py-1 font-flight text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300 ring-1 ring-sky-400/40">
                  {klass.label}
                </span>
              </div>
            </div>

            {/* ── Perforación dentada ── */}
            <div
              className="relative flex h-4 items-center sm:h-auto sm:w-4 sm:flex-col"
              aria-hidden
            >
              <div className="absolute inset-0 flex items-center justify-around sm:flex-col">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-slate-50" />
                ))}
              </div>
              <span className="mx-auto h-px w-full border-t border-dashed border-white/25 sm:h-full sm:w-px sm:border-t-0 sm:border-l" />
            </div>

            {/* ── Talón con código de barras ── */}
            <div className="flex shrink-0 items-center justify-between gap-4 p-6 sm:w-36 sm:flex-col sm:items-stretch sm:justify-center sm:p-5">
              <div className="sm:text-center">
                <p className="font-flight text-[9px] uppercase tracking-[0.18em] text-sky-300/60">
                  {t("airport.flight")}
                </p>
                <p className="font-flight text-lg font-bold text-amber-300">
                  {flightNumber(tripId)}
                </p>
                <p className="mt-1 font-flight text-[10px] uppercase tracking-[0.18em] text-sky-300/70">
                  {t("airport.gate")} {gateCode(tripId)}
                </p>
              </div>
              <Barcode
                seed={tripId}
                className="h-10 w-28 text-white/85 sm:h-16 sm:w-full sm:rotate-0"
              />
            </div>
          </div>
        </div>

        {/* Brillo holográfico que sigue al puntero — hermano del pase, así que
            NO entra en la descarga PNG (toPng captura solo passRef). */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl mix-blend-screen"
          style={reduce ? undefined : { background: sheen }}
        />
      </motion.div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.97] disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {t("airport.downloadPass")}
        </button>
      </div>
    </motion.div>
  );
}
