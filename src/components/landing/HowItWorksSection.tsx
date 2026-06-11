import { motion } from "framer-motion";
import { MapPin, CalendarDays, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = [
    { number: "01", icon: MapPin, title: t("how.step1Title"), description: t("how.step1Desc") },
    { number: "02", icon: CalendarDays, title: t("how.step2Title"), description: t("how.step2Desc") },
    { number: "03", icon: Compass, title: t("how.step3Title"), description: t("how.step3Desc") },
  ];
  return (
    <section id="how-it-works" className="relative bg-sky-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-sky-500">
            {t("how.kicker")}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
            {t("how.title")}
          </h2>
          <p className="mt-4 text-lg text-sky-600">
            {t("how.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={item}
              className="group relative rounded-3xl bg-white p-8 shadow-[0_8px_32px_rgba(46,107,138,0.06)] ring-1 ring-sky-100 transition-all hover:shadow-[0_12px_40px_rgba(46,107,138,0.1)] hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                <step.icon className="h-6 w-6" />
              </div>
              <span className="absolute top-8 right-8 font-display text-5xl font-bold text-sky-100 select-none">
                {step.number}
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold text-sky-900">
                {step.title}
              </h3>
              <p className="mt-3 text-sky-600 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
