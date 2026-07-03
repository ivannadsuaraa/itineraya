import { createFileRoute, Link } from "@tanstack/react-router";

import { ArrowLeft, X, Loader2, Check, Minus, Star, Shield } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
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
import type { TierType } from "@/components/ui/pricing-glass";

const PricingGlass = lazy(() =>
  import("@/components/ui/pricing-glass").then((m) => ({ default: m.PricingGlass })),
);

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
      priceIdMonthly: "price_1Ton51ClvzRH6emiNWNG9HXZ",
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
      priceIdMonthly: "price_1Ton8WClvzRH6emiPx5gxrYj",
      priceIdAnnual: "price_1Ton9LClvzRH6emisN4JF1b9",
      ctaLabel: loading || starting === "explorador" ? "..." : t("pricing.choose"),
      onSelect: (priceId?: string) => handleSelect("explorador", priceId),
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
        <Suspense fallback={<div className="h-96 rounded-3xl bg-white/10 animate-pulse" />}>
          <PricingGlass
            title={t("pricing.title")}
            description={t("pricing.subtitle")}
            tiers={tiers}
          />
        </Suspense>

        {/* Trust signals */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          {[
            { labelKey: "pricing.trust1", icon: "✓" },
            { labelKey: "pricing.trust2", icon: "✓" },
            { labelKey: "pricing.trust3", icon: "🔒" },
          ].map((item) => (
            <span key={item.labelKey} className="flex items-center gap-1.5 text-xs font-medium text-white/35">
              <span>{item.icon}</span>
              {t(item.labelKey)}
            </span>
          ))}
        </div>

        {/* ── Comparison table ── */}
        <ComparisonTable />

        {/* ── Testimonials ── */}
        <TestimonialsSection />

        {/* ── 30-day guarantee ── */}
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/15">
            <Shield className="h-8 w-8 text-sky-300" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-white">Garantía de 30 días</h3>
          <p className="mt-2 max-w-sm text-sm text-white/50">
            Si no estás satisfecho con Itineraya, te devolvemos el dinero sin preguntas en los primeros 30 días. Sin letra pequeña.
          </p>
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

/* ─── Comparison table ─── */

const FEATURES = [
  { label: "Itinerarios generados con IA",       free: true,  viajero: true,    explorador: true },
  { label: "Imágenes del destino",               free: true,  viajero: true,    explorador: true },
  { label: "Mapa interactivo",                   free: true,  viajero: true,    explorador: true },
  { label: "Compartir itinerario",               free: true,  viajero: true,    explorador: true },
  { label: "Número de viajes",                   free: "3",   viajero: "20",    explorador: "Ilimitados" },
  { label: "Asistente IA para editar",           free: false, viajero: true,    explorador: true },
  { label: "Compañeros de viaje (tripmates)",    free: false, viajero: true,    explorador: true },
  { label: "Descargar postales del itinerario",  free: false, viajero: true,    explorador: true },
  { label: "Copiloto en tiempo real",            free: false, viajero: false,   explorador: true },
  { label: "Exportar a PDF",                     free: false, viajero: false,   explorador: true },
  { label: "Soporte prioritario",                free: false, viajero: false,   explorador: true },
];

function FeatureCell({ val }: { val: boolean | string }) {
  if (val === true) return <Check className="mx-auto h-4 w-4 text-emerald-400" />;
  if (val === false) return <Minus className="mx-auto h-4 w-4 text-white/15" />;
  return <span className="text-xs font-semibold text-white/75">{val}</span>;
}

function ComparisonTable() {
  return (
    <div className="mt-20">
      <h2 className="mb-8 text-center font-display text-2xl font-bold text-white">¿Qué incluye cada plan?</h2>
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="grid grid-cols-4 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/40">
          <div>Función</div>
          <div className="text-center">Gratis</div>
          <div className="text-center text-sky-300">Viajero</div>
          <div className="text-center text-purple-300">Explorador</div>
        </div>
        {/* Rows */}
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={`grid grid-cols-4 items-center px-4 py-3 text-sm ${
              i % 2 === 0 ? "bg-white/3" : "bg-transparent"
            }`}
          >
            <div className="text-white/70">{f.label}</div>
            <div className="text-center"><FeatureCell val={f.free} /></div>
            <div className="text-center"><FeatureCell val={f.viajero} /></div>
            <div className="text-center"><FeatureCell val={f.explorador} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Testimonials ─── */

const TESTIMONIALS = [
  {
    name: "Marta G.",
    location: "Madrid",
    avatar: "MG",
    rating: 5,
    text: "Usé Itineraya para planificar mi viaje a Japón y me ahorró horas de investigación. El itinerario fue increíblemente detallado y adaptado a mis intereses. ¡100% recomendado!",
  },
  {
    name: "Carlos R.",
    location: "Barcelona",
    avatar: "CR",
    rating: 5,
    text: "Planifiqué un viaje en pareja a Bali en menos de 5 minutos. El asistente IA ajustó todo cuando le dije que prefería playas tranquilas. Perfecta experiencia.",
  },
  {
    name: "Laura M.",
    location: "Buenos Aires",
    avatar: "LM",
    rating: 5,
    text: "Como viajera frecuente siempre buscaba apps parecidas. Itineraya es la primera que realmente entiende mis preferencias. El mapa interactivo es una pasada.",
  },
  {
    name: "Álvaro T.",
    location: "Ciudad de México",
    avatar: "ÁT",
    rating: 4,
    text: "Muy intuitiva y rápida. Usé la versión gratuita para un fin de semana en Lisboa y el resultado superó mis expectativas. Ya me he suscrito al plan Viajero.",
  },
];

function TestimonialsSection() {
  return (
    <div className="mt-20">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Lo que dicen los viajeros</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">Miles de aventuras planificadas</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-2xl bg-white/6 p-5 ring-1 ring-white/10">
            <div className="mb-3 flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < t.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-white/20"}`}
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-white/65">"{t.text}"</p>
            <div className="mt-4 flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1E6B9A] text-xs font-bold text-white ring-1 ring-white/20">
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-[11px] text-white/40">{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing FAQ ─── */

const PRICING_FAQ = [
  {
    q: "¿Puedo cancelar mi suscripción en cualquier momento?",
    a: "Sí. Puedes cancelar desde tu perfil en cualquier momento. Seguirás teniendo acceso hasta el final del período facturado. Sin penalizaciones.",
  },
  {
    q: "¿Qué pasa si no estoy satisfecho?",
    a: "Ofrecemos 30 días de devolución sin preguntas. Si por cualquier motivo no te convence, te reembolsamos el 100% del importe pagado.",
  },
  {
    q: "¿El plan gratuito tiene límite de tiempo?",
    a: "No. El plan gratuito es permanente. Además, los nuevos usuarios disfrutan de 7 días del plan Viajero gratis para probarlo sin compromiso.",
  },
  {
    q: "¿Puedo cambiar de plan más adelante?",
    a: "Por supuesto. Puedes subir o bajar de plan cuando quieras desde tu perfil. El cambio se aplica en el siguiente ciclo de facturación.",
  },
];

function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-20 mx-auto max-w-2xl">
      <h2 className="mb-8 text-center font-display text-2xl font-bold text-white">Preguntas frecuentes sobre precios</h2>
      <div className="divide-y divide-white/8 rounded-2xl bg-white/5 ring-1 ring-white/10">
        {PRICING_FAQ.map((faq, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/4"
              aria-expanded={open === i}
            >
              <span className="text-sm font-semibold text-white/85">{faq.q}</span>
              <span className={`shrink-0 text-white/40 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}>＋</span>
            </button>
            {open === i && (
              <div className="border-t border-white/6 bg-white/3 px-5 py-4">
                <p className="text-sm leading-relaxed text-white/55">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
