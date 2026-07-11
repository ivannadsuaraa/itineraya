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
        "group relative flex w-full flex-col overflow-hidden rounded-3xl transition-colors",
        tier.isCurrent
          ? "bg-emerald-500/[0.06] ring-1 ring-emerald-400/40 md:-translate-y-3"
          : tier.isPopular
            ? "bg-[#38bdf8]/[0.06] ring-1 ring-[#38bdf8]/45 md:-translate-y-3"
            : "bg-white/[0.03] ring-1 ring-white/10",
      ].join(" ")}
    >
      {/* Popular / Current badge */}
      {(tier.isPopular || tier.isCurrent) && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div
            className={[
              "rounded-b-xl border-b border-x px-4 py-1 text-[10px] font-bold uppercase tracking-widest",
              tier.isCurrent
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                : "border-transparent bg-[#38bdf8] text-[#0c1a2e]",
            ].join(" ")}
          >
            {tier.isCurrent ? t("pricing.current") : t("pricing.popular")}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col p-7 md:p-9 flex-1 pt-8">
        {/* Tier name */}
        <h3 className="text-base font-semibold text-white/65">{tier.name}</h3>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-1">
          {!isZero && <span className="text-xl font-medium text-white/40">€</span>}
          <div className="h-[56px] overflow-hidden flex items-center">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={displayPrice}
                initial={{ y: 36, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -36, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="block font-display text-[52px] font-bold text-white tracking-tight leading-none"
              >
                {isZero ? t("pricing.free.name") : displayPrice}
              </motion.span>
            </AnimatePresence>
          </div>
          {!isZero && (
            <span className="text-base font-medium text-white/40">{t("pricing.perMonth")}</span>
          )}
        </div>

        {isAnnual && !isZero && (
          <p className="mt-1.5 text-[11px] font-medium text-amber-400/80 leading-snug">
            {t("pricing.annualNote")}
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-white/40">{tier.description}</p>

        <div className="my-7 h-px w-full bg-white/10" />

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
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#38bdf8]/15 ring-1 ring-[#38bdf8]/25">
                <Check className="h-3 w-3 text-[#38bdf8]" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium leading-snug text-white/65">{feat}</span>
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
            "mt-8 w-full rounded-2xl py-3.5 text-[15px] font-semibold transition-all duration-200",
            tier.isCurrent
              ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30 cursor-default"
              : tier.isPopular
                ? "bg-[#38bdf8] text-[#0c1a2e] hover:bg-[#5cc7f9]"
                : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/18",
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
  const [isAnnual, setIsAnnual] = useState(false);

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
          <h2 className="font-display text-4xl font-bold text-white tracking-tight md:text-5xl">
            {title}
          </h2>
          <p className="text-white/45 text-base max-w-xl mx-auto">{description}</p>
        </div>

        {/* Toggle */}
        <div className="relative flex items-center rounded-full bg-white/6 p-1.5 ring-1 ring-white/12">
          <button
            onClick={() => setIsAnnual(false)}
            className={[
              "relative z-10 flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors duration-200",
              !isAnnual ? "text-white" : "text-white/45 hover:text-white/65",
            ].join(" ")}
          >
            {t("pricing.billingMonthly")}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={[
              "relative z-10 flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors duration-200",
              isAnnual ? "text-white" : "text-white/45 hover:text-white/65",
            ].join(" ")}
          >
            {t("pricing.billingAnnual")}
            <span className="absolute -right-5 -top-3 rounded-full bg-[#38bdf8] px-1.5 py-0.5 text-[9px] font-bold text-[#0c1a2e]">
              -20%
            </span>
          </button>
          <motion.div
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-full bg-white/12 ring-1 ring-white/20"
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
