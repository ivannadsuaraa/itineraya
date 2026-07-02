import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import { Link } from "@tanstack/react-router"

export interface CalendarTrip {
  id: string
  destination: string
  start_date: string
  end_date: string
  hero_image_url?: string | null
}

interface TripsCalendarProps {
  trips?: CalendarTrip[]
  className?: string
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// Vibrant travel palette — solid, soft fill, text
const PALETTE = [
  { solid: "#0284c7", soft: "#bae6fd", text: "#0c4a6e" },
  { solid: "#7c3aed", soft: "#ddd6fe", text: "#3b0764" },
  { solid: "#059669", soft: "#a7f3d0", text: "#064e3b" },
  { solid: "#d97706", soft: "#fde68a", text: "#78350f" },
  { solid: "#dc2626", soft: "#fecaca", text: "#7f1d1d" },
  { solid: "#0891b2", soft: "#a5f3fc", text: "#164e63" },
  { solid: "#ea580c", soft: "#fed7aa", text: "#7c2d12" },
  { solid: "#db2777", soft: "#fbcfe8", text: "#831843" },
]

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(d: Date) {
  return isSameDay(d, new Date())
}

function tripRange(trip: CalendarTrip) {
  const start = new Date(trip.start_date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(trip.end_date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function isInTrip(date: Date, trip: CalendarTrip) {
  const { start, end } = tripRange(trip)
  return date >= start && date <= end
}

function getDaysInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const days: { date: Date; isCurrentMonth: boolean }[] = []
  const startDate = new Date(year, month, 1 - startDow)
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    days.push({ date: d, isCurrentMonth: d.getMonth() === month })
  }
  return days
}

export function TripsCalendar({ trips = [], className }: TripsCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [direction, setDirection] = useState(1)

  const days = getDaysInMonth(year, month)

  // Stable color per trip (by index in sorted order)
  const tripColor = useMemo(() => {
    const map = new Map<string, (typeof PALETTE)[0]>()
    trips.forEach((t, i) => map.set(t.id, PALETTE[i % PALETTE.length]))
    return map
  }, [trips])

  // Trips that overlap this month
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
  const monthTrips = trips.filter((t) => {
    const { start, end } = tripRange(t)
    return start <= monthEnd && end >= monthStart
  })

  const prevMonth = () => {
    setDirection(-1)
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    setDirection(1)
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  return (
    <div className={cn("overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80", className)}>
      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-sky-900 to-[#1E6B9A] px-6 py-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-4 left-4 h-24 w-52 rounded-full bg-[#1E6B9A]/20 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
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
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                {MONTH_NAMES[month]}
              </span>
              <span className="text-sm font-medium text-white/45">{year}</span>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Trip chips */}
        {monthTrips.length > 0 && (
          <div className="relative mt-4 flex flex-wrap items-center gap-2">
            {monthTrips.slice(0, 3).map((t) => {
              const c = tripColor.get(t.id)!
              return (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: c.solid + "33", color: "#fff", border: `1px solid ${c.solid}55` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: c.solid }} />
                  {t.destination.split(",")[0]}
                </span>
              )
            })}
            {monthTrips.length > 3 && (
              <span className="text-xs font-medium text-white/40">+{monthTrips.length - 3} más</span>
            )}
          </div>
        )}
      </div>

      {/* ── Day names ── */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
        {DAY_NAMES.map((d) => (
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
          {days.map(({ date, isCurrentMonth }, idx) => {
            const colIdx = idx % 7
            const todayDay = isToday(date)

            // Find the first trip covering this day
            const trip = trips.find((t) => isInTrip(date, t))
            const color = trip ? tripColor.get(trip.id) : undefined

            const isTripStart = trip ? isSameDay(date, new Date(trip.start_date)) : false
            const isTripEnd = trip ? isSameDay(date, new Date(trip.end_date)) : false

            // Band edges — round where the band visually starts/ends
            const bandLeft = isTripStart || colIdx === 0
            const bandRight = isTripEnd || colIdx === 6

            const bandRadius = (() => {
              if (bandLeft && bandRight) return "10px"
              if (bandLeft) return "10px 0 0 10px"
              if (bandRight) return "0 10px 10px 0"
              return "0"
            })()

            return (
              <div
                key={idx}
                className={cn(
                  "group relative flex min-h-[76px] flex-col items-center pt-2.5 pb-1.5",
                  !isCurrentMonth && "opacity-35",
                )}
              >
                {/* Trip band background */}
                {trip && color && (
                  <span
                    className="absolute z-0"
                    style={{
                      top: 8,
                      bottom: 8,
                      left: bandLeft ? 3 : 0,
                      right: bandRight ? 3 : 0,
                      background: color.soft,
                      borderRadius: bandRadius,
                    }}
                  />
                )}

                {/* Hero image on trip start */}
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
                      style={{ opacity: 0.28 }}
                    />
                  </span>
                )}

                {/* Date number */}
                <span
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums transition-all",
                    todayDay
                      ? "bg-sky-900 text-white shadow-lg"
                      : "text-slate-700",
                    !isCurrentMonth && "text-slate-300",
                  )}
                  style={
                    !todayDay && trip && color
                      ? { color: color.text }
                      : undefined
                  }
                >
                  {date.getDate()}
                </span>

                {/* Destination label on first day */}
                {isTripStart && color && (
                  <span
                    className="relative z-10 mt-1 max-w-full truncate px-0.5 text-center text-[9px] font-extrabold uppercase leading-none tracking-wide"
                    style={{ color: color.text }}
                  >
                    {trip?.destination.split(",")[0]}
                  </span>
                )}
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* ── Month trip list ── */}
      {monthTrips.length > 0 ? (
        <div className="border-t border-slate-100 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Viajes este mes
          </p>
          <div className="space-y-1.5">
            {monthTrips.map((t) => {
              const c = tripColor.get(t.id)!
              const { start, end } = tripRange(t)
              return (
                <Link
                  key={t.id}
                  to="/my-trip/$tripId"
                  params={{ tripId: t.id }}
                  className="group/row flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  {/* Color swatch / thumbnail */}
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: c.solid }}
                  >
                    {t.hero_image_url ? (
                      <img
                        src={t.hero_image_url}
                        alt={t.destination}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Plane className="h-4 w-4 text-white" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {t.destination.split(",")[0]}
                    </p>
                    <p className="text-xs text-slate-400">
                      {start.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      {" – "}
                      {end.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover/row:text-slate-500" />
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 py-8 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Plane className="h-5 w-5 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-400">Sin viajes este mes</p>
          <p className="mt-0.5 text-xs text-slate-300">Tus aventuras aparecerán aquí</p>
        </div>
      )}
    </div>
  )
}
