import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PopularDestinationsSection } from "@/components/landing/PopularDestinationsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { FAQSection } from "@/components/landing/FAQSection";

import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { MobileBottomBar, DesktopTopNav } from "@/components/DashboardSidebar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Itineraya – Viajes personalizados con IA" },
      {
        name: "description",
        content:
          "Itineraya genera itinerarios de viaje personalizados con inteligencia artificial. Planifica tu próxima aventura en segundos.",
      },
      { property: "og:title", content: "Itineraya – Viajes personalizados con IA" },
      {
        property: "og:description",
        content:
          "Itineraya genera itinerarios de viaje personalizados con inteligencia artificial. Planifica tu próxima aventura en segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Itineraya – Viajes personalizados con IA" },
      {
        name: "twitter:description",
        content: "Itineraya genera itinerarios de viaje personalizados con inteligencia artificial. Planifica tu próxima aventura en segundos.",
      },
      { name: "twitter:image", content: "https://itineraya.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://itineraya.com/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session?.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, s) => setIsLoggedIn(!!s?.user));
    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className={`min-h-screen bg-white ${isLoggedIn ? "pb-16 md:pb-0" : ""}`}>
      {mounted && isLoggedIn ? <DesktopTopNav /> : <Navbar />}
      <HeroSection />

      <PopularDestinationsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background: "radial-gradient(circle, oklch(0.856 0.041 239.082), transparent 70%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
            {t("finalCta.title")}
          </h2>
          <p className="mt-4 text-lg text-sky-600">{t("finalCta.subtitle")}</p>
          <div className="mt-8">
            {mounted && isLoggedIn ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl hover:shadow-[#1E6B9A]/35 hover:scale-[1.02]"
              >
                {t("hero.ctaMyTrips")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal({ mode: "signup" })}
                className="group inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl hover:shadow-[#1E6B9A]/35 hover:scale-[1.02]"
              >
                {t("hero.ctaStart")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <FAQSection />
      <FooterSection />
      {isLoggedIn && <MobileBottomBar />}
    </div>
  );
}
