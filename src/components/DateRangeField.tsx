import { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type { DateRange };

interface Props {
  value: DateRange | undefined;
  onChange: (v: DateRange | undefined) => void;
  locale?: typeof esLocale;
  startLabel: string;
  endLabel: string;
  placeholder: string;
  nightsLabel: (n: number) => string;
}

export function DateRangeField({
  value,
  onChange,
  locale = esLocale,
  startLabel,
  endLabel,
  placeholder,
  nightsLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range);
    if (range?.from && range?.to) {
      setTimeout(() => setOpen(false), 150);
    }
  };

  const from = value?.from;
  const to = value?.to;
  const nights = from && to ? Math.max(0, differenceInCalendarDays(to, from)) : 0;

  const summary = from
    ? to
      ? `${format(from, "d MMM", { locale })} → ${format(to, "d MMM yyyy", { locale })}`
      : format(from, "PPP", { locale })
    : placeholder;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-4 text-left text-sm transition-all hover:bg-white",
              !from && "text-sky-400",
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-sky-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-sky-600">
                <span>{startLabel}</span>
                <span className="opacity-40">→</span>
                <span>{endLabel}</span>
              </div>
              <div className={cn("mt-1 truncate font-medium text-sky-900", !from && "text-sky-400 font-normal")}>
                {summary}
              </div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={() => setIsMobile(window.innerWidth < 640)}>
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={isMobile ? 1 : 2}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={locale}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      {from && to && (
        <div className="rounded-xl bg-sky-50/70 px-4 py-2.5 text-sm font-medium text-sky-800">
          {format(from, "d MMM", { locale })} <span className="text-sky-400">→</span>{" "}
          {format(to, "d MMM", { locale })} <span className="mx-1 text-sky-400">·</span>{" "}
          {nightsLabel(nights)}
        </div>
      )}
    </div>
  );
}

export { esLocale, enUS };
