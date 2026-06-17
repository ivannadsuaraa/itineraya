import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Compass, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/_authenticated/new-trip")({
  head: () => ({ meta: [{ title: "Crear viaje – Itineraya" }] }),
  component: NewTripPage,
});

function NewTripPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl font-bold text-sky-900 md:text-4xl">
            {t("newTrip.title")}
          </h1>
          <p className="mt-2 text-sm text-sky-600 md:text-base">{t("newTrip.subtitle")}</p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ModeCard
            emoji="✅"
            icon={<MapPin className="h-7 w-7" />}
            title={t("newTrip.knowTitle")}
            description={t("newTrip.knowDesc")}
            onClick={() => navigate({ to: "/onboarding" })}
            delay={0.1}
          />
          <ModeCard
            emoji="🌍"
            icon={<Compass className="h-7 w-7" />}
            title={t("newTrip.inspireTitle")}
            description={t("newTrip.inspireDesc")}
            highlight
            onClick={() => navigate({ to: "/inspire" })}
            delay={0.2}
          />
          <ModeCard
            emoji="🧭"
            icon={<Navigation className="h-7 w-7" />}
            title={t("newTrip.copilotTitle")}
            description={t("newTrip.copilotDesc")}
            onClick={() => navigate({ to: "/copilot" })}
            delay={0.3}
          />
        </div>
      </div>
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
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
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
    </motion.button>
  );
}
