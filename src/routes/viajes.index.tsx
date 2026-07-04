import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { SEO_DESTINATIONS } from "@/lib/seo-destinations";

// Índice de guías de destino (hub de interlinking para el SEO programático).

export const Route = createFileRoute("/viajes/")({
  head: () => {
    const url = "https://itineraya.com/viajes";
    return {
      meta: [
        { title: "Itinerarios de viaje día a día por destino | Itineraya" },
        {
          name: "description",
          content:
            "Guías de viaje con itinerario día a día hechas con IA y revisadas por viajeros: París, Tokio, Nueva York, Barcelona, Bali y más. Personaliza cualquiera gratis en un minuto.",
        },
        { property: "og:title", content: "Itinerarios de viaje día a día por destino | Itineraya" },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: DestinationsIndexPage,
});

function DestinationsIndexPage() {
  return (
    <div className="min-h-dvh bg-white">
      <Navbar />
      <header className="bg-gradient-to-b from-sky-950 to-sky-900 px-4 pb-14 pt-32 text-center sm:pt-36">
        <h1 className="mx-auto max-w-2xl font-display text-3xl font-bold text-white md:text-5xl">
          Itinerarios de viaje, día a día
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sky-200">
          Rutas completas con horarios reales y transporte entre paradas. Úsalas tal cual o
          personalízalas con IA en un minuto.
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SEO_DESTINATIONS.map((d) => (
            <Link
              key={d.slug}
              to="/viajes/$destino"
              params={{ destino: d.slug }}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={d.heroImage}
                  alt={`Itinerario de ${d.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="font-display text-lg font-bold drop-shadow">{d.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                    <CalendarIcon className="h-2.5 w-2.5" />
                    {d.nDays} días
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-semibold text-slate-700">Ver itinerario</span>
                <ArrowRight className="h-4 w-4 text-[#1E6B9A] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
