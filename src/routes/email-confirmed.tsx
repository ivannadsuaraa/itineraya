import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, LogIn, Plane } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/email-confirmed")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Email confirmed – Itineraya" },
      { name: "description", content: "Your email is confirmed. Welcome to Itineraya!" },
    ],
  }),
  component: EmailConfirmedPage,
});

function EmailConfirmedPage() {
  const { t } = useTranslation();
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

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Link to="/" className="mb-8 inline-flex">
          <img src={logoFull.url} alt="Itineraya" className="h-12 w-auto select-none" draggable={false} />
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="h-11 w-11 text-emerald-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h1 className="font-display text-3xl font-bold text-sky-900">{t("emailConfirmed.title")}</h1>
          <p className="mt-3 text-sky-800/80">
            {t("emailConfirmed.bodyPre")}
            <strong>{t("emailConfirmed.bodyBrand")}</strong>
            {t("emailConfirmed.bodyPost")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition hover:bg-[#185a83]"
          >
            <LogIn className="h-5 w-5" />
            {t("emailConfirmed.cta")}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
