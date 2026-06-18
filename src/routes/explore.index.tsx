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
  Loader2,
} from "lucide-react";
import { listPublicTrips, type PublicFeedItem } from "@/lib/explore.functions";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";

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
    <div className="min-h-screen bg-gradient-to-br from-[#EAF4FB] via-white to-[#D6EAF8]">
      <Navbar />
      <main className="pt-28">
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
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
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
      <FooterSection />
    </div>
  );
}

function FeedCard({ item, onRemix }: { item: PublicFeedItem; onRemix: () => void }) {
  const { t } = useTranslation();
  const fallback = useMemo(
    () =>
      `https://source.unsplash.com/featured/800x1000/?${encodeURIComponent(
        item.destination,
      )},travel&sig=${encodeURIComponent(item.slug)}`,
    [item.destination, item.slug],
  );
  const img = item.hero_image_url ?? fallback;
  const title = item.n_days
    ? t("explore.cardTitle", { days: item.n_days, destination: item.destination })
    : item.destination;

  return (
    <article className="mb-5 break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-sky-100 transition hover:-translate-y-0.5 hover:shadow-xl">
      <Link to="/explore/$slug" params={{ slug: item.slug }} className="block">
        <div className="relative">
          <img
            src={img}
            alt={item.destination}
            loading="lazy"
            className="h-auto w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-display text-lg font-bold drop-shadow">{title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] opacity-95">
              {item.n_days && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 backdrop-blur">
                  <CalendarIcon className="h-3 w-3" />
                  {t("explore.days", { count: item.n_days })}
                </span>
              )}
              {item.trip_style && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 backdrop-blur">
                  {item.trip_style}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-1 text-xs font-medium text-sky-700">
          <MapPin className="h-3 w-3" />
          {item.destination}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRemix}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-3 py-1.5 text-[11px] font-bold text-white shadow hover:shadow-md"
          >
            <Sparkles className="h-3 w-3" />
            {t("explore.remix")}
          </button>
          <Link
            to="/explore/$slug"
            params={{ slug: item.slug }}
            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100"
          >
            {t("explore.view")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
