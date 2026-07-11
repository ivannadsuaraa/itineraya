// "Cómo funciona" con metáforas de aeropuerto: Check-in → Gate → Boarding.
// Mosaico Bento asimétrico: el primer paso manda como pieza grande (navy) y los
// dos siguientes lo acompañan en tiles claros. Entrada en cascada sutil.

import { ClipboardCheck, DoorOpen, PlaneTakeoff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RevealGroup, RevealItem, ScrollReveal } from "@/components/ui/ScrollReveal";

const STEP_CODES = ["CHECK-IN", "GATE", "BOARDING"] as const;

export function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = [
    {
      code: STEP_CODES[0],
      icon: ClipboardCheck,
      title: t("how.step1Title"),
      description: t("how.step1Desc"),
    },
    {
      code: STEP_CODES[1],
      icon: DoorOpen,
      title: t("how.step2Title"),
      description: t("how.step2Desc"),
    },
    {
      code: STEP_CODES[2],
      icon: PlaneTakeoff,
      title: t("how.step3Title"),
      description: t("how.step3Desc"),
    },
  ];

  return (
    <section id="how-it-works" className="relative bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Cabecera con blur que se resuelve — distinto del resto de secciones */}
        <ScrollReveal direction="blur" amount={0.5}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-flight text-xs font-semibold uppercase tracking-[0.28em] text-[#0ea5e9]">
              {t("how.kicker")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0c1a2e] sm:text-4xl">
              {t("how.title")}
            </h2>
            <p className="mt-4 text-lg text-slate-500">{t("how.subtitle")}</p>
          </div>
        </ScrollReveal>

        {/* Bento asimétrico: paso 1 grande (navy), pasos 2-3 en tiles claros */}
        <RevealGroup
          stagger={0.14}
          amount={0.25}
          className="mt-14 grid gap-4 lg:auto-rows-fr lg:grid-cols-3"
        >
          {/* Paso 1 — feature */}
          <RevealItem className="lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-between rounded-3xl bg-[#0c1a2e] p-8 sm:p-10">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38bdf8] text-[#0c1a2e]">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <span className="font-flight text-xs font-bold uppercase tracking-[0.22em] text-[#38bdf8]/70 select-none">
                  {steps[0].code}
                </span>
              </div>
              <div className="mt-10">
                <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {steps[0].title}
                </h3>
                <p className="mt-3 max-w-md leading-relaxed text-white/65">
                  {steps[0].description}
                </p>
              </div>
            </div>
          </RevealItem>

          {/* Pasos 2 y 3 — tiles claros */}
          {steps.slice(1).map((step) => (
            <RevealItem key={step.code}>
              <div className="group flex h-full flex-col rounded-3xl bg-white p-7 ring-1 ring-slate-200/70 transition hover:ring-[#38bdf8]/40">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#38bdf8]/10 text-[#0ea5e9] transition-colors group-hover:bg-[#38bdf8] group-hover:text-[#0c1a2e]">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="font-flight text-xs font-bold uppercase tracking-[0.22em] text-slate-300 select-none">
                    {step.code}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-[#0c1a2e]">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-500">{step.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
