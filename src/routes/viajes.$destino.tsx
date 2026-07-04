import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Calendar as CalendarIcon, Check, MapPin, Sparkles, Wand2 } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import {
  getSeoDestination,
  encodePrefill,
  SEO_DESTINATIONS,
  type SeoDestination,
} from "@/lib/seo-destinations";

// Landing SEO por destino (GROWTH_REPORT §2). Contenido en español a propósito:
// las keywords objetivo son en español; la variante EN irá bajo /en/travel/*.

export const Route = createFileRoute("/viajes/$destino")({
  loader: ({ params }) => {
    const dest = getSeoDestination(params.destino);
    if (!dest) throw notFound();
    return dest;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const d = loaderData;
    const url = `https://itineraya.com/viajes/${d.slug}`;
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: d.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Itineraya", item: "https://itineraya.com/" },
        { "@type": "ListItem", position: 2, name: "Viajes", item: "https://itineraya.com/viajes" },
        { "@type": "ListItem", position: 3, name: d.name, item: url },
      ],
    };
    const tripSchema = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: d.h1,
      description: d.metaDescription,
      touristType: d.tripTypes,
      itinerary: {
        "@type": "ItemList",
        numberOfItems: d.days.length,
        itemListElement: d.days.map((day, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: day.title,
        })),
      },
    };
    return {
      meta: [
        { title: d.title },
        { name: "description", content: d.metaDescription },
        { property: "og:title", content: d.title },
        { property: "og:description", content: d.metaDescription },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:image", content: d.heroImage },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqSchema) },
        { type: "application/ld+json", children: JSON.stringify(tripSchema) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) },
      ],
    };
  },
  notFoundComponent: DestinationNotFound,
  component: DestinationPage,
});

function DestinationNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-950 to-sky-900 px-4 text-center">
      <h1 className="font-display text-2xl font-bold text-white">Destino no encontrado</h1>
      <p className="mt-2 max-w-sm text-sky-300">
        Todavía no tenemos guía para este destino, pero puedes generar tu itinerario con IA en un
        minuto.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SEO_DESTINATIONS.map((d) => (
          <Link
            key={d.slug}
            to="/viajes/$destino"
            params={{ destino: d.slug }}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            {d.name}
          </Link>
        ))}
      </div>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-sky-900 shadow-lg hover:bg-sky-50"
      >
        Crear mi itinerario <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function DestinationPage() {
  const d = Route.useLoaderData();
  const navigate = useNavigate();

  const goGenerate = () => {
    const prefill = encodePrefill({
      destination: d.prefillDestination,
      tripTypes: d.tripTypes,
      nDays: d.nDays,
    });
    navigate({ to: "/onboarding", search: { prefill } });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <header className="relative h-[420px] w-full overflow-hidden md:h-[480px]">
        <img
          src={d.heroImage}
          alt={`Itinerario de viaje a ${d.name}`}
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sky-950/90 via-sky-950/40 to-sky-950/30" />
        <div className="absolute inset-x-0 bottom-0 p-6 pb-10 md:p-10">
          <div className="mx-auto max-w-4xl">
            <nav aria-label="breadcrumb" className="text-xs text-sky-200">
              <Link to="/" className="hover:underline">
                Itineraya
              </Link>
              <span className="mx-1.5">/</span>
              <Link to="/viajes" className="hover:underline">
                Viajes
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-white">{d.name}</span>
            </nav>
            <h1 className="mt-3 font-display text-3xl font-bold text-white drop-shadow md:text-5xl">
              {d.h1}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                <CalendarIcon className="h-3.5 w-3.5" />
                {d.nDays} días
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5" />
                {d.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Intro + CTA principal */}
        <p className="text-lg leading-relaxed text-slate-700">{d.intro}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={goGenerate}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition hover:shadow-xl"
          >
            <Wand2 className="h-4 w-4" />
            Genera tu itinerario de {d.name} personalizado — gratis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <Link
            to="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-50 px-6 py-3.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-200 transition hover:bg-sky-100"
          >
            Ver itinerarios reales de viajeros
          </Link>
        </div>

        {/* Itinerario día a día */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-sky-900">
            El itinerario, día a día
          </h2>
          <div className="mt-6 space-y-5">
            {d.days.map((day, i) => (
              <article
                key={i}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-slate-50 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-900 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
                    {day.title}
                  </h3>
                </div>
                <ul className="space-y-2.5 p-5">
                  {day.items.map((item, j) => (
                    <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1E6B9A]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Bloque personalización */}
        <section className="mt-12 rounded-3xl bg-gradient-to-br from-sky-950 to-sky-900 p-8 text-center md:p-10">
          <Sparkles className="mx-auto h-8 w-8 text-sky-300" />
          <h2 className="mt-3 font-display text-2xl font-bold text-white">
            Este plan es un punto de partida
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sky-200">
            Dinos tus fechas, tu presupuesto y con quién viajas: la IA de Itineraya monta tu versión
            de {d.name} en unos 40 segundos, con horarios reales, transporte entre paradas y mapa.
          </p>
          <button
            type="button"
            onClick={goGenerate}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-sky-900 shadow-lg transition hover:bg-sky-50"
          >
            Personalizar mi viaje a {d.name}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        {/* Datos prácticos */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-sky-900">Datos prácticos</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {d.practical.map((p, i) => (
              <li
                key={i}
                className="flex gap-2.5 rounded-2xl bg-sky-50/60 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-sky-100"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1E6B9A]" />
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-sky-900">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            {d.faq.map((f, i) => (
              <details key={i} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-800">
                  {f.q}
                  <span className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-45">
                    ＋
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Destinos relacionados */}
        <RelatedDestinations current={d} />
      </main>

      <FooterSection />
    </div>
  );
}

function RelatedDestinations({ current }: { current: SeoDestination }) {
  const related = current.related
    .map((slug) => getSeoDestination(slug))
    .filter((x): x is SeoDestination => Boolean(x));
  if (related.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold text-sky-900">Otros destinos</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {related.map((r) => (
          <Link
            key={r.slug}
            to="/viajes/$destino"
            params={{ destino: r.slug }}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={r.heroImage}
                alt={`Itinerario de ${r.name}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="font-display text-base font-bold drop-shadow">{r.name}</div>
                <div className="text-[11px] text-white/80">{r.nDays} días</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
