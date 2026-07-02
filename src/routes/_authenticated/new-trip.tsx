import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MapPin, Compass, Lock, Sparkles, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/new-trip")({
  head: () => ({ meta: [{ title: "Crear viaje – Itineraya" }] }),
  component: NewTripPage,
});

type Plan = "free" | "viajero" | "explorador";

function NewTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [showLimit, setShowLimit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      if (cancelled || !uid) return;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", uid).maybeSingle(),
        supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "ready"),
      ]);
      if (cancelled) return;
      setPlan((profile?.plan as Plan | undefined) ?? "free");
      setTripCount(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, []);

  const planLimit: number | null = plan === "explorador" ? null : plan === "viajero" ? 10 : 1;
  const loaded = plan !== null && tripCount !== null;
  const overLimit = loaded && planLimit !== null && (tripCount ?? 0) >= planLimit;

  const handlePick = (to: "/onboarding" | "/inspire") => {
    if (!loaded) return;
    if (overLimit) { setShowLimit(true); return; }
    navigate({ to });
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Dark header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900 px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-700/25 blur-3xl" />
          <div className="absolute -bottom-8 left-0 h-48 w-80 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("newTrip.back")}
            </Link>
            <BrandLogo size="sm" />
          </div>
          <div className="mt-8 text-center">
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
              {t("newTrip.title")}
            </h1>
            <p className="mt-2 text-sm text-sky-200 md:text-base">{t("newTrip.subtitle")}</p>
          </div>
        </div>
      </section>

      {/* Cards */}
      <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Plan limit banner */}
        {loaded && planLimit !== null && (
          <div className={`-mt-4 mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
            overLimit
              ? "bg-amber-50 border border-amber-200 text-amber-800"
              : "bg-sky-50 border border-sky-100 text-sky-700"
          }`}>
            {overLimit ? (
              <Lock className="h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-sky-400" />
            )}
            <span>
              {t("newTrip.limitBanner", { count: tripCount ?? 0, limit: planLimit })}
            </span>
            {overLimit && (
              <Link to="/pricing" className="ml-auto shrink-0 text-xs font-bold text-amber-700 hover:underline">
                {t("newTrip.limitUpgrade")} →
              </Link>
            )}
          </div>
        )}
        <div className="-mt-8 grid gap-5 sm:grid-cols-2">
          <ModeCard
            emoji="✅"
            icon={<MapPin className="h-7 w-7" />}
            title={t("newTrip.knowTitle")}
            description={t("newTrip.knowDesc")}
            onClick={() => handlePick("/onboarding")}
          />
          <ModeCard
            emoji="🌍"
            icon={<Compass className="h-7 w-7" />}
            title={t("newTrip.inspireTitle")}
            description={t("newTrip.inspireDesc")}
            highlight
            onClick={() => handlePick("/inspire")}
          />
        </div>
      </div>

      {/* Upgrade dialog */}
      <Dialog open={showLimit} onOpenChange={setShowLimit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-lg">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center font-display text-xl text-sky-900">
              {t("newTrip.limitTitle")}
            </DialogTitle>
            <DialogDescription className="text-center text-sky-700">
              {t("newTrip.limitDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <button
              type="button"
              onClick={() => { setShowLimit(false); navigate({ to: "/pricing" }); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
            >
              <Sparkles className="h-4 w-4" />
              {t("newTrip.limitUpgrade")}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowLimit(false)}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-50"
            >
              {t("newTrip.limitCancel")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModeCard({
  emoji,
  icon,
  title,
  description,
  onClick,
  highlight,
}: {
  emoji: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group relative flex cursor-pointer flex-col items-start gap-4 overflow-hidden rounded-2xl p-6 text-left shadow-sm ring-1 transition-all hover:-translate-y-0.5 sm:p-8 " +
        (highlight
          ? "bg-gradient-to-br from-sky-900 to-[#1E6B9A] text-white ring-sky-700/40 hover:shadow-lg hover:shadow-sky-900/25"
          : "bg-white text-slate-900 ring-slate-100 hover:shadow-md")
      }
    >
      <div
        className={
          "flex h-14 w-14 items-center justify-center rounded-2xl " +
          (highlight ? "bg-white/20 text-white" : "bg-sky-100 text-sky-700")
        }
      >
        {icon}
      </div>
      <div>
        <div className="text-3xl">{emoji}</div>
        <h3 className={"mt-1 font-display text-xl font-bold " + (highlight ? "text-white" : "text-slate-900")}>
          {title}
        </h3>
        <p className={"mt-1 text-sm " + (highlight ? "text-white/85" : "text-slate-500")}>
          {description}
        </p>
      </div>
      <div className={"mt-2 inline-flex items-center gap-1 text-sm font-semibold " + (highlight ? "text-white" : "text-[#1E6B9A]")}>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
      {highlight && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      )}
    </button>
  );
}
