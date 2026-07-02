import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
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
const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isToday(d: Date) {
  return isSameDay(d, new Date())
}

function getTripsForDate(date: Date, trips: CalendarTrip[]) {
  return trips.filter((t) => {
    if (!t.start_date || !t.end_date) return false
    const start = new Date(t.start_date)
    const end = new Date(t.end_date)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return date >= start && date <= end
  })
}

function getDaysInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  // Monday-first grid: adjust so week starts Monday
  let startDow = firstDay.getDay() // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1 // 0=Mon

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
  const [selected, setSelected] = useState<Date | null>(null)
  const [direction, setDirection] = useState(1)

  const days = getDaysInMonth(year, month)

  const prevMonth = () => {
    setDirection(-1)
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    setDirection(1)
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const selectedTrips = selected ? getTripsForDate(selected, trips) : []

  return (
    <div className={cn("rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-950 to-sky-900">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.h3
            key={`${year}-${month}`}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -24 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="font-display text-base font-bold text-white"
          >
            {MONTH_NAMES[month]} {year}
          </motion.h3>
        </AnimatePresence>

        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {days.map(({ date, isCurrentMonth }, idx) => {
          const dayTrips = getTripsForDate(date, trips)
          const hasTrip = dayTrips.length > 0
          const todayDay = isToday(date)
          const isSelected = selected && isSameDay(date, selected)

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(isSelected ? null : date)}
              className={cn(
                "group relative flex h-10 flex-col items-center justify-center bg-white transition-colors",
                isCurrentMonth ? "text-slate-800" : "text-slate-300",
                todayDay && "bg-sky-900 text-white font-bold",
                isSelected && !todayDay && "bg-sky-50 ring-inset ring-1 ring-sky-300",
                hasTrip && !todayDay && "bg-sky-50/60",
                "hover:bg-sky-50",
                todayDay && "hover:bg-sky-800",
              )}
              aria-label={`${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`}
            >
              <span className="text-xs">{date.getDate()}</span>
              {hasTrip && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    todayDay ? "bg-sky-300" : "bg-sky-500",
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day trips */}
      <AnimatePresence>
        {selected && selectedTrips.length > 0 && (
          <motion.div
            key="trip-info"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="space-y-2 p-4">
              {selectedTrips.map((t) => (
                <Link
                  key={t.id}
                  to="/my-trip/$tripId"
                  params={{ tripId: t.id }}
                  className="flex items-center gap-3 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100 transition hover:bg-sky-100"
                >
                  {t.hero_image_url ? (
                    <img
                      src={t.hero_image_url}
                      alt={t.destination}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-900">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sky-900">{t.destination}</p>
                    <p className="text-xs text-sky-600">
                      {new Date(t.start_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      {" – "}
                      {new Date(t.end_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
        {selected && selectedTrips.length === 0 && (
          <motion.div
            key="no-trip"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <p className="py-3 text-center text-xs text-slate-400">Sin viajes este día</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
