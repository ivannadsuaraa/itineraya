import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Sparkles,
  ArrowRight,
  Calendar as CalendarIcon,
  Wand2,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Map as MapIcon,
} from "lucide-react";
import { getDiscoverableTrip } from "@/lib/explore.functions";
import type { PublicTripDay, PublicTripActivity } from "@/lib/share.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthStatus } from "@/lib/use-auth-status";
import { PaywallGate } from "@/components/trip/PaywallGate";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

const TripMap = lazy(() =>
  import("@/components/trip/TripMap").then((m) => ({ default: m.TripMap })),
);

export const Route = createFileRoute("/explore/$slug")({
  loader: async ({ params }) => {
    const trip = await getDiscoverableTrip({ data: { slug: params.slug } });
    return trip; // may be null — handled in component
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Itineraya — Itinerario no disponible" }, { name: "robots", content: "noindex" }] };
    const dest = loaderData.destination;
    const nDays = loaderData.days?.length ?? 0;
    const title = nDays
      ? `${nDays} días en ${dest} — Itinerario | Itineraya`
      : `Itinerario en ${dest} | Itineraya`;
    const desc =
      loaderData.summary ??
      `Itinerario inspirador para viajar a ${dest}. Descúbrelo en Itineraya y crea el tuyo en segundos.`;
    const url = `https://itineraya.com/explore/${params.slug}`;
    const image = loaderData.hero_image_url ?? "https://itineraya.com/itineraya-logo.png";
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
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <FallbackPage
      title="Itinerario no encontrado"
      message="Este viaje ya no está publicado o el enlace no es válido."
    />
  ),
  errorComponent: () => (
    <FallbackPage
      title="Itinerario no disponible"
      message="No pudimos cargar este viaje. Inténtalo de nuevo más tarde."
    />
  ),
  component: DiscoverableTripPage,
});

function FallbackPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-sky-900">{title}</h1>
        <p className="mt-2 text-sky-700">{message}</p>
        <Link
          to="/explore"
          className="mt-6 inline-block rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Ver otros viajes
        </Link>
      </div>
    </div>
  );
}

function DiscoverableTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  const trip = Route.useLoaderData();
  const { authed, checked } = useAuthStatus();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"itinerary" | "map">("itinerary");

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6 text-center">
        <div className="max-w-md rounded-3xl bg-white/85 p-8 shadow-xl ring-1 ring-white/60 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-3xl">✈️</div>
          <h1 className="mt-4 font-display text-2xl font-bold text-sky-900">Este itinerario ya no está disponible</h1>
          <p className="mt-2 text-sky-700">Quizá el autor lo despublicó o el enlace caducó. ¡Pero puedes crear el tuyo en segundos!</p>
          <Link to="/explore" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#15577E]">
            Descubrir otros viajes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const days = trip.days ?? [];
  const nDays = days.length;
  const splitIdx = Math.max(1, Math.ceil(nDays / 2));
  const visibleDays = checked && !authed ? days.slice(0, splitIdx) : days;
  const gatedDays = checked && !authed ? days.slice(splitIdx) : [];

  const requireAuth = (e?: MouseEvent) => {
    if (!checked || authed) return true;
    e?.preventDefault();
    openAuthModal({ mode: "login" });
    return false;
  };

  const handleRemix = (e?: MouseEvent) => {
    if (!requireAuth(e)) return;
    const payload = {
      destination: trip.destination,
      tripTypes: trip.trip_types ?? [],
      nDays: nDays || undefined,
    };
    const encoded =
      typeof window === "undefined"
        ? ""
        : btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  const handleSave = async (e?: MouseEvent) => {
    if (!requireAuth(e)) return;
    if (saving || saved) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        toast.info(t("publicTrip.saveLoginPrompt"));
        openAuthModal({ mode: "login" });
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

  const switchView = (target: "itinerary" | "map", e?: MouseEvent) => {
    if (target === "map" && !requireAuth(e)) return;
    setView(target);
  };

  const renderDay = (day: PublicTripDay) => (
    <article key={day.day} className="overflow-hidden rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60">
      {day.image_url ? (
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
      ) : (
        <div className="p-6 pb-2">
          <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E6B9A]">
            {t("trip.dayLabel", { n: day.day })}
          </span>
          <h3 className="mt-2 font-display text-2xl font-bold text-sky-900">{day.title}</h3>
          {day.subtitle && <p className="text-sm text-sky-600">{day.subtitle}</p>}
        </div>
      )}
      <ul className="space-y-3 p-5 md:p-6">
        {day.activities.map((a: PublicTripActivity, i: number) => (
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
                onClick={(e) => requireAuth(e)}
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
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="sticky top-0 z-20 border-b border-sky-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/explore" className="flex items-center gap-2">
            <img src={"/itineraya-logo.png"} alt="Itineraya" className="h-7 w-auto" />
          </Link>
          <button
            onClick={handleRemix}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-4 py-2 text-xs font-bold text-white shadow hover:shadow-lg sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("explore.viralCta")}
          </button>
        </div>
      </div>

      <div className="relative h-72 w-full overflow-hidden md:h-96">
        {trip.hero_image_url ? (
          <img
            src={trip.hero_image_url}
            alt={trip.destination}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="mx-auto max-w-5xl text-white">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
              {t("explore.heroEyebrow")}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold drop-shadow md:text-5xl">
              {nDays
                ? t("explore.cardTitle", { days: nDays, destination: trip.destination })
                : trip.destination}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm opacity-95">
              {nDays > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {t("explore.days", { count: nDays })}
                </span>
              )}
              {trip.trip_style && (
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                  {trip.trip_style}
                </span>
              )}
              {trip.budget && (
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                  {trip.budget}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <button
            onClick={handleRemix}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition hover:shadow-xl sm:order-2"
          >
            <Wand2 className="h-4 w-4" />
            {t("explore.viralCta")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/85 px-5 py-3.5 text-sm font-semibold text-sky-900 shadow ring-1 ring-sky-200 backdrop-blur-md transition hover:bg-white disabled:opacity-70 sm:order-3"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {saved ? t("publicTrip.savedLabel") : t("publicTrip.save")}
          </button>
          <div className="inline-flex items-center justify-center gap-1 rounded-2xl bg-white/70 p-1 ring-1 ring-sky-200 backdrop-blur sm:order-1">
            <button
              onClick={(e) => switchView("itinerary", e)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                view === "itinerary" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {t("publicTrip.view")}
            </button>
            <button
              onClick={(e) => switchView("map", e)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                view === "map" ? "bg-[#1E6B9A] text-white shadow" : "text-sky-700"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              {t("trip.viewMap")}
            </button>
          </div>
        </div>

        {trip.summary && view === "itinerary" && (
          <div className="rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-white/60 backdrop-blur-xl md:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-sky-900">
              <Sparkles className="h-5 w-5 text-[#1E6B9A]" />
              {t("publicTrip.summary")}
            </h2>
            <p className="mt-3 text-sky-800">{trip.summary}</p>
          </div>
        )}

        {view === "map" ? (
          <Suspense
            fallback={
              <div className="flex h-96 items-center justify-center rounded-3xl bg-white/80">
                <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              </div>
            }
          >
            <TripMap destination={trip.destination} days={days} tripId={trip.slug} />
          </Suspense>
        ) : (
          <>
            <div className="mt-8 space-y-6">{visibleDays.map(renderDay)}</div>
            {gatedDays.length > 0 && (
              <div className="mt-6">
                <PaywallGate>
                  <div className="space-y-6">{gatedDays.map(renderDay)}</div>
                </PaywallGate>
              </div>
            )}
          </>
        )}

        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] p-8 text-center text-white shadow-2xl md:p-12">
          <Sparkles className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            {t("publicTrip.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            {t("publicTrip.ctaSubtitle")}
          </p>
          <button
            type="button"
            onClick={() => openAuthModal({ mode: "login" })}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-[#1E6B9A] shadow-lg transition hover:bg-sky-50"
          >
            {t("publicTrip.cta")}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs text-white/70">{t("publicTrip.ctaFooter")}</p>
        </div>

        <footer className="mt-10 flex items-center justify-center gap-2 pb-6 text-xs text-sky-600">
          <img src={"/itineraya-logo.png"} alt="Itineraya" className="h-4 w-auto opacity-80" />
          <span>itineraya.com</span>
        </footer>
      </div>
    </div>
  );
}
