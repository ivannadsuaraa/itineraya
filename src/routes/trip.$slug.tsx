import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, type MouseEvent } from "react";
import {
  MapPin,
  Sparkles,
  ArrowRight,
  Calendar as CalendarIcon,
  Wand2,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import { getPublicTrip, type PublicTripDay } from "@/lib/share.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaywallGate } from "@/components/trip/PaywallGate";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useAuthStatus } from "@/lib/use-auth-status";

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
    // og:image priority: 1) trip hero, 2) official Itineraya logo.
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
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: PublicTripUnavailable,
  errorComponent: PublicTripUnavailable,
  component: PublicTripPage,
});

function PublicTripUnavailable() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6 text-center">
      <div className="max-w-md rounded-3xl bg-white/85 p-8 shadow-xl ring-1 ring-white/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-3xl">
          ✈️
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-sky-900">
          {t("publicTrip.goneTitle")}
        </h1>
        <p className="mt-2 text-sky-700">{t("publicTrip.goneBody")}</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#15577E]"
        >
          {t("publicTrip.goneCta")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function PublicTripPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  const trip = Route.useLoaderData();
  const { authed, checked } = useAuthStatus();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Friendly fallback when the trip no longer exists, was unpublished or never existed.
  if (!trip) return <PublicTripUnavailable />;

  const days = (trip.days ?? []) as PublicTripDay[];
  const nDays = days.length;

  // Show roughly half the days un-gated; gate the rest behind sign-up.
  const splitIdx = Math.max(1, Math.ceil(nDays / 2));
  const visibleDays = checked && !authed ? days.slice(0, splitIdx) : days;
  const gatedDays = checked && !authed ? days.slice(splitIdx) : [];

  // Anything the visitor tries to do while logged-out funnels to /auth.
  const requireAuth = (e?: MouseEvent) => {
    if (!checked || authed) return true;
    e?.preventDefault();
    openAuthModal({ mode: "login" });
    return false;
  };

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

  const handleRemix = (e?: MouseEvent) => {
    if (!requireAuth(e)) return;
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

  // Real calendar date for each day when the trip has dates.
  const dayDate = (dayIndex: number): string | null => {
    if (!trip.start_date) return null;
    const base = new Date(trip.start_date);
    if (isNaN(base.getTime())) return null;
    const d = new Date(base.getTime() + dayIndex * 86400000);
    return d.toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-sky-100/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/itineraya-mark.png" alt="Itineraya" className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => openAuthModal({ mode: "login" })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#1E6B9A] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[#15577E] sm:text-sm"
          >
            {t("publicTrip.ctaShort")}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden md:h-96">
        <img
          src={trip.hero_image_url || "/images/hero-bg.jpg"}
          alt={trip.destination}
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
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

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        {/* Actions */}
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
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <BookmarkCheck className="bookmark-filled h-4 w-4 fill-[#1E6B9A]/20 text-[#1E6B9A]" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
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

        {/* Full-fidelity itinerary — same visual language as the owner's view,
            so the shared page sells the product instead of a stripped-down list. */}
        <div className="mt-8 space-y-6">
          {visibleDays.map((day, i) => (
            <PublicDayCard key={day.day} day={day} date={dayDate(i)} />
          ))}
          {gatedDays.length > 0 && (
            <PaywallGate>
              <div className="space-y-6">
                {gatedDays.map((day, i) => (
                  <PublicDayCard key={day.day} day={day} date={dayDate(splitIdx + i)} />
                ))}
              </div>
            </PaywallGate>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] p-8 text-center text-white shadow-2xl md:p-12">
          <Sparkles className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            {t("publicTrip.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">{t("publicTrip.ctaSubtitle")}</p>
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
          <img src="/itineraya-wordmark.png" alt="Itineraya" className="h-4 w-auto opacity-70" />
          <span>itineraya.com</span>
        </footer>
      </div>
    </div>
  );
}

function PublicDayCard({ day, date }: { day: PublicTripDay; date: string | null }) {
  const { t } = useTranslation();
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100/70">
      {/* Day header — photo when available, brand gradient otherwise */}
      {day.image_url ? (
        <div className="relative aspect-[16/7] w-full overflow-hidden">
          <img
            src={day.image_url}
            alt={day.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              {t("trip.dayLabel", { n: day.day })}
              {date ? ` · ${date}` : ""}
            </span>
            <h3 className="mt-1.5 font-display text-xl font-bold text-white drop-shadow sm:text-2xl">
              {day.title}
            </h3>
            {day.subtitle && <p className="text-xs text-white/80 sm:text-sm">{day.subtitle}</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-slate-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-900 text-white">
            <span className="text-sm font-bold">{day.day}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
              {t("trip.dayLabel", { n: day.day })}
              {date ? ` · ${date}` : ""}
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">{day.title}</h3>
            {day.subtitle && <p className="text-xs text-slate-500">{day.subtitle}</p>}
          </div>
        </div>
      )}

      {/* Activities */}
      <div className="space-y-2.5 p-4 sm:p-5">
        {day.activities.map((a, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
          >
            <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-sky-900 text-white">
              <CalendarIcon className="h-3 w-3 opacity-60" />
              <span className="mt-0.5 text-xs font-bold leading-none">{a.time}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-2">
                <span className="text-base leading-tight">{a.emoji ?? "📍"}</span>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight text-slate-900">{a.title}</p>
                  {a.place && (
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {a.place}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.description}</p>
              {a.tip && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2">
                  <span className="text-sm leading-tight">💎</span>
                  <p className="text-xs leading-relaxed text-amber-800">
                    <span className="font-semibold">{t("trip.tipLabel")}</span> {a.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
