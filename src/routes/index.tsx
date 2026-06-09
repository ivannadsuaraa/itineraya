import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Itineraya u2013 Viajes personalizados con IA" },
      { name: "description", content: "Itineraya genera itinerarios de viaje personalizados con inteligencia artificial. Planifica tu pru00f3xima aventura en segundos." },
      { property: "og:title", content: "Itineraya u2013 Viajes personalizados con IA" },
      { property: "og:description", content: "Itineraya genera itinerarios de viaje personalizados con inteligencia artificial. Planifica tu pru00f3xima aventura en segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, oklch(0.856 0.041 239.082), transparent 70%)" }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
            Listo para tu pru00f3ximo viaje?
          </h2>
          <p className="mt-4 text-lg text-sky-600">
            Unu00eate a miles de viajeros que ya planifican con Itineraya. Tu pru00f3xima aventura empieza con un click.
          </p>
          <div className="mt-8">
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-full bg-sky-700 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-700/20 transition-all hover:bg-sky-800 hover:shadow-xl hover:shadow-sky-700/30"
            >
              Empieza gratis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </section>

      <FooterSection />
    </div>
  );
}
