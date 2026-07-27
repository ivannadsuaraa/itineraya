import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export type TierType = {
  name: string;
  priceMonthly: string;
  priceAnnual: string;
  priceIdMonthly?: string;
  priceIdAnnual?: string;
  description: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  features: string[];
  ctaLabel: string;
  onSelect?: (priceId?: string) => void;
};

function PricingCard({ tier, isAnnual }: { tier: TierType; isAnnual: boolean }) {
  const { t } = useTranslation();
  const displayPrice = isAnnual ? tier.priceAnnual : tier.priceMonthly;
  const isZero = displayPrice === "0";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 280, damping: 26 },
        },
      }}
      className={[
        "group relative flex w-full flex-col overflow-hidden rounded-3xl bg-white transition-shadow",
        tier.isPopular
          ? "shadow-lg ring-1 ring-slate-200 md:-translate-y-3"
          : "shadow-sm ring-1 ring-gray-100",
      ].join(" ")}
    >
      {/* Popular / Current badge */}
      {(tier.isPopular || tier.isCurrent) && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div
            className={[
              "rounded-b-xl px-4 py-1 text-[10px] font-bold uppercase tracking-widest",
              tier.isCurrent ? "bg-emerald-100 text-emerald-700" : "bg-black text-white",
            ].join(" ")}
          >
            {tier.isCurrent ? t("pricing.current") : t("pricing.popular")}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col p-7 md:p-9 flex-1 pt-8">
        {/* Tier name */}
        <h3 className="text-base font-semibold text-slate-500">{tier.name}</h3>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-1">
          {!isZero && <span className="text-xl font-medium text-slate-400">€</span>}
          <div className="h-[56px] overflow-hidden flex items-center">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayPrice}
                initial={{ y: 36, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -36, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="block font-display text-[52px] font-bold text-[#0c1a2e] tracking-tight leading-none"
              >
                {isZero ? t("pricing.free.name") : displayPrice}
              </motion.span>
            </AnimatePresence>
          </div>
          {!isZero && (
            <span className="text-base font-medium text-slate-400">{t("pricing.perMonth")}</span>
          )}
        </div>

        {isAnnual && !isZero && (
          <p className="mt-1.5 text-[11px] font-medium text-[#0ea5e9] leading-snug">
            {t("pricing.annualNote")}
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{tier.description}</p>

        <div className="my-7 h-px w-full bg-gray-100" />

        {/* Features */}
        <ul className="flex flex-1 flex-col gap-3.5">
          {tier.features.map((feat, i) => (
            <motion.li
              key={i}
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0, transition: { delay: i * 0.06 } },
              }}
              className="flex items-start gap-3"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#38bdf8]/10 ring-1 ring-[#38bdf8]/20">
                <Check className="h-3 w-3 text-[#0ea5e9]" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium leading-snug text-slate-700">{feat}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.3 } },
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => tier.onSelect?.(isAnnual ? tier.priceIdAnnual : tier.priceIdMonthly)}
          className={[
            "mt-8 w-full rounded-full py-3.5 text-[15px] font-semibold transition-all duration-200",
            tier.isCurrent
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-default"
              : tier.isPopular
                ? "bg-black text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200",
          ].join(" ")}
        >
          {tier.isCurrent ? t("pricing.currentCta") : tier.ctaLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function PricingGlass({
  title = "Planes simples y transparentes.",
  description = "Elige el plan perfecto para ti.",
  tiers,
  className,
}: {
  title?: string;
  description?: string;
  tiers: TierType[];
  className?: string;
}) {
  const { t } = useTranslation();
  // Anual por defecto: es el precio que queremos anclar (5,99 € vs 7,99 €) y
  // el plan con mejor LTV; quien prefiera mensual lo cambia con un clic.
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
      className={["w-full flex flex-col items-center gap-12", className ?? ""].join(" ")}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-7 text-center">
        <div className="space-y-3">
          <h2 className="font-display text-4xl font-bold text-[#0c1a2e] tracking-tight md:text-5xl">
            {title}
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">{description}</p>
        </div>

        {/* Toggle */}
        <div className="relative flex items-center rounded-full bg-slate-100 p-1.5 ring-1 ring-gray-100">
          <button
            onClick={() => setIsAnnual(false)}
            className={[
              "relative z-10 flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors duration-200",
              !isAnnual ? "text-slate-900" : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            {t("pricing.billingMonthly")}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={[
              "relative z-10 flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors duration-200",
              isAnnual ? "text-slate-900" : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            {t("pricing.billingAnnual")}
            <span className="absolute -right-5 -top-3 rounded-full bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">
              -20%
            </span>
          </button>
          <motion.div
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-sm ring-1 ring-gray-100"
            animate={{ x: isAnnual ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="w-full grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-7 items-stretch">
        {tiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} isAnnual={isAnnual} />
        ))}
      </div>
    </motion.div>
  );
}
