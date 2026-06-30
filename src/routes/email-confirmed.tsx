import { createFileRoute, Link } from "@tanstack/react-router";

import { CheckCircle2, LogIn, Loader2 } from "lucide-react";
import logoFull from "@/assets/itineraya-logo.png.asset.json";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { setPendingAuthToast } from "@/lib/post-auth-toast";

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
  const { openAuthModal } = useAuthModal();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // The confirmation link's URL hash sets a session automatically. If it
    // landed, skip the "log in" prompt and go straight to the dashboard.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setPendingAuthToast("accountCreated");
        window.location.assign("/dashboard");
        return;
      }
      setChecking(false);
    });
  }, []);

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

        {checking ? (
          <Loader2 className="h-10 w-10 animate-spin text-[#1E6B9A]" />
        ) : (
          <>
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-11 w-11 text-emerald-600" />
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold text-sky-900">{t("emailConfirmed.title")}</h1>
              <p className="mt-3 text-sky-800/80">
                {t("emailConfirmed.bodyPre")}
                <strong>{t("emailConfirmed.bodyBrand")}</strong>
                {t("emailConfirmed.bodyPost")}
              </p>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => openAuthModal({ mode: "login" })}
                className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition hover:bg-[#185a83]"
              >
                <LogIn className="h-5 w-5" />
                {t("emailConfirmed.cta")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
