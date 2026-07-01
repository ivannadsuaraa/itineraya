import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Map, Plus, Sparkles, Compass, LogOut, Home, User, PlusCircle, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", labelKey: "sidebar.trips", icon: Map },
  { to: "/new-trip", labelKey: "sidebar.create", icon: Plus },
  { to: "/assistant", labelKey: "sidebar.assistant", icon: Sparkles },
  { to: "/inspire", labelKey: "sidebar.inspire", icon: Compass },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "sidebar.home", icon: Home },
  { to: "/explore", labelKey: "sidebar.feed", icon: Compass },
  { to: "/new-trip", labelKey: "sidebar.createShort", icon: PlusCircle },
  { to: "/dashboard", labelKey: "sidebar.tripsShort", icon: Map },
  { to: "/profile", labelKey: "sidebar.profile", icon: User },
];

export function DashboardSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => {
      if (!u.user) return;
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", u.user.id)
        .maybeSingle()
        .then(({ data }) => {
          setIsFree((data as { plan?: string } | null)?.plan === "free" || !data?.plan);
        });
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2" title="Volver al inicio">
          <img src="/itineraya-mark.png" alt="" className="h-8 w-8" draggable={false} />
          <span className="font-display text-lg font-bold text-sky-900">Itineraya</span>
        </Link>
        <Link
          to="/"
          aria-label="Inicio"
          title="Inicio"
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-sky-900"
        >
          <Home className="h-4 w-4" />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to === "/dashboard" && pathname.startsWith("/dashboard"));
            const isAssistant = item.to === "/assistant";
            const locked = isAssistant && isFree;

            if (locked) {
              return (
                <li key={item.to}>
                  <Link
                    to="/pricing"
                    title={t("sidebar.assistantLocked")}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{t(item.labelKey)}</span>
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-sky-100 text-sky-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-sky-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-sky-900"
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard.logout")}
        </button>
      </div>
    </aside>
  );
}

export function MobileBottomBar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-100 bg-white/98 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(0,0,0,0.06),0_-4px_16px_rgba(0,0,0,0.04)]">
      <ul className="grid grid-cols-5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.to ||
            (item.to === "/dashboard" && pathname.startsWith("/dashboard")) ||
            (item.to === "/explore" && pathname.startsWith("/explore")) ||
            (item.to === "/profile" && pathname.startsWith("/profile"));
          return (
            <li key={item.to} className="flex">
              <Link
                to={item.to}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-colors ${
                  active ? "text-[#1E6B9A]" : "text-slate-400"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#1E6B9A]" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-150 ${active ? "scale-110" : ""}`} />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
