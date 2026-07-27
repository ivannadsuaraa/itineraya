import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ArrowLeft, X, Check, Minus, Shield, Ticket } from "lucide-react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { isPaymentsConfigured } from "@/lib/stripe";
import { TRIP_PASS_PRICE_ID } from "@/lib/trip-pass";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { toast } from "sonner";
import type { TierType } from "@/components/ui/pricing-glass";

const PricingGlass = lazy(() =>
  import("@/components/ui/pricing-glass").then((m) => ({ default: m.PricingGlass })),
);

// Precios mensuales por plan — usados por las tarjetas y por la reanudación
// del checkout tras un registro iniciado desde esta página (?plan=…).
const PRICE_ID_MONTHLY: Record<"viajero" | "explorador", string> = {
  viajero: "price_1Ton51ClvzRH6emiNWNG9HXZ",
  explorador: "price_1Ton8WClvzRH6emiPx5gxrYj",
};

export const Route = createFileRoute("/pricing")({
  validateSearch: (search: Record<string, unknown>): { plan?: "viajero" | "explorador" } => ({
    plan: search.plan === "viajero" || search.plan === "explorador" ? search.plan : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Planes y precios – Itineraya" },
      {
        name: "description",
        content: "Elige el plan que mejor se adapta a tus viajes: Gratuito, Viajero o Explorador.",
      },
      { property: "og:title", content: "Planes y precios – Itineraya" },
      {
        property: "og:description",
        content: "Elige el plan que mejor se adapta a tus viajes.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const { openCheckout, closeCheckout, checkoutElement, isOpen } = useStripeCheckout();
  const { loading } = useSubscription();
  const { user } = useAuthSession();
  const authedUserId = user?.id ?? null;
  const [starting, setStarting] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!authedUserId) {
      setUserPlan(null);
      return;
    }
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", authedUserId)
      .maybeSingle()
      .then(({ data }) => {
        setUserPlan((data as { plan?: string } | null)?.plan ?? "free");
      });
  }, [authedUserId]);

  // Reanuda el checkout cuando el usuario vuelve autenticado con ?plan=…
  // (returnTo tras el signup iniciado desde esta misma página). Antes el
  // parámetro se guardaba pero nadie lo leía y la compra se perdía.
  const search = Route.useSearch();
  const navigate = useNavigate();
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!search.plan || !authedUserId || resumedRef.current) return;
    if (!isPaymentsConfigured()) return;
    resumedRef.current = true;
    const planId = search.plan;
    // Limpia el parámetro para que un refresh no reabra el checkout.
    navigate({ to: "/pricing", search: {}, replace: true });
    setStarting(planId);
    try {
      openCheckout({ priceId: PRICE_ID_MONTHLY[planId] });
    } finally {
      setStarting(null);
    }
  }, [search.plan, authedUserId, navigate, openCheckout]);

  const handleSelect = (planId: "free" | "viajero" | "explorador", priceId?: string) => {
    if (!priceId) {
      openAuthModal({ mode: "signup" });
      return;
    }
    if (!authedUserId) {
      openAuthModal({ mode: "signup", returnTo: `/pricing?plan=${planId}` });
      return;
    }
    if (!isPaymentsConfigured()) {
      toast.error(t("pricing.notConfigured"));
      return;
    }
    setStarting(planId);
    try {
      openCheckout({ priceId });
    } finally {
      setStarting(null);
    }
  };

  const handleBuyTripPass = () => {
    if (!authedUserId) {
      openAuthModal({ mode: "signup" });
      return;
    }
    if (!isPaymentsConfigured()) {
      toast.error(t("pricing.notConfigured"));
      return;
    }
    openCheckout({ priceId: TRIP_PASS_PRICE_ID, mode: "payment" });
  };

  const tiers: TierType[] = [
    {
      name: t("pricing.free.name"),
      priceMonthly: "0",
      priceAnnual: "0",
      description: t("pricing.free.tagline"),
      isCurrent: userPlan === "free",
      features: [
        t("pricing.free.f1"),
        t("pricing.free.f3"),
        t("pricing.free.f4"),
        t("pricing.free.f5"),
      ],
      ctaLabel: t("pricing.startFree"),
      onSelect: () => handleSelect("free", undefined),
    },
    {
      name: t("pricing.viajero.name"),
      priceMonthly: "7.99",
      priceAnnual: "5.99",
      description: t("pricing.viajero.tagline"),
      isPopular: true,
      isCurrent: userPlan === "viajero",
      features: [
        t("pricing.viajero.f1"),
        t("pricing.viajero.f3"),
        t("pricing.viajero.f4"),
        t("pricing.viajero.f5"),
        t("pricing.viajero.f6"),
      ],
      priceIdMonthly: PRICE_ID_MONTHLY.viajero,
      priceIdAnnual: "price_1Ton6DClvzRH6emiDhKYKjeb",
      ctaLabel: loading || starting === "viajero" ? "..." : t("pricing.choose"),
      onSelect: (priceId?: string) => handleSelect("viajero", priceId),
    },
    {
      name: t("pricing.explorador.name"),
      priceMonthly: "15.99",
      priceAnnual: "13.99",
      description: t("pricing.explorador.tagline"),
      isCurrent: userPlan === "explorador",
      features: [
        t("pricing.explorador.f1"),
        t("pricing.explorador.f2"),
        t("pricing.explorador.f3"),
        t("pricing.explorador.f4"),
      ],
      priceIdMonthly: PRICE_ID_MONTHLY.explorador,
      priceIdAnnual: "price_1Ton9LClvzRH6emisN4JF1b9",
      ctaLabel: loading || starting === "explorador" ? "..." : t("pricing.choose"),
      onSelect: (priceId?: string) => handleSelect("explorador", priceId),
    },
  ];

  return (
    <div className="min-h-dvh bg-white">
      <PaymentTestModeBanner />

      {/* Nav */}
      <div className="relative border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={authedUserId ? "/dashboard" : "/"}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {authedUserId ? t("pricing.dashboard") : t("pricing.back")}
          </Link>
          <BrandLogo size="md" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Pricing glass */}
      <main className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Suspense fallback={<div className="h-96 rounded-3xl bg-white/10 animate-pulse" />}>
          <PricingGlass
            title={t("pricing.title")}
            description={t("pricing.subtitle")}
            tiers={tiers}
          />
        </Suspense>

        {/* ── Pase de Viaje: opción discreta de pago único ── */}
        <TripPassCard onSelect={handleBuyTripPass} />

        {/* Trust signals */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          {[
            { labelKey: "pricing.trust1", icon: "✓" },
            { labelKey: "pricing.trust2", icon: "✓" },
            { labelKey: "pricing.trust3", icon: "🔒" },
          ].map((item) => (
            <span
              key={item.labelKey}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400"
            >
              <span>{item.icon}</span>
              {t(item.labelKey)}
            </span>
          ))}
        </div>

        {/* ── Comparison table ── */}
        <ComparisonTable />

        {/* ── 30-day guarantee ── */}
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-gray-100">
            <Shield className="h-8 w-8 text-[#0ea5e9]" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-[#0c1a2e]">
            {t("pricing.guaranteeTitle")}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">{t("pricing.guaranteeBody")}</p>
        </div>

        {/* ── Pricing FAQ ── */}
        <PricingFAQ />
      </main>

      {/* Embedded checkout modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={closeCheckout}
              className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-sky-700 shadow-md ring-1 ring-sky-100 hover:bg-sky-50"
              aria-label={t("pricing.close")}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto rounded-2xl">{checkoutElement}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Trip Pass: discreet one-time-payment option ─── */

function TripPassCard({ onSelect }: { onSelect: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-gray-100 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-100">
          <Ticket className="h-4 w-4 text-[#0ea5e9]" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{t("pricing.tripPass.eyebrow")}</p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-gray-100">
              {t("pricing.tripPass.tag")}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{t("pricing.tripPass.description")}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-black px-4 text-xs font-bold text-white transition hover:bg-slate-800"
      >
        {t("pricing.tripPass.cta")}
        <span className="text-white/50">·</span>
        {t("pricing.tripPass.price")}
      </button>
    </div>
  );
}

/* ─── Comparison table ─── */

// labelKey → i18n; los valores string también son claves para poder traducirse.
// La fila del copiloto refleja lo que el código hace de verdad: disponible en
// free con el límite diario de chat, ilimitado en los planes de pago.
const FEATURES: Array<{
  labelKey: string;
  free: boolean | string;
  viajero: boolean | string;
  explorador: boolean | string;
}> = [
  { labelKey: "pricing.cmp.ai", free: true, viajero: true, explorador: true },
  { labelKey: "pricing.cmp.images", free: true, viajero: true, explorador: true },
  { labelKey: "pricing.cmp.map", free: true, viajero: true, explorador: true },
  { labelKey: "pricing.cmp.share", free: true, viajero: true, explorador: true },
  {
    labelKey: "pricing.cmp.trips",
    free: "pricing.cmp.freeTrips",
    viajero: "pricing.cmp.viajeroTrips",
    explorador: "pricing.cmp.unlimited",
  },
  { labelKey: "pricing.cmp.assistant", free: false, viajero: true, explorador: true },
  { labelKey: "pricing.cmp.tripmates", free: false, viajero: true, explorador: true },
  { labelKey: "pricing.cmp.postcards", free: false, viajero: true, explorador: true },
  {
    labelKey: "pricing.cmp.copilot",
    free: "pricing.cmp.copilotFree",
    viajero: true,
    explorador: true,
  },
  { labelKey: "pricing.cmp.pdf", free: false, viajero: false, explorador: true },
  { labelKey: "pricing.cmp.support", free: false, viajero: false, explorador: true },
];

function FeatureCell({ val }: { val: boolean | string }) {
  const { t } = useTranslation();
  if (val === true) return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  if (val === false) return <Minus className="mx-auto h-4 w-4 text-slate-300" />;
  const text = val.startsWith("pricing.") ? t(val) : val;
  return <span className="text-xs font-semibold text-slate-700">{text}</span>;
}

function ComparisonTable() {
  const { t } = useTranslation();
  return (
    <div className="mt-20">
      <h2 className="mb-8 text-center font-display text-2xl font-bold text-[#0c1a2e]">
        {t("pricing.cmp.title")}
      </h2>
      <div className="overflow-x-auto rounded-2xl ring-1 ring-gray-100">
        <div className="min-w-[560px]">
          {/* Header */}
          <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            <div>{t("pricing.cmp.feature")}</div>
            <div className="text-center">{t("pricing.free.name")}</div>
            <div className="text-center text-[#0ea5e9]">{t("pricing.viajero.name")}</div>
            <div className="text-center text-[#0c1a2e]">{t("pricing.explorador.name")}</div>
          </div>
          {/* Rows */}
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`grid grid-cols-4 items-center px-4 py-3 text-sm ${
                i % 2 === 0 ? "bg-slate-50/60" : "bg-white"
              }`}
            >
              <div className="text-slate-600">{t(f.labelKey)}</div>
              <div className="text-center">
                <FeatureCell val={f.free} />
              </div>
              <div className="text-center">
                <FeatureCell val={f.viajero} />
              </div>
              <div className="text-center">
                <FeatureCell val={f.explorador} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing FAQ ─── */

const PRICING_FAQ_KEYS = [1, 2, 3, 4] as const;

function PricingFAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-20 mx-auto max-w-2xl">
      <h2 className="mb-8 text-center font-display text-2xl font-bold text-[#0c1a2e]">
        {t("pricing.faqTitle")}
      </h2>
      <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {PRICING_FAQ_KEYS.map((n, i) => (
          <div key={n}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
              aria-expanded={open === i}
            >
              <span className="text-sm font-semibold text-slate-800">{t(`pricing.faq.q${n}`)}</span>
              <span
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}
              >
                ＋
              </span>
            </button>
            {open === i && (
              <div className="border-t border-gray-100 bg-slate-50/60 px-5 py-4">
                <p className="text-sm leading-relaxed text-slate-600">{t(`pricing.faq.a${n}`)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
