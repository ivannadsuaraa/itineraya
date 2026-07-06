// Banda de estadísticas: los números cuentan desde 0 al entrar en viewport.
// Estética de panel de aeropuerto (fondo navy, mono, línea de pista) para
// enlazar el hero con el resto de la landing.

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
    <section className="relative overflow-hidden bg-[#050b16] py-14 sm:py-16">
      {/* Línea de pista superior */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-[repeating-linear-gradient(90deg,rgba(56,189,248,0.4)_0_12px,transparent_12px_24px)]"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <RevealGroup stagger={0.12} amount={0.5} className="grid grid-cols-3 gap-6 sm:gap-10">
          {stats.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-white sm:text-5xl">
                <CountUp
                  to={s.to}
                  decimals={s.decimals}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  locale={i18n.language}
                />
              </p>
              <p className="mt-2 font-flight text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300/75 sm:text-xs">
                {s.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
