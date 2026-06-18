import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

/**
 * Wraps the lower half of a shared itinerary with a progressive blur and a
 * sign-up CTA. Children remain visible (and SEO-friendly) but are not
 * interactive while gated.
 */
export function PaywallGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="relative">
      {/* Blurred, non-interactive preview */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={{
          filter: "blur(6px)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0) 100%)",
        }}
      >
        {children}
      </div>

      {/* Sticky CTA card */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16 md:pt-24">
        <div className="pointer-events-auto sticky top-24 mx-4 max-w-md rounded-3xl bg-white/95 p-6 text-center shadow-2xl ring-1 ring-sky-100 backdrop-blur-xl md:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-lg">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-sky-900 md:text-2xl">
            {t("paywall.title")}
          </h3>
          <p className="mt-2 text-sm text-sky-700">{t("paywall.subtitle")}</p>
          <Link
            to="/auth"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4" />
            {t("paywall.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-sky-500">{t("paywall.footer")}</p>
        </div>
      </div>
    </div>
  );
}
