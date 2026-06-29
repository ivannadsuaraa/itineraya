import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ArrowLeft, ArrowRight, MapPin, Compass, Lock, Sparkles } from "lucide-react";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [showLimit, setShowLimit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) return;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", uid).maybeSingle(),
        supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);
      if (cancelled) return;
      setPlan(((profile?.plan as Plan | undefined) ?? "free"));
      setTripCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const planLimit: number | null =
    plan === "explorador" ? null : plan === "viajero" ? 10 : 1;
  const loaded = plan !== null && tripCount !== null;
  const overLimit =
    loaded && planLimit !== null && (tripCount ?? 0) >= planLimit;

  const handlePick = (to: "/onboarding" | "/inspire") => {
    if (!loaded) return;
    if (overLimit) {
      setShowLimit(true);
      return;
    }
    navigate({ to });
  };
  // silence unused
  void userId;


  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 self-start">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("newTrip.back")}
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-center">
          <BrandLogo size="md" />
        </div>

        <div
          
          
          
          className="text-center"
        >
          <h1 className="font-display text-3xl font-bold text-sky-900 md:text-4xl">
            {t("newTrip.title")}
          </h1>
          <p className="mt-2 text-sm text-sky-600 md:text-base">{t("newTrip.subtitle")}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <ModeCard
            emoji="✅"
            icon={<MapPin className="h-7 w-7" />}
            title={t("newTrip.knowTitle")}
            description={t("newTrip.knowDesc")}
            onClick={() => handlePick("/onboarding")}
            delay={0.1}
          />
          <ModeCard
            emoji="🌍"
            icon={<Compass className="h-7 w-7" />}
            title={t("newTrip.inspireTitle")}
            description={t("newTrip.inspireDesc")}
            highlight
            onClick={() => handlePick("/inspire")}
            delay={0.2}
          />
        </div>
      </div>

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
              onClick={() => {
                setShowLimit(false);
                navigate({ to: "/pricing" });
              }}
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
  delay,
}: {
  emoji: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
  delay: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      
      
      
      
      className={
        "group relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl p-6 text-left shadow-xl ring-1 transition-all sm:p-8 " +
        (highlight
          ? "bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white ring-white/30 shadow-[#1E6B9A]/30 hover:shadow-2xl hover:shadow-[#1E6B9A]/40"
          : "bg-white/85 text-sky-900 ring-white/60 backdrop-blur-xl hover:bg-white")
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
        <h3 className={"mt-1 font-display text-xl font-bold " + (highlight ? "text-white" : "text-sky-900")}>
          {title}
        </h3>
        <p className={"mt-1 text-sm " + (highlight ? "text-white/85" : "text-sky-600")}>
          {description}
        </p>
      </div>
      <div
        className={
          "mt-2 inline-flex items-center gap-1 text-sm font-semibold " +
          (highlight ? "text-white" : "text-[#1E6B9A]")
        }
      >
        <span className="transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
      {highlight && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      )}
    </button>
  );
}
