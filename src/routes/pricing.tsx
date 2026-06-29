import { createFileRoute, Link } from "@tanstack/react-router";

import { Check, ArrowLeft, Sparkles, BadgeCheck, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { isPaymentsConfigured } from "@/lib/stripe";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Planes y precios – Itineraya" },
      {
        name: "description",
        content:
          "Elige el plan que mejor se adapta a tus viajes: Gratuito, Viajero o Explorador.",
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

type Plan = {
  id: "free" | "viajero" | "explorador";
  name: string;
  tagline: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  priceId?: "viajero_yearly" | "explorador_yearly";
  highlighted?: boolean;
};

function PricingPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "es" ? "es-ES" : i18n.language;
  const plans: Plan[] = [
    {
      id: "free",
      name: t("pricing.free.name"),
      tagline: t("pricing.free.tagline"),
      price: "0 €",
      period: t("pricing.free.period"),
      features: [
        t("pricing.free.f1"),
        t("pricing.free.f3"),
        t("pricing.free.f4"),
        t("pricing.free.f5"),
      ],

      cta: t("pricing.startFree"),
    },
    {
      id: "viajero",
      name: t("pricing.viajero.name"),
      tagline: t("pricing.viajero.tagline"),
      price: "9,99 €",
      period: t("pricing.perYear"),
      features: [
        t("pricing.viajero.f1"),
        t("pricing.viajero.f3"),
        t("pricing.viajero.f4"),
        t("pricing.viajero.f5"),
        t("pricing.viajero.f6"),
      ],

      cta: t("pricing.choose"),
      priceId: "viajero_yearly",
      highlighted: true,
    },
    {
      id: "explorador",
      name: t("pricing.explorador.name"),
      tagline: t("pricing.explorador.tagline"),
      price: "19,99 €",
      period: t("pricing.perYear"),
      features: [
        t("pricing.explorador.f1"),
        t("pricing.explorador.f2"),
        t("pricing.explorador.f3"),
        t("pricing.explorador.f4"),
      ],
      cta: t("pricing.choose"),
      priceId: "explorador_yearly",
    },
  ];
  const { openAuthModal } = useAuthModal();
  const { openCheckout, closeCheckout, checkoutElement, isOpen } = useStripeCheckout();
  const { subscription, isActive, priceId: currentPriceId, loading } = useSubscription();
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthedUserId(data.user?.id ?? null));
  }, []);

  const planActiveFor = (plan: Plan): boolean => {
    if (!isActive) return plan.id === "free" && !!authedUserId;
    if (plan.id === "free") return false;
    return currentPriceId === plan.priceId;
  };

  const handleSelect = (plan: Plan) => {
    if (!plan.priceId) {
      openAuthModal({ mode: "signup" });
      return;
    }
    if (!authedUserId) {
      openAuthModal({ mode: "signup", returnTo: `/pricing?plan=${plan.id}` });
      return;
    }
    if (!isPaymentsConfigured()) {
      toast.error("Los pagos aún no están configurados");
      return;
    }
    setStarting(plan.id);
    try {
      openCheckout({ priceId: plan.priceId });
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] pb-20">
      <PaymentTestModeBanner />
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }}
        />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-5 sm:py-5">
        <Link
          to={authedUserId ? "/dashboard" : "/"}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-xs font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {authedUserId ? "Dashboard" : "Inicio"}
        </Link>
        <BrandLogo size="md" />
      </header>

      <main className="relative mx-auto max-w-6xl px-4 sm:px-5">
        <div
          
          
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-[#1E6B9A]">
            Planes
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-sky-900 md:text-5xl">
            Elige cómo viajar
          </h1>
          <p className="mt-3 text-sky-700">
            Empieza gratis. Sube de plan cuando quieras más itinerarios, IA y herramientas avanzadas.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((plan, i) => {
            const current = planActiveFor(plan);
            const isStarting = starting === plan.id;
            return (
              <div
                key={plan.id}
                
                
                
                className="relative flex"
              >
                {plan.highlighted && !current && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#1E6B9A] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#1E6B9A]/30">
                      <Sparkles className="h-3 w-3" />
                      Más popular
                    </div>
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30">
                      <BadgeCheck className="h-3 w-3" />
                      Tu plan actual
                    </div>
                  </div>
                )}
                <div
                  className={`flex w-full flex-col rounded-3xl p-5 backdrop-blur-xl ring-1 transition-all sm:p-7 ${
                    current
                      ? "bg-white shadow-2xl shadow-emerald-500/20 ring-emerald-400/40 md:scale-[1.03]"
                      : plan.highlighted
                        ? "bg-white shadow-2xl shadow-[#1E6B9A]/25 ring-[#1E6B9A]/30 md:scale-[1.03]"
                        : "bg-white/80 shadow-lg ring-white/60"
                  }`}
                >
                  <div>
                    <h2 className="font-display text-xl font-bold text-sky-900">{plan.name}</h2>
                    <p className="mt-1 text-sm text-sky-600">{plan.tagline}</p>
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold text-sky-900">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-sm font-medium text-sky-600">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-sky-800">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            current
                              ? "bg-emerald-500 text-white"
                              : plan.highlighted
                                ? "bg-[#1E6B9A] text-white"
                                : "bg-sky-100 text-[#1E6B9A]"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {current ? (
                    <div className="mt-7 rounded-full bg-emerald-50 px-5 py-3 text-center text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
                      Activo
                      {subscription?.current_period_end && plan.id !== "free" && (
                        <span className="ml-1 font-normal text-emerald-600">
                          · renueva el{" "}
                          {new Date(subscription.current_period_end).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelect(plan)}
                      disabled={loading || isStarting}
                      className={`mt-7 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-sm font-bold transition-all disabled:opacity-60 ${
                        plan.highlighted
                          ? "bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/25 hover:bg-[#15577E] hover:shadow-xl"
                          : "bg-sky-50 text-[#1E6B9A] hover:bg-sky-100"
                      }`}
                    >
                      {isStarting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {plan.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Embedded checkout modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={closeCheckout}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-700 shadow-md ring-1 ring-sky-100 hover:bg-sky-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto rounded-2xl">
              {checkoutElement}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
