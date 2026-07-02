import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

const NOISE_PATTERN = 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'

export type TierType = {
  name: string
  priceMonthly: string
  priceAnnual: string
  priceIdMonthly?: string
  priceIdAnnual?: string
  description: string
  isPopular?: boolean
  isCurrent?: boolean
  features: string[]
  ctaLabel: string
  onSelect?: (priceId?: string) => void
}

function PricingCard({ tier, isAnnual }: { tier: TierType; isAnnual: boolean }) {
  const mouseX = React.useRef(0)
  const mouseY = React.useRef(0)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const glowRef = React.useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.current = e.clientX - rect.left
    mouseY.current = e.clientY - rect.top
    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(600px at ${mouseX.current}px ${mouseY.current}px, rgba(255,255,255,0.12), transparent)`
    }
  }

  const displayPrice = isAnnual ? tier.priceAnnual : tier.priceMonthly
  const isZero = displayPrice === "0"

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      variants={{
        hidden: { opacity: 0, y: 48, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 280, damping: 24 },
        },
      }}
      className={[
        "group relative flex w-full flex-col overflow-hidden rounded-[28px]",
        "bg-white/[0.04] backdrop-blur-2xl",
        tier.isCurrent
          ? "border border-emerald-400/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_32px_64px_-12px_rgba(0,0,0,0.7)] md:-translate-y-3"
          : tier.isPopular
            ? "border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_32px_64px_-12px_rgba(0,0,0,0.7)] md:-translate-y-3"
            : "border border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_20px_48px_-12px_rgba(0,0,0,0.55)]",
      ].join(" ")}
    >
      {/* Mouse glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-0 rounded-[28px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[28px] opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: NOISE_PATTERN }}
      />

      {/* Popular / Current badge */}
      {(tier.isPopular || tier.isCurrent) && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div
            className={[
              "rounded-b-xl border-b border-x px-4 py-1 text-[10px] font-bold uppercase tracking-widest",
              tier.isCurrent
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                : "border-white/15 bg-white/10 text-white/85",
            ].join(" ")}
          >
            {tier.isCurrent ? "Tu plan actual" : "Más popular"}
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
                {isZero ? "Gratis" : displayPrice}
              </motion.span>
            </AnimatePresence>
          </div>
          {!isZero && (
            <span className="text-base font-medium text-white/40">/mes</span>
          )}
        </div>

        {isAnnual && !isZero && (
          <p className="mt-1.5 text-[11px] font-medium text-amber-400/80 leading-snug">
            Pago único anual · sin cancelación
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
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/15">
                <Check className="h-3 w-3 text-white/85" strokeWidth={3} />
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
                ? "bg-white text-sky-950 hover:bg-white/92 shadow-lg"
                : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/18",
          ].join(" ")}
        >
          {tier.isCurrent ? "Plan activo" : tier.ctaLabel}
        </motion.button>
      </div>
    </motion.div>
  )
}

export function PricingGlass({
  title = "Planes simples y transparentes.",
  description = "Elige el plan perfecto para ti.",
  tiers,
  className,
}: {
  title?: string
  description?: string
  tiers: TierType[]
  className?: string
}) {
  const [isAnnual, setIsAnnual] = useState(false)

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
              "relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
              !isAnnual ? "text-white" : "text-white/45 hover:text-white/65",
            ].join(" ")}
          >
            Mensual
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={[
              "relative z-10 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
              isAnnual ? "text-white" : "text-white/45 hover:text-white/65",
            ].join(" ")}
          >
            Anual
            <span className="absolute -right-5 -top-3 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-sky-950">
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
  )
}
