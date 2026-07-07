import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plane, CalendarDays, LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export interface CalendarTrip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  hero_image_url?: string | null;
}

interface TripsCalendarProps {
  trips?: CalendarTrip[];
  className?: string;
}

const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;
const DAY_KEYS_SHORT = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const PALETTE = [
  { solid: "#0284c7", soft: "#bae6fd", text: "#0c4a6e" },
  { solid: "#7c3aed", soft: "#ddd6fe", text: "#3b0764" },
  { solid: "#059669", soft: "#a7f3d0", text: "#064e3b" },
  { solid: "#d97706", soft: "#fde68a", text: "#78350f" },
  { solid: "#dc2626", soft: "#fecaca", text: "#7f1d1d" },
  { solid: "#0891b2", soft: "#a5f3fc", text: "#164e63" },
  { solid: "#ea580c", soft: "#fed7aa", text: "#7c2d12" },
  { solid: "#db2777", soft: "#fbcfe8", text: "#831843" },
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function tripRange(trip: CalendarTrip) {
  const start = new Date(trip.start_date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(trip.end_date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isInTrip(date: Date, trip: CalendarTrip) {
  const { start, end } = tripRange(trip);
  return date >= start && date <= end;
}

function getDaysInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  const startDate = new Date(year, month, 1 - startDow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({ date: d, isCurrentMonth: d.getMonth() === month });
  }
  return days;
}

function getWeekDays(referenceDate: Date) {
  const d = new Date(referenceDate);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

function daysBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

// ── Detail panel shown when a trip day is clicked ──
function TripDetailPanel({
  trip,
  color,
  onClose,
}: {
  trip: CalendarTrip;
  color: (typeof PALETTE)[0];
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { start, end } = tripRange(trip);
  const nights = daysBetween(trip.start_date, trip.end_date);
  const dateLocale = i18n.language.startsWith("en") ? "en-US" : i18n.language;
  const fmt = (d: Date) =>
    d.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-t border-slate-100"
    >
      <div className="relative overflow-hidden rounded-b-3xl">
        {/* Hero */}
        <div className="relative h-36 w-full overflow-hidden">
          {trip.hero_image_url ? (
            <img
              src={trip.hero_image_url}
              alt={trip.destination}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: `linear-gradient(135deg, ${color.solid}, ${color.solid}99)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label={t("dashboard.globeClose")}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4">
            <p className="font-display text-lg font-bold text-white drop-shadow">
              {trip.destination.split(",")[0]}
            </p>
            <p className="text-xs text-white/75">{t("trip.daysCount", { count: nights })}</p>
          </div>
        </div>

        {/* Info row */}
        <div className="bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            {fmt(start)} — {fmt(end)}
          </p>
          <div className="mt-3">
            <Link
              to="/my-trip/$tripId"
              params={{ tripId: trip.id }}
              className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              style={{ background: color.solid }}
            >
              {t("publicTrip.view")} →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TripsCalendar({ trips = [], className }: TripsCalendarProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith("en") ? "en-US" : i18n.language;
  const monthNames = useMemo(() => MONTH_KEYS.map((k) => t(`calendar.months.${k}`)), [t]);
  const dayNamesShort = useMemo(() => DAY_KEYS_SHORT.map((k) => t(`calendar.daysShort.${k}`)), [t]);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [direction, setDirection] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [weekRef, setWeekRef] = useState(today);
  const [selectedTrip, setSelectedTrip] = useState<CalendarTrip | null>(null);

  const days = getDaysInMonth(year, month);
  const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef]);

  const tripColor = useMemo(() => {
    const map = new Map<string, (typeof PALETTE)[0]>();
    trips.forEach((trip, i) => map.set(trip.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [trips]);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const monthTrips = trips.filter((trip) => {
    const { start, end } = tripRange(trip);
    return start <= monthEnd && end >= monthStart;
  });

  const prevMonth = () => {
    setDirection(-1);
    setSelectedTrip(null);
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setDirection(1);
    setSelectedTrip(null);
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };
  const prevWeek = () => {
    setSelectedTrip(null);
    setWeekRef((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() - 7);
      return n;
    });
  };
  const nextWeek = () => {
    setSelectedTrip(null);
    setWeekRef((d) => {
      const n = new Date(d);
      n.setDate(d.getDate() + 7);
      return n;
    });
  };

  const handleDayClick = (date: Date) => {
    const hit = trips.find((trip) => isInTrip(date, trip));
    if (!hit) return;
    setSelectedTrip((prev) => (prev?.id === hit.id ? null : hit));
  };

  const renderDayCell = (date: Date, isCurrentMonth: boolean, idx: number, isWeekMode = false) => {
    const colIdx = idx % 7;
    const todayDay = isToday(date);
    const trip = trips.find((tr) => isInTrip(date, tr));
    const color = trip ? tripColor.get(trip.id) : undefined;
    const isTripStart = trip ? isSameDay(date, new Date(trip.start_date)) : false;
    const isTripEnd = trip ? isSameDay(date, new Date(trip.end_date)) : false;
    const isSelected = selectedTrip?.id === trip?.id && !!trip;
    const bandLeft = isTripStart || colIdx === 0;
    const bandRight = isTripEnd || colIdx === 6;

    const bandRadius = (() => {
      if (bandLeft && bandRight) return "10px";
      if (bandLeft) return "10px 0 0 10px";
      if (bandRight) return "0 10px 10px 0";
      return "0";
    })();

    const cellHeight = isWeekMode ? "min-h-[100px]" : "min-h-[76px]";

    return (
      <div
        key={idx}
        onClick={() => handleDayClick(date)}
        className={cn(
          `group relative flex ${cellHeight} flex-col items-center pt-2.5 pb-1.5 transition-colors`,
          !isCurrentMonth && "opacity-35",
          trip ? "cursor-pointer" : "cursor-default",
          isSelected && "ring-inset ring-2 ring-sky-400/60",
        )}
      >
        {/* Trip band */}
        {trip && color && (
          <span
            className="absolute z-0 transition-opacity"
            style={{
              top: 8,
              bottom: 8,
              left: bandLeft ? 3 : 0,
              right: bandRight ? 3 : 0,
              background: isSelected ? color.solid + "44" : color.soft,
              borderRadius: bandRadius,
            }}
          />
        )}

        {/* Hero thumbnail on trip start */}
        {isTripStart && trip?.hero_image_url && (
          <span
            className="pointer-events-none absolute z-0 overflow-hidden"
            style={{
              top: 8,
              bottom: 8,
              left: 3,
              right: bandRight ? 3 : 0,
              borderRadius: bandLeft && bandRight ? "10px" : "10px 0 0 10px",
            }}
          >
            <img
              src={trip.hero_image_url}
              alt=""
              className="h-full w-full object-cover"
              style={{ opacity: 0.32 }}
            />
          </span>
        )}

        {/* Date number */}
        <span
          className={cn(
            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-all",
            todayDay ? "bg-sky-900 text-white shadow-lg" : "text-slate-700",
            !isCurrentMonth && "text-slate-300",
          )}
          style={!todayDay && trip && color ? { color: color.text } : undefined}
        >
          {date.getDate()}
        </span>

        {/* Destination label */}
        {isTripStart && color && (
          <span
            className="relative z-10 mt-1 max-w-full truncate px-0.5 text-center text-[9px] font-extrabold uppercase leading-none tracking-wide"
            style={{ color: color.text }}
          >
            {trip?.destination.split(",")[0]}
          </span>
        )}

        {/* Week mode: time indicator */}
        {isWeekMode && trip && (
          <div className="relative z-10 mt-auto pb-1">
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{ background: color?.soft, color: color?.text }}
            >
              ✈
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80",
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-[#1E6B9A] px-6 py-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-4 left-4 h-24 w-52 rounded-full bg-[#1E6B9A]/20 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={viewMode === "month" ? prevMonth : prevWeek}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={viewMode === "month" ? `${year}-${month}` : weekRef.toISOString()}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 32 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -32 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center gap-0.5"
            >
              {viewMode === "month" ? (
                <>
                  <span className="font-display text-2xl font-bold tracking-tight text-white">
                    {monthNames[month]}
                  </span>
                  <span className="text-sm font-medium text-white/45">{year}</span>
                </>
              ) : (
                <>
                  <span className="font-display text-lg font-bold tracking-tight text-white">
                    {weekDays[0].toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                    {" — "}
                    {weekDays[6].toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={viewMode === "month" ? nextMonth : nextWeek}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* View toggle */}
        <div className="relative mt-4 flex items-center justify-between">
          {/* Trip chips */}
          {monthTrips.length > 0 && viewMode === "month" && (
            <div className="flex flex-wrap items-center gap-2">
              {monthTrips.slice(0, 3).map((trip) => {
                const c = tripColor.get(trip.id)!;
                return (
                  <span
                    key={trip.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{
                      background: c.solid + "33",
                      color: "#fff",
                      border: `1px solid ${c.solid}55`,
                    }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: c.solid }} />
                    {trip.destination.split(",")[0]}
                  </span>
                );
              })}
              {monthTrips.length > 3 && (
                <span className="text-xs font-medium text-white/40">
                  {t("calendar.moreCount", { count: monthTrips.length - 3 })}
                </span>
              )}
            </div>
          )}
          <div className="ml-auto flex rounded-full bg-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${viewMode === "month" ? "bg-white text-sky-900 shadow" : "text-white/60 hover:text-white"}`}
              title={t("calendar.monthView")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${viewMode === "week" ? "bg-white text-sky-900 shadow" : "text-white/60 hover:text-white"}`}
              title={t("calendar.weekView")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Day names ── */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
        {dayNamesShort.map((d) => (
          <div
            key={d}
            className="py-3 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <AnimatePresence mode="wait" custom={direction}>
        {viewMode === "month" ? (
          <motion.div
            key={`grid-${year}-${month}`}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -24 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="grid grid-cols-7 divide-x divide-y divide-slate-100/80"
          >
            {days.map(({ date, isCurrentMonth }, idx) => renderDayCell(date, isCurrentMonth, idx))}
          </motion.div>
        ) : (
          <motion.div
            key={`week-${weekRef.toISOString()}`}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -24 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="grid grid-cols-7 divide-x divide-slate-100/80 border-b border-slate-100/80"
          >
            {weekDays.map((date, idx) => renderDayCell(date, true, idx, true))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selected trip detail panel ── */}
      <AnimatePresence>
        {selectedTrip && (
          <TripDetailPanel
            trip={selectedTrip}
            color={tripColor.get(selectedTrip.id) ?? PALETTE[0]}
            onClose={() => setSelectedTrip(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Month trip list (when no trip selected and in month view) ── */}
      {!selectedTrip && (
        <>
          {monthTrips.length > 0 ? (
            <div className="border-t border-slate-100 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t("calendar.tripsThisMonth")}
              </p>
              <div className="space-y-1.5">
                {monthTrips.map((trip) => {
                  const c = tripColor.get(trip.id)!;
                  const { start, end } = tripRange(trip);
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => setSelectedTrip(trip)}
                      className="group/row flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                        style={{ background: c.solid }}
                      >
                        {trip.hero_image_url ? (
                          <img
                            src={trip.hero_image_url}
                            alt={trip.destination}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Plane className="h-4 w-4 text-white" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {trip.destination.split(",")[0]}
                        </p>
                        <p className="text-xs text-slate-400">
                          {start.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}
                          {" – "}
                          {end.toLocaleDateString(dateLocale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover/row:text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-100 py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Plane className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">{t("calendar.noTripsThisMonth")}</p>
              <p className="mt-0.5 text-xs text-slate-300">{t("calendar.adventuresAppearHere")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
