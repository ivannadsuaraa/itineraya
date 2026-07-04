import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Payment complete – Itineraya" }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12">
        <BrandLogo size="md" />
        <div className="mt-10 w-full rounded-3xl bg-white/85 p-10 text-center shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-sky-900">{t("checkoutReturn.title")}</h1>
          <p className="mt-2 text-sm text-sky-700">{t("checkoutReturn.body")}</p>
          <Link
            to="/dashboard"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E]"
          >
            {t("checkoutReturn.cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
