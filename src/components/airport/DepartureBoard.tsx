// Panel de salidas del dashboard: los viajes del usuario como un tablón de
// aeropuerto — fondo casi negro, tipografía mono, letras que giran al cargar
// (split-flap) y estado por colores. Cada fila navega a su itinerario.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { useTranslation } from "react-i18next";
import { boardStatus, flightNumber, type BoardStatus } from "@/lib/flight";
import { FlipText } from "./FlipText";

export type BoardTrip = {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

const STATUS_STYLE: Record<BoardStatus, string> = {
  upcoming: "text-amber-300",
  ongoing: "text-emerald-300",
  done: "text-white/45",
  planning: "text-sky-300",
};

function statusKey(s: BoardStatus): string {
  return `airport.board.${s}`;
}

function formatBoardDate(date: string | null, lang: string): string {
  if (!date) return "— —";
  return new Date(`${date}T00:00:00`)
    .toLocaleDateString(lang.startsWith("en") ? "en-GB" : lang, { day: "2-digit", month: "short" })
    .toUpperCase()
    .replace(/\./g, "");
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function DepartureBoard({ trips }: { trips: BoardTrip[] }) {
  const { t, i18n } = useTranslation();
  const clock = useClock();

  return (
    <div className="overflow-hidden rounded-2xl bg-[#050b16] shadow-xl ring-1 ring-sky-900/50">
      {/* Cabecera del panel */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <span className="flex items-center gap-2.5">
          <Plane className="h-4 w-4 -rotate-45 text-amber-300" />
          <FlipText
            text={t("airport.board.departures")}
            className="text-sm font-bold tracking-[0.3em] text-white"
          />
        </span>
        <span className="font-flight text-sm font-bold tabular-nums tracking-[0.2em] text-amber-300">
          {clock}
        </span>
      </div>

      {/* Cabecera de columnas */}
      <div className="grid grid-cols-[72px_1fr_64px_88px] items-center gap-2 border-b border-white/10 px-4 py-2 sm:grid-cols-[90px_1fr_90px_120px] sm:px-5">
        {[
          t("airport.board.flightCol"),
          t("airport.board.destinationCol"),
          t("airport.board.dateCol"),
          t("airport.board.statusCol"),
        ].map((h, i) => (
          <span
            key={h}
            className={`font-flight text-[9px] font-semibold uppercase tracking-[0.24em] text-sky-300/60 sm:text-[10px] ${i >= 2 ? "text-right" : ""}`}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Filas */}
      <ul className="divide-y divide-white/[0.06]">
        {trips.map((trip, i) => {
          const st = boardStatus(trip.start_date, trip.end_date, trip.status === "ready");
          return (
            <li key={trip.id}>
              <Link
                to="/my-trip/$tripId"
                params={{ tripId: trip.id }}
                className="grid grid-cols-[72px_1fr_64px_88px] items-center gap-2 px-4 py-3 transition hover:bg-white/[0.04] active:bg-white/[0.07] sm:grid-cols-[90px_1fr_90px_120px] sm:px-5"
              >
                <span className="font-flight text-xs font-bold tracking-wider text-sky-300 sm:text-sm">
                  {flightNumber(trip.id)}
                </span>
                <FlipText
                  text={trip.destination.split(",")[0].trim().slice(0, 18)}
                  delay={200 + i * 130}
                  charDelay={38}
                  className="truncate text-sm font-bold tracking-[0.14em] text-white sm:text-base"
                />
                <span className="text-right font-flight text-[11px] font-semibold tracking-wider text-white/70 sm:text-xs">
                  {formatBoardDate(trip.start_date, i18n.language)}
                </span>
                <span
                  className={`text-right font-flight text-[10px] font-bold tracking-[0.14em] sm:text-xs ${STATUS_STYLE[st]}`}
                >
                  {t(statusKey(st))}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Pie de pista */}
      <div
        aria-hidden
        className="h-2 bg-[repeating-linear-gradient(90deg,rgba(251,191,36,0.35)_0_18px,transparent_18px_34px)]"
      />
    </div>
  );
}
