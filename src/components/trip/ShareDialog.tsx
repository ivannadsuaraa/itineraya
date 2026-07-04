import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, Loader2, Share2, Camera } from "lucide-react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { enableTripShare } from "@/lib/share.functions";
import { supabase } from "@/integrations/supabase/client";

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
  const [refId, setRefId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || slug || loading) return;
    setLoading(true);
    enable({ data: { tripId } })
      .then((r) => setSlug(r.slug))
      .catch(() => toast.error(t("share.error")))
      .finally(() => setLoading(false));
  }, [open, slug, loading, enable, tripId, t]);

  useEffect(() => {
    if (!open || refId) return;
    supabase.auth.getUser().then(({ data }) => setRefId(data.user?.id ?? null));
  }, [open, refId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://itineraya.com";
  // utm_source por canal + ref del usuario: sin esto es imposible medir el
  // K-factor por canal ni atribuir registros a quien compartió.
  const shareUrl = (source: string) => {
    if (!slug) return "";
    const params = new URLSearchParams({ utm_source: source, utm_medium: "share" });
    if (refId) params.set("ref", refId);
    return `${origin}/trip/${slug}?${params.toString()}`;
  };
  const displayUrl = slug ? `${origin}/trip/${slug}` : "";
  const shareText = t("share.text", { destination });

  const copy = async (source = "link") => {
    const url = shareUrl(source);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("share.copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    const url = shareUrl("native");
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: destination, text: shareText, url });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") toast.error(t("share.error"));
      }
    } else {
      copy("native");
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md flex-col rounded-t-3xl bg-white outline-none">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-sky-200" />
          </div>

          <div className="px-6 pb-8 pt-4">
            <Drawer.Title className="font-display text-xl font-bold text-sky-900">
              {t("share.title")}
            </Drawer.Title>
            <p className="mt-1 text-sm text-sky-600">{t("share.subtitle")}</p>

            {loading || !slug ? (
              <div className="mt-6 flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/50 p-2">
                  <input
                    readOnly
                    value={displayUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 bg-transparent px-2 text-base text-sky-900 outline-none sm:text-sm"
                  />
                  <button
                    onClick={() => copy("link")}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#1E6B9A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15577E]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? t("share.copied") : t("share.copy")}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl("whatsapp"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 flex-col items-center gap-1 rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <span className="text-xl">💬</span>
                    WhatsApp
                  </a>
                  <button
                    onClick={async () => {
                      await copy("instagram");
                      toast.success(t("share.instagramHint"));
                    }}
                    className="flex min-h-11 flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-fuchsia-50 to-orange-50 p-3 text-xs font-semibold text-fuchsia-700 hover:from-fuchsia-100 hover:to-orange-100"
                  >
                    <Camera className="h-5 w-5" />
                    {t("share.copyStories")}
                  </button>
                  <button
                    onClick={nativeShare}
                    className="flex min-h-11 flex-col items-center gap-1 rounded-2xl bg-violet-50 p-3 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    <Share2 className="h-5 w-5" />
                    {t("share.more")}
                  </button>
                </div>

                <p className="mt-4 text-center text-xs text-sky-500">{t("share.publicHint")}</p>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
