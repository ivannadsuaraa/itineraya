import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe2, Lock, Loader2, ExternalLink, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { setTripPublic } from "@/lib/explore.functions";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  tripId: string;
}

export function PublishToggle({ tripId }: Props) {
  const { t } = useTranslation();
  const mutate = useServerFn(setTripPublic);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("trips")
        .select("is_public, share_slug")
        .eq("id", tripId)
        .maybeSingle();
      if (cancel) return;
      const row = data as { is_public?: boolean; share_slug?: string | null } | null;
      setIsPublic(row?.is_public ?? false);
      setSlug(row?.share_slug ?? null);
    })();
    return () => {
      cancel = true;
    };
  }, [tripId]);

  const onToggle = async (next: boolean) => {
    setLoading(true);
    try {
      const res = await mutate({ data: { tripId, isPublic: next } });
      setIsPublic(res.isPublic);
      setSlug(res.slug ?? slug);
      toast.success(next ? t("publish.enabled") : t("publish.disabled"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("publish.error"));
    } finally {
      setLoading(false);
    }
  };

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://itineraya.com";
  const url = slug ? `${origin}/explore/${slug}` : "";

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("share.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPublic === null) return null;

  return (
    <div className="rounded-3xl border border-sky-100 bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              isPublic ? "bg-emerald-100 text-emerald-700" : "bg-sky-50 text-sky-700"
            }`}
          >
            {isPublic ? <Globe2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-sky-900">
              {t("publish.title")}
            </h3>
            <p className="mt-0.5 text-sm text-sky-600">{t("publish.subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          disabled={loading}
          onClick={() => onToggle(!isPublic)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ${
            isPublic ? "bg-[#1E6B9A]" : "bg-sky-200"
          } disabled:opacity-60`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              isPublic ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
          {loading && (
            <Loader2 className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
          )}
        </button>
      </div>

      {isPublic && url && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 bg-transparent px-2 text-xs text-emerald-900 outline-none"
            />
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? t("share.copied") : t("share.copy")}
            </button>
          </div>
          <Link
            to="/explore/$slug"
            params={{ slug: slug! }}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E6B9A] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t("publish.viewPublic")}
          </Link>
        </div>
      )}
    </div>
  );
}
