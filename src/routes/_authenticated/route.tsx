import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomBar, DesktopTopNav } from "@/components/DashboardSidebar";
import { consumePendingAuthToast } from "@/lib/post-auth-toast";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/",
        // href (path + query) y no pathname: conserva p. ej. ?prefill=… cuando
        // un visitante llega al onboarding desde una landing de destino.
        search: { authModal: "login", return_to: location.href } as never,
      });
    }
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
  const { t } = useTranslation();
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const hideChrome = HIDE_CHROME_PREFIXES.some((p) => pathname.startsWith(p));
  const hideBack = hideChrome || HIDE_BACK_PATHS.has(pathname);

  // Fired once after a fresh login/signup lands here (set by AuthModal right
  // before its redirect, since a toast can't survive a full page reload).
  useEffect(() => {
    const kind = consumePendingAuthToast();
    if (!kind) return;
    let resolved = kind;
    if (kind === "loggedIn" && user.created_at && user.last_sign_in_at) {
      const justCreated =
        Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime()) <
        10_000;
      if (justCreated) resolved = "accountCreated";
    }
    toast.success(
      resolved === "accountCreated" ? t("auth.accountReadyToast") : t("auth.loggedInToast"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!hideChrome && <DesktopTopNav />}
      {!hideChrome && (
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/85 px-3 py-2 backdrop-blur-xl">
          {hideBack ? (
            <span className="h-11 w-11" aria-hidden />
          ) : (
            <button
              onClick={() => router.history.back()}
              aria-label={t("layout.back")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-sky-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-1.5 py-2" aria-label={t("layout.homeAria")}>
            <img src="/itineraya-mark.png" alt="" className="h-7 w-7" draggable={false} />
            <span className="font-display text-base font-bold text-sky-900">Itineraya</span>
          </Link>
          <span className="h-11 w-11" aria-hidden />
        </header>
      )}
      <div className={hideChrome ? "" : "pb-16 md:pb-0 md:pt-14"}>
        <Outlet />
      </div>
      {!hideChrome && <MobileBottomBar />}
    </>
  );
}
