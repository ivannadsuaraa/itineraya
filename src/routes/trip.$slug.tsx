import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, type MouseEvent } from "react";
import { MapPin, Sparkles, ArrowRight, Calendar as CalendarIcon, Wand2, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { getPublicTrip, type PublicTripDay } from "@/lib/share.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStatus } from "@/lib/use-auth-status";
import { PaywallGate } from "@/components/trip/PaywallGate";
import logoFull from "@/assets/itineraya-logo.png.asset.json";

export const Route = createFileRoute("/trip/$slug")({
  loader: async ({ params }) => {
    const trip = await getPublicTrip({ data: { slug: params.slug } });
    return trip; // may be null — handled in component with a friendly screen
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      const url = `https://itineraya.com/trip/${params.slug}`;
      return {
        meta: [
          { title: "Itineraya — Itinerario no disponible" },
          { name: "robots", content: "noindex" },
          { property: "og:title", content: "Itineraya" },
          { property: "og:url", content: url },
        ],
      };
    }
    const dest = loaderData.destination;
    const title = `Itineraya — ${dest} Travel Itinerary`;
    const desc = loaderData.summary ?? `Personalized AI travel itinerary for ${dest}`;
    const url = `https://itineraya.com/trip/${params.slug}`;
    // og:image priority: 1) trip hero, 2) Unsplash destination photo, 3) official Itineraya logo.
    // Append slug as cache-buster so social platforms refetch per-trip previews.
    const unsplashFallback = dest
      ? `https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(dest)},travel&sig=${encodeURIComponent(params.slug)}`
      : "https://itineraya.com/itineraya-logo.png";
    const image = loaderData.hero_image_url ?? unsplashFallback;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: `${dest} — Itineraya` },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-sky-900">Itinerario no encontrado</h1>
        <p className="mt-2 text-sky-700">El enlace no es válido o ha expirado.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white">
          Volver a Itineraya
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-sky-900">Este itinerario no está disponible</h1>
        <p className="mt-2 text-sky-700">El enlace no es válido, ha expirado o ya no es público.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white">
          Volver a Itineraya
        </Link>
      </div>
    </div>
  ),
  component: PublicTripPage,
});

function PublicTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trip = Route.useLoaderData();
  const days = (trip.days ?? []) as PublicTripDay[];
  const nDays = days.length;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Infer canonical trip-type ids from saved itinerary categories (best-effort).
  const inferTripTypes = (): string[] => {
    const cats = new Set<string>();
    for (const d of days) for (const a of d.activities) if (a.category) cats.add(a.category.toLowerCase());
    const map: Record<string, string> = {
      beach: "beach", playa: "beach",
      party: "party", fiesta: "party", nightlife: "party",
      cultural: "cultural", culture: "cultural", museum: "cultural",
      food: "food", gastronomy: "food", restaurant: "food",
      relax: "relax", wellness: "relax", spa: "relax",
      nature: "nature", outdoor: "nature", hiking: "nature",
      romantic: "romantic", romance: "romantic",
      family: "family", kids: "family",
      adventure: "adventure", sport: "adventure",
    };
    const out = new Set<string>();
    for (const c of cats) {
      const key = Object.keys(map).find((k) => c.includes(k));
      if (key) out.add(map[key]);
    }
    return Array.from(out);
  };

  const handleRemix = () => {
    const payload = {
      destination: trip.destination,
      tripTypes: inferTripTypes(),
      nDays: nDays || undefined,
    };
    const encoded =
      typeof window === "undefined"
        ? ""
        : btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.info(t("publicTrip.saveLoginPrompt"));
        navigate({ to: "/auth" });
        return;
      }
      const { error } = await supabase
        .from("saved_inspirations")
        .upsert(
          {
            user_id: u.user.id,
            slug: trip.slug,
            destination: trip.destination,
            hero_image_url: trip.hero_image_url,
            summary: trip.summary,
            n_days: nDays || null,
          },
          { onConflict: "user_id,slug" },
        );
      if (error) throw error;
      setSaved(true);
      toast.success(t("publicTrip.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("publicTrip.saveError"));
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-sky-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFull.url} alt="Itineraya" className="h-7 w-auto" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1E6B9A] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#15577E] sm:text-sm"
          >
            {t("publicTrip.ctaShort")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
        {trip.hero_image_url ? (
          <img src={trip.hero_image_url} alt={trip.destination} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="mx-auto max-w-4xl text-white">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
              {t("publicTrip.eyebrow")}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold drop-shadow md:text-5xl">
              {trip.destination}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm opacity-90">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("publicTrip.duration", { count: nDays })}
              </span>
              {trip.start_date && trip.end_date && (
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                  {trip.start_date} → {trip.end_date}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        {/* Remix actions */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleRemix}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition hover:shadow-xl sm:order-2"
          >
            <Wand2 className="h-4 w-4" />
            {t("publicTrip.remix")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/85 px-5 py-3.5 text-sm font-semibold text-sky-900 shadow ring-1 ring-sky-200 backdrop-blur-md transition hover:bg-white disabled:opacity-70 sm:order-3"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? t("publicTrip.savedLabel") : t("publicTrip.save")}
          </button>
          <a
            href="#itinerary"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/70 px-5 py-3.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-200 backdrop-blur-md transition hover:bg-white sm:order-1"
          >
            <CalendarIcon className="h-4 w-4" />
            {t("publicTrip.view")}
          </a>
        </div>

        <div id="itinerary" />

        {trip.summary && (
          <div className="rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-white/60 backdrop-blur-xl md:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-sky-900">
              <Sparkles className="h-5 w-5 text-[#1E6B9A]" />
              {t("publicTrip.summary")}
            </h2>
            <p className="mt-3 text-sky-800">{trip.summary}</p>
          </div>
        )}

        {/* Days */}
        <div className="mt-8 space-y-6">
          {days.map((day) => (
            <article key={day.day} className="overflow-hidden rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60">
              {day.image_url && (
                <div className="relative h-48 w-full overflow-hidden md:h-64">
                  <img src={day.image_url} alt={day.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <span className="inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                      {t("trip.dayLabel", { n: day.day })}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-bold drop-shadow">{day.title}</h3>
                    {day.subtitle && <p className="text-sm opacity-90">{day.subtitle}</p>}
                  </div>
                </div>
              )}
              {!day.image_url && (
                <div className="p-6 pb-2">
                  <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E6B9A]">
                    {t("trip.dayLabel", { n: day.day })}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold text-sky-900">{day.title}</h3>
                  {day.subtitle && <p className="text-sm text-sky-600">{day.subtitle}</p>}
                </div>
              )}

              <ul className="space-y-3 p-5 md:p-6">
                {day.activities.map((a, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/40 p-3">
                    <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#1E6B9A] text-white">
                      <CalendarIcon className="h-3 w-3 opacity-70" />
                      <span className="mt-0.5 text-xs font-bold leading-none">{a.time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none">{a.emoji ?? "📍"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sky-900">{a.title}</div>
                          {a.place && (
                            <div className="truncate text-xs font-medium text-sky-700/90">{a.place}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-sky-700">{a.description}</div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((a.place || a.title) + ", " + trip.destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-200 hover:bg-sky-50"
                      >
                        <MapPin className="h-3 w-3" />
                        {t("trip.maps")}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] p-8 text-center text-white shadow-2xl md:p-12">
          <Sparkles className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">{t("publicTrip.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">{t("publicTrip.ctaSubtitle")}</p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-[#1E6B9A] shadow-lg transition hover:bg-sky-50"
          >
            {t("publicTrip.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-white/70">{t("publicTrip.ctaFooter")}</p>
        </div>

        <footer className="mt-10 flex items-center justify-center gap-2 pb-6 text-xs text-sky-600">
          <img src={logoFull.url} alt="Itineraya" className="h-4 w-auto opacity-80" />
          <span>itineraya.com</span>
        </footer>
      </div>
    </div>
  );
}
