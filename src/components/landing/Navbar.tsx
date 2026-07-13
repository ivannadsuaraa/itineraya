import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useScroll, useMotionValueEvent } from "framer-motion";

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

  // En iOS un tap dispara `touchend` y ~300 ms después un `click` sintético.
  // Enganchamos ambos (touchend es más fiable que click en Safari móvil para
  // botones dentro de subárboles animados), pero guardamos con un timestamp
  // para que un único tap no alterne el menú dos veces (abrir→cerrar).
  // En móvil un tap dispara `touchend` y, después, un `click` "fantasma"
  // sintético. Enganchamos ambos (touchend es más fiable en Safari iOS) pero
  // con el patrón estándar de flag: touchend alterna el menú y marca el flag;
  // el click posterior se ignora mientras el flag está activo, así un único
  // tap nunca alterna dos veces (abrir→cerrar). En desktop no hay touchend, así
  // que el flag nunca se activa y el onClick funciona con normalidad.
  const touchHandledRef = useRef(false);
  const toggleMenu = () => setOpen((o) => !o);
  const handleToggleTouch = () => {
    touchHandledRef.current = true;
    toggleMenu();
    window.setTimeout(() => {
      touchHandledRef.current = false;
    }, 700);
  };
  const handleToggleClick = () => {
    if (touchHandledRef.current) return; // ghost click tras un toque → ignorar
    toggleMenu();
  };

  // Transparente sobre el hero oscuro; sólida con blur al pasar 80 px de
  // scroll. useScroll de framer (rAF-batched) + setState solo al cruzar el
  // umbral — nunca un listener de scroll que re-renderice por frame.
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 80;
    if (next !== scrolled) setScrolled(next);
  });

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
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
    <header className="fixed top-0 left-0 right-0 z-50" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <nav
          className={`mt-4 flex items-center justify-between rounded-full px-6 py-3 transition-[background-color,box-shadow] duration-300 ${
            scrolled
              ? "bg-white/85 shadow-[0_4px_24px_rgba(46,107,138,0.10)] backdrop-blur-md"
              : "bg-white/10 shadow-none ring-1 ring-white/15 backdrop-blur-sm"
          }`}
          suppressHydrationWarning
        >
          <Link
            to={mounted && isLoggedIn ? "/dashboard" : "/"}
            className="inline-flex h-11 items-center py-1.5 -my-1.5"
          >
            {/* Sobre el hero oscuro el logo pasa a blanco (brightness-0 invert) */}
            <img
              src="/itineraya-logo.png"
              alt="Itineraya"
              className={`hidden h-8 w-auto select-none transition-[filter] duration-300 sm:block ${scrolled ? "" : "brightness-0 invert"}`}
              draggable={false}
            />
            <img
              src="/itineraya-mark.png"
              alt="Itineraya"
              className={`h-8 w-auto select-none transition-[filter] duration-300 sm:hidden ${scrolled ? "" : "brightness-0 invert"}`}
              draggable={false}
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex" suppressHydrationWarning>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  scrolled ? "text-sky-700 hover:text-sky-900" : "text-white/85 hover:text-white"
                }`}
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
                  className={`text-sm font-semibold transition-colors ${
                    scrolled ? "text-sky-700 hover:text-sky-900" : "text-white/90 hover:text-white"
                  }`}
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

          <div className="flex items-center gap-1.5 md:hidden">
            {/* Antes solo estaba dentro del menú hamburguesa — nadie lo
                encontraba. Visible directamente junto al toggle.
                Sin gate de `mounted` (a diferencia de la versión desktop de
                arriba, que ya usa un ternario con "logueado" por defecto a
                false): exigir `mounted` aquí dejaba la navbar móvil sin
                ningún CTA visible desde el primer paint hasta que el efecto
                de auth resolviera — una ventana real y notable en redes
                móviles lentas, no solo un detalle de hidratación. */}
            {!isLoggedIn && (
              <button
                type="button"
                onClick={() => openAuthModal({ mode: "login" })}
                className={`inline-flex h-11 items-center rounded-full px-3.5 text-xs font-bold transition-colors ${
                  scrolled
                    ? "bg-[#1E6B9A]/10 text-[#1E6B9A] hover:bg-[#1E6B9A]/15"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {t("nav.loginShort")}
              </button>
            )}
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={handleToggleClick}
              onTouchEnd={handleToggleTouch}
              className={`relative z-50 flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                scrolled ? "text-sky-800" : "text-white"
              }`}
              style={{ touchAction: "manipulation" }}
              aria-label={t("nav.toggleMenu")}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {open && (
        <div className="mx-4 mt-2 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md md:hidden">
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
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>
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
                  onClick={() => {
                    setOpen(false);
                    openAuthModal({ mode: "login" });
                  }}
                  className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-sky-700 hover:bg-sky-50"
                >
                  {t("nav.login")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openAuthModal({ mode: "signup" });
                  }}
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
