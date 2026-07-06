import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RevealGroup, RevealItem, ScrollReveal } from "@/components/ui/ScrollReveal";

export function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    {
      name: "María García",
      role: t("testimonials.t1Role"),
      avatar: "M",
      color: "bg-rose-100 text-rose-600",
      text: t("testimonials.t1Text"),
    },
    {
      name: "Carlos Mendoza",
      role: t("testimonials.t2Role"),
      avatar: "C",
      color: "bg-emerald-100 text-emerald-600",
      text: t("testimonials.t2Text"),
    },
    {
      name: "Laura Fernández",
      role: t("testimonials.t3Role"),
      avatar: "L",
      color: "bg-amber-100 text-amber-600",
      text: t("testimonials.t3Text"),
    },
  ];
  return (
    <section id="testimonials" className="relative overflow-hidden bg-sky-50 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-[300px] w-[300px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[250px] w-[250px] rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera con scale — la sección "respira" al entrar */}
        <ScrollReveal direction="scale" amount={0.5}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              {t("testimonials.kicker")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
              {t("testimonials.title")}
            </h2>
            <p className="mt-4 text-lg text-sky-600">{t("testimonials.subtitle")}</p>
          </div>
        </ScrollReveal>

        <RevealGroup
          stagger={0.1}
          amount={0.2}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((t) => (
            <RevealItem
              key={t.name}
              className="relative rounded-3xl bg-white p-8 shadow-[0_8px_32px_rgba(46,107,138,0.06)] ring-1 ring-sky-100 transition-all hover:shadow-[0_12px_40px_rgba(46,107,138,0.1)] hover:-translate-y-1"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="mt-5 text-sky-700 leading-relaxed">"{t.text}"</p>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${t.color}`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-900">{t.name}</p>
                  <p className="text-xs text-sky-500">{t.role}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
