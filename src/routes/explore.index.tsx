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
} from "lucide-react";
import { listPublicTrips, type PublicFeedItem } from "@/lib/explore.functions";
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

function ExplorePage() {
  const { t } = useTranslation();
  const list = useServerFn(listPublicTrips);
  const navigate = useNavigate();

  const [destination, setDestination] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("all");
  const [durationBucket, setDurationBucket] = useState<(typeof DURATIONS)[number]>("all");
  const [items, setItems] = useState<PublicFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAuthenticated(!!data.user));
  }, []);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    list({ data: { destination, style, durationBucket, limit: 60 } })
      .then((res) => {
        if (!cancel) setItems(res);
      })
      .catch(() => {
        if (!cancel) setItems([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [list, destination, style, durationBucket]);

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
    <div className={`min-h-screen bg-gradient-to-br from-[#EAF4FB] via-white to-[#D6EAF8] ${isAuthenticated ? "pb-16 md:pb-0" : ""}`}>
      {isAuthenticated ? <DesktopTopNav /> : <Navbar />}
      <main className={isAuthenticated ? "md:pt-14 pt-4" : "pt-28"}>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#1E6B9A] ring-1 ring-sky-200 backdrop-blur">
              <Compass className="h-3.5 w-3.5" />
              {t("explore.eyebrow")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-sky-900 sm:text-5xl">
              {t("explore.title")}
            </h1>
            <p className="mt-3 text-base text-sky-700 sm:text-lg">{t("explore.subtitle")}</p>
          </div>

          {/* Filters */}
          <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-3 rounded-3xl bg-white/80 p-3 shadow-lg ring-1 ring-sky-100 backdrop-blur md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-sky-50/70 px-3 py-2">
              <Search className="h-4 w-4 text-sky-500" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t("explore.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-sky-900 outline-none placeholder:text-sky-500"
              />
            </div>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
              className="rounded-2xl border-0 bg-sky-50/70 px-3 py-2 text-sm font-medium text-sky-900 outline-none"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {t(`explore.style.${s}`)}
                </option>
              ))}
            </select>
            <select
              value={durationBucket}
              onChange={(e) => setDurationBucket(e.target.value as (typeof DURATIONS)[number])}
              className="rounded-2xl border-0 bg-sky-50/70 px-3 py-2 text-sm font-medium text-sky-900 outline-none"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {t(`explore.duration.${d}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Feed */}
          <div className="mt-10 pb-20">
            {loading ? (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="mb-5 break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-sky-100">
                    <div className="h-72 w-full animate-pulse bg-slate-200" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
                    </div>
                    <div className="flex gap-2 px-4 pb-4">
                      <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl bg-white/80 p-12 text-center shadow ring-1 ring-sky-100">
                <Sparkles className="mx-auto h-8 w-8 text-sky-400" />
                <p className="mt-3 font-semibold text-sky-900">{t("explore.empty")}</p>
                <p className="mt-1 text-sm text-sky-600">{t("explore.emptyHint")}</p>
              </div>
            ) : (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
                {items.map((item) => (
                  <FeedCard key={item.slug} item={item} onRemix={() => handleRemix(item)} />
                ))}
              </div>
            )}

          </div>
        </section>
      </main>
      {!isAuthenticated && <FooterSection />}
      {isAuthenticated && <MobileBottomBar />}
    </div>
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function FeedCard({ item, onRemix }: { item: PublicFeedItem; onRemix: () => void }) {
  const { t } = useTranslation();
  const fallback = useMemo(
    () =>
      `https://loremflickr.com/800/1000/${encodeURIComponent(
        item.destination.split(",")[0].trim() + ",travel",
      )}?lock=${Math.abs(hashString(item.slug)) % 1000}`,
    [item.destination, item.slug],
  );
  const [img, setImg] = useState(item.hero_image_url ?? fallback);
  const title = item.n_days
    ? t("explore.cardTitle", { days: item.n_days, destination: item.destination })
    : item.destination;

  return (
    <article className="group mb-5 break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-sky-100 transition hover:-translate-y-1 hover:shadow-xl">
      <Link to="/explore/$slug" params={{ slug: item.slug }} className="block">
        <div className="relative overflow-hidden">
          <img
            src={img}
            alt={item.destination}
            loading="lazy"
            onError={() => setImg(fallback)}
            className="h-72 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-display text-xl font-bold leading-tight drop-shadow">{title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] opacity-95">
              {item.n_days && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 backdrop-blur-sm">
                  <CalendarIcon className="h-3 w-3" />
                  {t("explore.days", { count: item.n_days })}
                </span>
              )}
              {item.trip_style && (
                <span className="rounded-full bg-white/25 px-2.5 py-0.5 capitalize backdrop-blur-sm">
                  {item.trip_style}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      {item.summary && (
        <Link to="/explore/$slug" params={{ slug: item.slug }} className="block px-4 pt-3 pb-1">
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{item.summary}</p>
        </Link>
      )}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="truncate">{item.destination}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onRemix}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-3 py-1.5 text-[11px] font-bold text-white shadow transition hover:shadow-md active:scale-[0.97]"
          >
            <Sparkles className="h-3 w-3" />
            {t("explore.remix")}
          </button>
          <Link
            to="/explore/$slug"
            params={{ slug: item.slug }}
            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-800 ring-1 ring-sky-200 transition hover:bg-sky-100 active:scale-[0.97]"
          >
            {t("explore.view")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
