import { createFileRoute, Link } from "@tanstack/react-router";

import { ArrowLeft, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { isPaymentsConfigured } from "@/lib/stripe";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { toast } from "sonner";
import { PricingGlass, type TierType } from "@/components/ui/pricing-glass";

export const Route = createFileRoute("/pricing")({
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
  const { subscription, loading } = useSubscription();
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

  const handleSelect = (planId: "free" | "viajero" | "explorador", priceId?: "viajero_yearly" | "explorador_yearly") => {
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
      ctaLabel: loading || starting === "viajero" ? "..." : t("pricing.choose"),
      onSelect: () => handleSelect("viajero", "viajero_yearly"),
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
      ctaLabel: loading || starting === "explorador" ? "..." : t("pricing.choose"),
      onSelect: () => handleSelect("explorador", "explorador_yearly"),
    },
  ];

  return (
    <div className="min-h-dvh bg-sky-950">
      <PaymentTestModeBanner />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-700/20 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-72 w-96 rounded-full bg-[#1E6B9A]/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-800/15 blur-3xl" />
      </div>

      {/* Nav */}
      <div className="relative border-b border-white/8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to={authedUserId ? "/dashboard" : "/"}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/8 px-3 text-xs font-semibold text-white/75 backdrop-blur-md transition hover:bg-white/14 hover:text-white sm:text-sm"
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
        <PricingGlass
          title={t("pricing.title")}
          description={t("pricing.subtitle")}
          tiers={tiers}
        />

        {/* Trust signals */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          {[
            { label: "Sin permanencia", icon: "✓" },
            { label: "Cancela cuando quieras", icon: "✓" },
            { label: "Pago seguro con Stripe", icon: "🔒" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-white/35">
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </main>

      {/* Embedded checkout modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={closeCheckout}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-700 shadow-md ring-1 ring-sky-100 hover:bg-sky-50"
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
