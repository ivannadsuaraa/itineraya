// "Cómo funciona" con metáforas de aeropuerto: Check-in → Gate → Boarding.
// Los pasos entran en secuencia (stagger largo) y la línea que los une se
// dibuja como una pista de despegue mientras la sección entra en pantalla.

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
    <section id="how-it-works" className="relative bg-sky-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera con blur que se resuelve — distinto del resto de secciones */}
        <ScrollReveal direction="blur" amount={0.5}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-flight text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
              {t("how.kicker")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
              {t("how.title")}
            </h2>
            <p className="mt-4 text-lg text-sky-600">{t("how.subtitle")}</p>
          </div>
        </ScrollReveal>

        {/* Pasos en secuencia clara (stagger largo, 180 ms) */}
        <RevealGroup
          stagger={0.18}
          amount={0.25}
          className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Línea de pista que conecta los pasos en desktop */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-[repeating-linear-gradient(90deg,rgba(30,107,154,0.35)_0_12px,transparent_12px_24px)] lg:block"
          />
          {steps.map((step) => (
            <RevealItem key={step.code}>
              <div className="group relative h-full rounded-3xl bg-white p-8 shadow-[0_8px_32px_rgba(46,107,138,0.06)] ring-1 ring-sky-100 transition-all hover:shadow-[0_12px_40px_rgba(46,107,138,0.1)] hover:-translate-y-1">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="absolute top-8 right-8 font-flight text-xs font-bold uppercase tracking-[0.22em] text-sky-300 select-none">
                  {step.code}
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-sky-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sky-600 leading-relaxed">{step.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
