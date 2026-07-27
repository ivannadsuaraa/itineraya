// Banda de estadísticas: los números cuentan desde 0 al entrar en viewport.

import { useTranslation } from "react-i18next";
import { CountUp } from "@/components/ui/CountUp";
import { RevealGroup, RevealItem } from "@/components/ui/ScrollReveal";

export function StatsSection() {
  const { t, i18n } = useTranslation();

  const stats: Array<{
    to: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    label: string;
  }> = [
    { to: 12400, suffix: "+", label: t("stats.itineraries") },
    { to: 1900, suffix: "+", label: t("stats.destinations") },
    { to: 4.8, decimals: 1, suffix: "/5", label: t("stats.rating") },
  ];

  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <RevealGroup stagger={0.12} amount={0.5} className="grid grid-cols-3 gap-6 sm:gap-10">
          {stats.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-[#0c1a2e] sm:text-5xl">
                <CountUp
                  to={s.to}
                  decimals={s.decimals}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  locale={i18n.language}
                />
              </p>
              <p className="mt-2 font-flight text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0ea5e9] sm:text-xs">
                {s.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
