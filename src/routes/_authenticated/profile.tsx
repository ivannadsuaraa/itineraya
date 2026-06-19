import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { User as UserIcon, LogOut, CreditCard, Sparkles, Mail, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isActive } = useSubscription();
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [plan, setPlan] = useState<string>("free");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, plan")
        .eq("id", user.id)
        .maybeSingle();
      setFullName(p?.full_name ?? "");
      setAvatar(p?.avatar_url ?? null);
      setPlan((p?.plan as string) ?? "free");
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const planLabel =
    plan === "explorador" ? "Explorador" : plan === "viajero" ? "Viajero" : "Gratis";

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      <div className="md:pl-60">
        <main className="mx-auto max-w-2xl px-5 py-8 md:px-10 md:py-12">
          <h1 className="font-display text-3xl font-bold text-slate-900">Perfil</h1>
          <p className="mt-1 text-sm text-slate-500">Tu cuenta, plan y ajustes.</p>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-sky-700">
                  <UserIcon className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-slate-900">
                  {fullName || email.split("@")[0] || "Viajero"}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan actual
                </p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900">
                  {planLabel}
                  {isActive && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      activo
                    </span>
                  )}
                </p>
              </div>
              <Link
                to="/pricing"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95"
              >
                <Sparkles className="h-4 w-4" />
                {plan === "explorador" ? "Gestionar" : "Mejorar"}
              </Link>
            </div>
          </section>

          <section className="mt-4 grid gap-2">
            <Link
              to="/pricing"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Suscripción y pagos
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <UserIcon className="h-4 w-4 text-slate-500" />
                Mis viajes
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </section>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              {t("dashboard.logout")}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
