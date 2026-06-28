import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, type MouseEvent } from "react";
import { MapPin, Sparkles, ArrowRight, Calendar as CalendarIcon, Wand2, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { getPublicTrip, type PublicTripDay } from "@/lib/share.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaywallGate } from "@/components/trip/PaywallGate";
import { useAuthStatus } from "@/lib/use-auth-status";
import logoFull from "@/assets/itineraya-logo.png.asset.json";
import ItineraryView from "@/components/trip/ItineraryView"; // Import ItineraryView here
import type { Day } from "@/components/trip/ItineraryView"; // Import Day interface for type safety
import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion components specifically for animations
import type { Variants } from "framer-motion";

// Define animation variants for elements
const heroImageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const textFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

const gradientShiftVariants: Variants = {
  visible: {
    background: [
      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 20%, transparent 70%)",
      "linear-gradient(to top, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0.25) 30%, transparent 80%)",
      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 20%, transparent 70%)" // Cycle back
    ],
    transition: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "loop" as const },
  },
};

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
  const { authed, checked } = useAuthStatus();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Friendly fallback when the trip no longer exists, was unpublished or never existed.
  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] p-6 text-center">
        <div className="max-w-md rounded-3xl bg-white/85 p-8 shadow-xl ring-1 ring-white/60 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-3xl">✈️</div>
          <h1 className="mt-4 font-display text-2xl font-bold text-sky-900">Este itinerario ya no está disponible</h1>
          <p className="mt-2 text-sky-700">Quizá el autor lo despublicó o el enlace caducó. ¡Pero puedes crear el tuyo en segundos!</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#15577E]">
            Crear mi itinerario gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

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
    navigate({ to: "/auth" });
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

  // Helper to transform PublicTripDay to the Day format expected by ItineraryView
  const transformTripDaysToItineraryDays = (tripDays: PublicTripDay[]): Day[] => {
    const baseDate = trip.start_date ? new Date(trip.start_date) : null;
    return tripDays.map((day, dayIndex) => ({
      date: baseDate
        ? new Date(baseDate.getTime() + dayIndex * 86400000).toISOString().slice(0, 10)
        : `2024-01-${String(dayIndex + 1).padStart(2, "0")}`,
      // Use day.title for label, prepending day number for clarity if title is generic
      // Example: "Day N: Title" -> "Day N: Title" or "Title"
      label: `Day ${day.day}: ${day.title}`, // Explicitly including "Day N" for clarity
      activities: day.activities.map((activity, index) => ({
        // Generate a unique ID. If time and name are not enough, use index from map.
        id: `${activity.time}-${activity.title.replace(/\s+/g, '-')}-${dayIndex}-${index}`,
        time: activity.time,
        name: activity.title,
        description: activity.description || "", // Ensure description is always a string
        // Add other fields if ItineraryView's Activity interface expects them
        // e.g., category: activity.category, emoji: activity.emoji, etc.
      })),
    }));
  };

  const transformedVisibleDays = transformTripDaysToItineraryDays(visibleDays);
  const transformedGatedDays = transformTripDaysToItineraryDays(gatedDays);

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
        {/* Animated Hero Image */}
        <AnimatePresence>
          <motion.img
            key={trip.hero_image_url || "default-hero"} // Key helps AnimatePresence track changes
            src={trip.hero_image_url || "/placeholder-hero.jpg"} // Use a placeholder if no image
            alt={trip.destination}
            variants={heroImageVariants}
            initial="hidden"
            animate="visible"
            className="h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Animated Gradient Overlay */}
        <motion.div
          variants={gradientShiftVariants}
          initial="initial" // Needs an initial state if not animating from the start, or let it default
          animate="visible"
          className="absolute inset-0 backdrop-blur-sm" // Added backdrop-blur for visual effect
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" /> {/* Static gradient, consider removing or merging with animated one */}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="mx-auto max-w-4xl text-white">
            <motion.p
              custom={0}
              variants={textFadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-xs font-semibold uppercase tracking-widest opacity-80"
            >
              {t("publicTrip.eyebrow")}
            </motion.p>
            <motion.h1
              custom={1}
              variants={textFadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-2 font-display text-4xl font-bold drop-shadow md:text-5xl"
            >
              {trip.destination}
            </motion.h1>
            <motion.div
              custom={2}
              variants={textFadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-3 flex flex-wrap items-center gap-3 text-sm opacity-90"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                <CalendarIcon className="h-3.5 w-3.5" />
                {t("publicTrip.duration", { count: nDays })}
              </span>
              {trip.start_date && trip.end_date && (
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                  {trip.start_date} → {trip.end_date}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        {/* Remix actions */}
        <div className="mb-8 grid gap-3 sm:grid-grid-cols-3">
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

        {/* Itinerary View Component */}
        <div className="mt-8 space-y-6">
             <ItineraryView itineraryData={{ days: transformedVisibleDays }} />
             {gatedDays.length > 0 && (
                 <PaywallGate>
                     <ItineraryView itineraryData={{ days: transformedGatedDays }} />
                 </PaywallGate>
             )}
        </div>

        {/* Original renderDay logic was commented out previously and is now fully replaced by ItineraryView */}
        {/*
        <div className="mt-8 space-y-6">
          {gatedDays.length > 0 && (
            <PaywallGate>
              <div className="space-y-6">{gatedDays.map(renderDay)}
              </div>
            </PaywallGate>
          )}
        </div>
        */}

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
;