import { useState, useRef, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Map, Home, User, PlusCircle, Compass, LogOut, Bookmark, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/", labelKey: "sidebar.home", icon: Home },
  { to: "/explore", labelKey: "sidebar.feed", icon: Compass },
  { to: "/new-trip", labelKey: "sidebar.createShort", icon: PlusCircle },
  { to: "/dashboard", labelKey: "sidebar.tripsShort", icon: Map },
  { to: "/saved", labelKey: "sidebar.saved", icon: Bookmark },
  { to: "/profile", labelKey: "sidebar.profile", icon: User },
];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (to === "/explore") return pathname.startsWith("/explore");
  if (to === "/profile") return pathname.startsWith("/profile");
  if (to === "/saved") return pathname.startsWith("/saved");
  return pathname === to;
}

const LANDING_LINKS = [
  { labelKey: "nav.explore",     href: "/explore" },
  { labelKey: "nav.howItWorks",  href: "/#how-it-works" },
  { labelKey: "nav.features",    href: "/#features" },
  { labelKey: "nav.pricing",     href: "/pricing" },
] as const;

export function DesktopTopNav() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="hidden md:flex fixed top-0 inset-x-0 z-40 h-14 items-center border-b border-slate-100 bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src="/itineraya-mark.png" alt="" className="h-7 w-7" draggable={false} />
          <span className="font-display text-base font-bold text-sky-900">Itineraya</span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-sky-50 text-[#1E6B9A]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-sky-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#1E6B9A]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {/* Hamburger — landing links */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              title="Menú"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
                {LANDING_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-900"
                  >
                    {t(link.labelKey)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title={t("dashboard.logout")}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileBottomBar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-100 bg-white/98 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(0,0,0,0.06),0_-4px_16px_rgba(0,0,0,0.04)]">
      <ul className="grid grid-cols-6">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.to);
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
                <Icon
                  className={`h-5 w-5 transition-transform duration-150 ${active ? "scale-110" : ""}`}
                />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
