import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, Calendar, Compass, Wand2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved – Itineraya" }] }),
  component: SavedPage,
});

type SavedInspo = {
  id: string;
  slug: string;
  destination: string;
  hero_image_url: string | null;
  summary: string | null;
  n_days: number | null;
};

function SavedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedInspo[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("saved_inspirations")
        .select("id,slug,destination,hero_image_url,summary,n_days")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(t("saved.loadFail"));
        setSaved([]);
        return;
      }
      setSaved((data ?? []) as SavedInspo[]);
    })();
  }, [t]);

  const remixSaved = (s: SavedInspo) => {
    const payload = { destination: s.destination, nDays: s.n_days ?? undefined };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  const removeSaved = async (id: string) => {
    const prev = saved ?? [];
    setSaved(prev.filter((x) => x.id !== id));
    const { error } = await supabase.from("saved_inspirations").delete().eq("id", id);
    if (error) {
      setSaved(prev);
      toast.error(t("saved.loadFail"));
    }
  };

  const loading = saved === null;

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Dark header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-700/25 blur-3xl" />
          <div className="absolute -bottom-8 left-0 h-48 w-80 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {t("saved.title")}
              </h1>
              <p className="mt-0.5 text-sm text-sky-300">{t("saved.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100"
              >
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <Bookmark className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-slate-900">
              {t("saved.emptyTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{t("saved.emptyDesc")}</p>
            <Link
              to="/explore"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#15577E]"
            >
              <Compass className="h-4 w-4" />
              {t("saved.emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link to="/trip/$slug" params={{ slug: s.slug }} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {s.hero_image_url ? (
                      <img
                        src={s.hero_image_url}
                        alt={s.destination}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-sky-300 to-sky-600" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="font-display text-base font-bold drop-shadow">
                        {s.destination}
                      </div>
                      {s.n_days && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                          <Calendar className="h-2.5 w-2.5" />
                          {t("saved.days", { count: s.n_days })}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => remixSaved(s)}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-sky-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-800 active:scale-95"
                  >
                    <Wand2 className="h-3 w-3" />
                    {t("dashboard.savedRemix")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSaved(s.id)}
                    aria-label={t("dashboard.savedRemove")}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
