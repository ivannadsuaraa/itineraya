import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";
import { AuthModalRouteSync } from "@/components/auth/AuthModalRouteSync";
import { Toaster } from "@/components/ui/sonner";
import { RouteTransition } from "@/components/ui/RouteTransition";
import i18n from "@/i18n";
import { captureReferralFromLocation } from "@/lib/referral";

// i18n.t directo (no useTranslation): estas pantallas pueden renderizarse
// fuera de los providers cuando el árbol entero falla.
function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 text-center">
      <span className="text-6xl" aria-hidden>
        ✈️
      </span>
      <div className="mt-3 font-display text-7xl font-bold text-[#0c1a2e]">404</div>
      <h1 className="mt-4 font-display text-2xl font-bold text-[#0c1a2e]">
        {i18n.t("errors.notFoundTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-slate-500">{i18n.t("errors.notFoundBody")}</p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95"
      >
        {i18n.t("errors.backHome")}
      </Link>
      <p className="mt-6 text-xs font-medium text-slate-400">
        {i18n.t("errors.notFoundSubtitleExtra")}
      </p>
      <div className="mt-2 flex items-center gap-4 text-sm font-semibold text-[#0ea5e9]">
        <Link to="/explore" className="hover:underline">
          {i18n.t("nav.explore")}
        </Link>
        <span className="text-slate-300">·</span>
        <Link to="/pricing" className="hover:underline">
          {i18n.t("nav.pricing")}
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-sky-950 to-sky-900 px-4 text-center">
      <img src="/itineraya-mark.png" alt="Itineraya" className="mb-6 h-12 w-auto opacity-80" />
      <h1 className="font-display text-2xl font-bold text-white">{i18n.t("errors.errorTitle")}</h1>
      <p className="mt-2 max-w-sm text-sky-400">{i18n.t("errors.errorBody")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-sky-900 shadow-lg transition hover:bg-sky-50 active:scale-95"
        >
          {i18n.t("errors.retry")}
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
        >
          {i18n.t("errors.backHome")}
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Itineraya — Tu itinerario de viaje personalizado con IA" },
      {
        name: "description",
        content: "Genera tu itinerario de viaje perfecto en segundos con inteligencia artificial",
      },
      { name: "author", content: "Itineraya" },
      { name: "theme-color", content: "#0c4a6e" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Itineraya" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:site_name", content: "Itineraya" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Itineraya — Tu itinerario de viaje personalizado con IA" },
      {
        property: "og:description",
        content: "Genera tu itinerario de viaje perfecto en segundos con inteligencia artificial",
      },
      { property: "og:url", content: "https://itineraya.com" },
      // og-image.jpg es el único asset con proporción real 1200×630; el logo
      // cuadrado se recortaba mal en las previews de WhatsApp/Twitter.
      { property: "og:image", content: "https://itineraya.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Itineraya — Tu itinerario de viaje personalizado con IA",
      },
      { property: "og:locale", content: "es_ES" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/itineraya-mark.png" },
      { rel: "apple-touch-icon", href: "/itineraya-mark.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Runs once per fresh page load — shared links are always opened as a new
  // navigation from outside the app, so this is the right place to catch them.
  useEffect(() => {
    captureReferralFromLocation();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <LanguageProvider>
          <AuthModalProvider>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes.
                ErrorBoundary aquí es la red de seguridad de última instancia para
                toda la app — cualquier ruta que la rompa cae aquí en vez de
                dejar una pantalla en blanco. */}
            <ErrorBoundary>
              <RouteTransition>
                <Outlet />
              </RouteTransition>
            </ErrorBoundary>
            <AuthModalRouteSync />
            <CookieBanner />
            <Toaster position="top-center" richColors />
          </AuthModalProvider>
        </LanguageProvider>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
