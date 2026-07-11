import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RevealGroup, RevealItem, ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

function Stars({ dark }: { dark?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            dark ? "fill-[#38bdf8] text-[#38bdf8]" : "fill-amber-400 text-amber-400",
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    {
      name: "María García",
      role: t("testimonials.t1Role"),
      avatar: "M",
      text: t("testimonials.t1Text"),
    },
    {
      name: "Carlos Mendoza",
      role: t("testimonials.t2Role"),
      avatar: "C",
      text: t("testimonials.t2Text"),
    },
    {
      name: "Laura Fernández",
      role: t("testimonials.t3Role"),
      avatar: "L",
      text: t("testimonials.t3Text"),
    },
  ];
  const [feature, ...rest] = testimonials;

  return (
    <section id="testimonials" className="relative overflow-hidden bg-slate-50 py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Cabecera con scale — la sección "respira" al entrar */}
        <ScrollReveal direction="scale" amount={0.5}>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#0ea5e9]">
              {t("testimonials.kicker")}
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0c1a2e] sm:text-4xl">
              {t("testimonials.title")}
            </h2>
            <p className="mt-4 text-lg text-slate-500">{t("testimonials.subtitle")}</p>
          </div>
        </ScrollReveal>

        {/* Bento: quote destacada (navy, alta) + dos anchas de apoyo */}
        <RevealGroup
          stagger={0.1}
          amount={0.2}
          className="mt-14 grid gap-4 lg:auto-rows-fr lg:grid-cols-3"
        >
          {/* Feature — navy, tall */}
          <RevealItem className="lg:row-span-2">
            <figure className="flex h-full flex-col justify-between rounded-3xl bg-[#0c1a2e] p-8">
              <div>
                <Stars dark />
                <blockquote className="mt-5 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                  "{feature.text}"
                </blockquote>
              </div>
              <figcaption className="mt-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#38bdf8] text-sm font-bold text-[#0c1a2e]">
                  {feature.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.name}</p>
                  <p className="text-xs text-white/55">{feature.role}</p>
                </div>
              </figcaption>
            </figure>
          </RevealItem>

          {/* Apoyo — anchas, claras */}
          {rest.map((r) => (
            <RevealItem key={r.name} className="lg:col-span-2">
              <figure className="flex h-full flex-col justify-between rounded-3xl bg-white p-7 ring-1 ring-slate-200/70 transition hover:ring-[#38bdf8]/40">
                <div>
                  <Stars />
                  <blockquote className="mt-4 leading-relaxed text-slate-700">
                    "{r.text}"
                  </blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#38bdf8]/10 text-sm font-bold text-[#0ea5e9]">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0c1a2e]">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.role}</p>
                  </div>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
