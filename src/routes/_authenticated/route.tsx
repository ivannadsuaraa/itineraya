import { createFileRoute, Outlet, redirect, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomBar } from "@/components/DashboardSidebar";
import logoMark from "@/assets/itineraya-mark.svg";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

// Routes where the bottom nav and back arrow should be hidden (focused flows).
const HIDE_CHROME_PREFIXES = ["/onboarding", "/welcome"];
// Routes where the back arrow makes no sense (root tab destinations).
const HIDE_BACK_PATHS = new Set<string>(["/dashboard", "/explore", "/new-trip", "/profile"]);

function AuthenticatedLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const hideChrome = HIDE_CHROME_PREFIXES.some((p) => pathname.startsWith(p));
  const hideBack = hideChrome || HIDE_BACK_PATHS.has(pathname);

  return (
    <>
      {!hideChrome && (
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-3 py-2 backdrop-blur-xl">
          {hideBack ? (
            <span className="h-9 w-9" aria-hidden />
          ) : (
            <button
              onClick={() => router.history.back()}
              aria-label="Atrás"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-sky-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-1.5" aria-label="Inicio Itineraya">
            <img src={logoMark} alt="" className="h-7 w-7" draggable={false} />
            <span className="font-display text-base font-bold text-sky-900">Itineraya</span>
          </Link>
          <span className="h-9 w-9" aria-hidden />
        </header>
      )}
      <div className={hideChrome ? "" : "pb-16 md:pb-0"}>
        <Outlet />
      </div>
      {!hideChrome && <MobileBottomBar />}
    </>
  );
}
