import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard } from "lucide-react";

import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

export function Navbar() {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { label: t("nav.explore"), href: "/explore" },
    { label: t("nav.howItWorks"), href: "#how-it-works" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "/pricing" },
  ];

  return (
    <header
      
      
      
      className="fixed top-0 left-0 right-0 z-50"
      suppressHydrationWarning
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <nav className="mt-4 flex items-center justify-between rounded-full bg-white/80 px-6 py-3 shadow-[0_4px_24px_rgba(46,107,138,0.08)] backdrop-blur-md" suppressHydrationWarning>
          <Link to={mounted && isLoggedIn ? "/dashboard" : "/"} className="inline-flex items-center">
            <img src="/itineraya-logo.png" alt="Itineraya" className="hidden h-8 w-auto select-none sm:block" draggable={false} />
            <img src="/itineraya-mark.png" alt="Itineraya" className="h-8 w-auto select-none sm:hidden" draggable={false} />
          </Link>

          <div className="hidden items-center gap-6 md:flex" suppressHydrationWarning>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-sky-700 transition-colors hover:text-sky-900"
                suppressHydrationWarning
              >
                {link.label}
              </a>
            ))}
            <LanguageSwitcher />
            {mounted && isLoggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1E6B9A]/20 transition-all hover:bg-[#15577E] hover:shadow-lg hover:shadow-[#1E6B9A]/30 hover:scale-[1.02]"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("nav.myTrips")}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal({ mode: "login" })}
                  className="text-sm font-semibold text-sky-700 transition-colors hover:text-sky-900"
                  suppressHydrationWarning
                >
                  {t("nav.login")}
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal({ mode: "signup" })}
                  className="rounded-full bg-[#1E6B9A] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1E6B9A]/20 transition-all hover:bg-[#15577E] hover:shadow-lg hover:shadow-[#1E6B9A]/30 hover:scale-[1.02]"
                  suppressHydrationWarning
                >
                  {t("nav.startFree")}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher compact />
            <button
              onClick={() => setOpen(!open)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sky-800"
              aria-label={t("nav.toggleMenu")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      
        {open && (
          <div
            
            
            
            
            className="mx-4 mt-2 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-50"
                >
                  {link.label}
                </a>
              ))}
              {mounted && isLoggedIn ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-3 text-center text-sm font-bold text-white shadow-md shadow-[#1E6B9A]/20 transition-all hover:bg-[#15577E]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.myTrips")}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); openAuthModal({ mode: "login" }); }}
                    className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    {t("nav.login")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); openAuthModal({ mode: "signup" }); }}
                    className="mt-1 rounded-full bg-[#1E6B9A] px-5 py-3 text-center text-sm font-bold text-white shadow-md shadow-[#1E6B9A]/20 transition-all hover:bg-[#15577E] hover:shadow-lg hover:shadow-[#1E6B9A]/30"
                  >
                    {t("nav.startFree")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      
    </header>
  );
}
