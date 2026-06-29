
import { Sparkles, Map, Sun, Wallet, Globe, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FeaturesSection() {
  const { t } = useTranslation();
  const features = [
    { icon: Sparkles, title: t("features.aiTitle"), description: t("features.aiDesc") },
    { icon: Map, title: t("features.mapTitle"), description: t("features.mapDesc") },
    { icon: Sun, title: t("features.seasonTitle"), description: t("features.seasonDesc") },
    { icon: Wallet, title: t("features.budgetTitle"), description: t("features.budgetDesc") },
    { icon: Globe, title: t("features.worldTitle"), description: t("features.worldDesc") },
    { icon: Share2, title: t("features.shareTitle"), description: t("features.shareDesc") },
  ];

  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-0 h-[300px] w-[300px] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-[250px] w-[250px] rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          
          
          
          
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-sky-500">
            {t("features.kicker")}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-lg text-sky-600">{t("features.subtitle")}</p>
        </div>

        <div
          
          
          
          
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              
              className="rounded-2xl border border-sky-100 bg-white/70 p-6 backdrop-blur-sm transition-all hover:border-sky-200 hover:bg-white hover:shadow-lg hover:shadow-sky-900/5 sm:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-sky-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sky-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
