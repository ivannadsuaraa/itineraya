import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  MapPin,
  Calendar as CalendarIcon,
  Search,
  ArrowRight,
  Compass,
  Mountain,
  Waves,
  Landmark,
  Heart,
  Users,
  Music,
  TreePine,
  Globe,
  Clock,
  PlusCircle,
  Star,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import { listPublicTrips, rateTrip, type PublicFeedItem } from "@/lib/explore.functions";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { MobileBottomBar, DesktopTopNav } from "@/components/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/explore/")({
  head: () => {
    const url = "https://itineraya.com/explore";
    return {
      meta: [
        { title: "Descubre viajes — Itineraya" },
        {
          name: "description",
          content:
            "Explora itinerarios reales creados por la comunidad. Inspírate con viajes a Bali, Tokio, París y muchos más, y crea el tuyo en segundos.",
        },
        { property: "og:title", content: "Descubre viajes — Itineraya" },
        {
          property: "og:description",
          content: "Itinerarios reales para inspirar tu próximo viaje.",
        },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ExplorePage,
});

const STYLES = ["all", "adventure", "relax", "cultural", "romantic", "family", "party", "nature"] as const;
const DURATIONS = ["all", "short", "medium", "long"] as const;

const STYLE_ICONS: Record<(typeof STYLES)[number], React.ElementType> = {
  all: Globe,
  adventure: Mountain,
  relax: Waves,
  cultural: Landmark,
  romantic: Heart,
  family: Users,
  party: Music,
  nature: TreePine,
};

function ExplorePage() {
  const { t } = useTranslation();
  const list = useServerFn(listPublicTrips);
  const rate = useServerFn(rateTrip);
  const navigate = useNavigate();

  const [destination, setDestination] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("all");
  const [durationBucket, setDurationBucket] = useState<(typeof DURATIONS)[number]>("all");
  const [sortBy, setSortBy] = useState<"newest" | "best">("newest");
  const [items, setItems] = useState<PublicFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Object.keys(localStorage).some(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAuthenticated(!!data.user));
  }, []);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    list({ data: { destination, style, durationBucket, limit: 60 } })
      .then((res) => { if (!cancel) setItems(res); })
      .catch(() => { if (!cancel) setItems([]); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [list, destination, style, durationBucket]);

  const trending = useMemo(() => {
    if (items.length === 0) return [];
    const counts = new Map<string, { count: number; item: PublicFeedItem }>();
    for (const item of items) {
      const dest = item.destination.split(",")[0].trim();
      const existing = counts.get(dest);
      if (existing) { existing.count++; }
      else { counts.set(dest, { count: 1, item }); }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((v) => v.item);
  }, [items]);

  const sortedItems = useMemo(() => {
    if (sortBy === "best") {
      return [...items].sort((a, b) => {
        const aAvg = a.rating_avg ?? 0;
        const bAvg = b.rating_avg ?? 0;
        return bAvg - aAvg;
      });
    }
    return items;
  }, [items, sortBy]);

  const handleRate = async (slug: string, rating: number) => {
    if (!isAuthenticated) return;
    // Optimistic update
    setItems((prev) =>
      prev.map((it) => {
        if (it.slug !== slug) return it;
        const newCount = it.rating_count + 1;
        const oldSum = (it.rating_avg ?? 0) * it.rating_count;
        return { ...it, rating_avg: (oldSum + rating) / newCount, rating_count: newCount };
      }),
    );
    await rate({ data: { slug, rating } }).catch(() => {});
  };

  const handleRemix = (item: PublicFeedItem) => {
    const payload = {
      destination: item.destination,
      tripTypes: item.trip_types ?? [],
      nDays: item.n_days ?? undefined,
    };
    const encoded =
      typeof window === "undefined"
        ? ""
        : btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  return (
    <div className={`min-h-dvh bg-slate-50 ${isAuthenticated ? "pb-16 md:pb-0" : ""}`}>
      {isAuthenticated ? <DesktopTopNav /> : <Navbar />}

      <main className={isAuthenticated ? "md:pt-14" : "pt-28"}>

        {/* ── Header ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900 px-4 py-12 sm:py-16">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sky-700/30 blur-3xl" />
            <div className="absolute -bottom-10 right-0 h-64 w-64 rounded-full bg-[#1E6B9A]/40 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200 ring-1 ring-white/20 backdrop-blur">
              <Compass className="h-3.5 w-3.5" />
              {t("explore.eyebrow")}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {t("explore.title")}
            </h1>
            <p className="mt-3 text-base text-sky-200 sm:text-lg">
              {t("explore.subtitle")}
            </p>

            {/* Search bar */}
            <div className="mx-auto mt-8 flex max-w-xl items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-xl ring-1 ring-white/10">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t("explore.searchPlaceholder")}
                className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 sm:text-sm"
              />
              {destination && (
                <button
                  type="button"
                  onClick={() => setDestination("")}
                  className="relative h-6 w-6 shrink-0 rounded-full bg-slate-200 text-slate-500 text-xs font-bold leading-6 transition hover:bg-slate-300 before:absolute before:-inset-2.5 before:content-['']"
                  aria-label={t("explore.clear")}
                >
                  ×
                </button>
              )}
            </div>

            {/* Qué es el Remix: cada viaje del feed es una plantilla */}
            <p className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-1.5 text-xs text-sky-300/90">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              {t("explore.remixExplainer")}
            </p>
          </div>
        </section>

        {/* ── Filters ── */}
        <div className="sticky top-14 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Style chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
              {STYLES.map((s) => {
                const Icon = STYLE_ICONS[s];
                const active = style === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-sky-900 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {t(`explore.style.${s}`)}
                  </button>
                );
              })}

              <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />

              {/* Duration chips */}
              {DURATIONS.filter((d) => d !== "all").map((d) => {
                const active = durationBucket === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationBucket(active ? "all" : d)}
                    className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-[#1E6B9A] text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {t(`explore.duration.${d}`)}
                  </button>
                );
              })}

              <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />

              {/* Sort toggle */}
              <button
                type="button"
                onClick={() => setSortBy((s) => (s === "newest" ? "best" : "newest"))}
                className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-all ${
                  sortBy === "best"
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sortBy === "best" ? <Star className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}
                {sortBy === "best" ? t("explore.sortBest") : t("explore.sortNewest")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Trending strip (shown when no active filters) ── */}
        {!loading && trending.length > 0 && destination === "" && style === "all" && durationBucket === "all" && (
          <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2 className="font-display text-base font-bold text-slate-900">
                {t("explore.trending")}
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
              {trending.map((item) => {
                const fallback = `https://loremflickr.com/400/280/${encodeURIComponent(item.destination.split(",")[0].trim() + ",travel")}?lock=${Math.abs(item.slug.charCodeAt(0)) % 1000}`;
                return (
                  <Link
                    key={item.slug}
                    to="/explore/$slug"
                    params={{ slug: item.slug }}
                    className="group relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl bg-slate-200 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <img
                      src={item.hero_image_url ?? fallback}
                      alt={item.destination}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <p className="text-xs font-bold leading-tight text-white drop-shadow">
                        {item.destination.split(",")[0]}
                      </p>
                      {item.n_days && (
                        <p className="text-[10px] text-white/75">{t("explore.days", { count: item.n_days })}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 border-t border-slate-100" />
          </section>
        )}

        {/* ── Feed ── */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <SkeletonGrid />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedItems.map((item) => (
                <FeedCard
                  key={item.slug}
                  item={item}
                  onRemix={() => handleRemix(item)}
                  onRate={isAuthenticated ? (r) => handleRate(item.slug, r) : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {!isAuthenticated && <FooterSection />}
      {isAuthenticated && <MobileBottomBar />}
    </div>
  );
}

/* ─── Skeleton ─── */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-slate-200" />
            <div className="flex items-center gap-2 pt-1">
              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty state ─── */

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-50 ring-1 ring-sky-100">
        <Compass className="h-7 w-7 text-sky-500" />
      </div>
      <p className="mt-5 text-lg font-semibold text-slate-800">{t("explore.empty")}</p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">{t("explore.emptyHint")}</p>
      <Link
        to="/new-trip"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#15577E]"
      >
        <PlusCircle className="h-4 w-4" />
        {t("explore.emptyAction")}
      </Link>
    </div>
  );
}

/* ─── Feed card ─── */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function initials(destination: string): string {
  return destination
    .split(/[\s,]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StarRating({ avg, count, onRate }: { avg: number | null; count: number; onRate?: (r: number) => void }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? Math.round(avg ?? 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(s)}
          onMouseEnter={() => onRate && setHovered(s)}
          onMouseLeave={() => setHovered(null)}
          className={`p-2.5 -m-1 transition-transform ${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          aria-label={t("explore.rateAria", { count: s })}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              s <= display ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"
            }`}
          />
        </button>
      ))}
      {count > 0 && (
        <span className="ml-1 text-[10px] font-medium text-slate-400">({count})</span>
      )}
    </div>
  );
}

function FeedCard({ item, onRemix, onRate }: { item: PublicFeedItem; onRemix: () => void; onRate?: (rating: number) => void }) {
  const { t } = useTranslation();
  const fallback = useMemo(
    () =>
      `https://loremflickr.com/800/600/${encodeURIComponent(
        item.destination.split(",")[0].trim() + ",travel",
      )}?lock=${Math.abs(hashString(item.slug)) % 1000}`,
    [item.destination, item.slug],
  );
  const [img, setImg] = useState(item.hero_image_url ?? fallback);
  const title = item.n_days
    ? t("explore.cardTitle", { days: item.n_days, destination: item.destination })
    : item.destination;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-slate-200">
      {/* Image */}
      <Link to="/explore/$slug" params={{ slug: item.slug }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={img}
            alt={item.destination}
            loading="lazy"
            onError={() => setImg(fallback)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {item.trip_style && (
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-800 shadow-sm backdrop-blur-sm">
                {item.trip_style}
              </span>
            )}
            {item.n_days && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                <CalendarIcon className="h-2.5 w-2.5" />
                {t("explore.days", { count: item.n_days })}
              </span>
            )}
          </div>

          {/* Bottom overlay: title + avatar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 p-4">
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold leading-tight text-white drop-shadow-sm line-clamp-2">
                {title}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-white/80">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{item.destination}</span>
              </div>
            </div>
            {/* Author avatar placeholder */}
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1E6B9A] text-[11px] font-bold text-white ring-2 ring-white/50 shadow">
              {initials(item.destination)}
            </div>
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="p-4">
        {item.summary && (
          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {item.summary}
          </p>
        )}
        <div className="mb-3 flex items-center justify-between gap-2">
          <StarRating avg={item.rating_avg} count={item.rating_count} onRate={onRate} />
          {item.view_count > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <Eye className="h-3 w-3" />
              {t("explore.views", { count: item.view_count })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRemix}
            title={t("explore.remixTooltip")}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-900 to-[#1E6B9A] px-4 text-xs font-bold text-white shadow-sm transition hover:shadow-md active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("explore.remix")}
          </button>
          <Link
            to="/explore/$slug"
            params={{ slug: item.slug }}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
          >
            {t("explore.view")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
