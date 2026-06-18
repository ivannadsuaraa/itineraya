import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Map, Plus, Sparkles, Compass, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/itineraya-mark.svg";

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

export function DashboardSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl">
      <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
        <img src={logoMark} alt="" className="h-8 w-8" draggable={false} />
        <span className="font-display text-lg font-bold text-sky-900">Itineraya</span>
      </Link>
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to || (item.to === "/dashboard" && pathname.startsWith("/dashboard"));
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
  const items: NavItem[] = [
    ...NAV_ITEMS,
    { to: "/dashboard", labelKey: "sidebar.profile", icon: User },
  ];
  // dedupe by to+label
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                  active ? "text-sky-700" : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
