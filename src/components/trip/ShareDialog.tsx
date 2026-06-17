import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { enableTripShare } from "@/lib/share.functions";

interface Props {
  open: boolean;
  onClose: () => void;
  tripId: string;
  destination: string;
}

export function ShareDialog({ open, onClose, tripId, destination }: Props) {
  const { t } = useTranslation();
  const enable = useServerFn(enableTripShare);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || slug || loading) return;
    setLoading(true);
    enable({ data: { tripId } })
      .then((r) => setSlug(r.slug))
      .catch(() => toast.error(t("share.error")))
      .finally(() => setLoading(false));
  }, [open, slug, loading, enable, tripId, t]);

  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://itineraya.com";
  const url = slug ? `${origin}/trip/${slug}` : "";
  const shareText = t("share.text", { destination });

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("share.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: destination, text: shareText, url });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") toast.error(t("share.error"));
      }
    } else {
      copy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-sky-900">{t("share.title")}</h2>
            <p className="mt-1 text-sm text-sky-600">{t("share.subtitle")}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-sky-600 hover:bg-sky-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !slug ? (
          <div className="mt-6 flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/50 p-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-transparent px-2 text-sm text-sky-900 outline-none"
              />
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E6B9A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15577E]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("share.copied") : t("share.copy")}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <span className="text-xl">💬</span>
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 rounded-2xl bg-sky-50 p-3 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              >
                <span className="text-xl">🐦</span>
                Twitter
              </a>
              <button
                onClick={nativeShare}
                className="flex flex-col items-center gap-1 rounded-2xl bg-violet-50 p-3 text-xs font-semibold text-violet-700 hover:bg-violet-100"
              >
                <Share2 className="h-5 w-5" />
                {t("share.more")}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-sky-500">{t("share.publicHint")}</p>
          </>
        )}
      </div>
    </div>
  );
}
