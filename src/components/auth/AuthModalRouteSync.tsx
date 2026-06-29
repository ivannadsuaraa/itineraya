import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { useAuthModal } from "./AuthModalProvider";
import type { AuthModalMode } from "@/components/AuthModal";

/**
 * Some flows (e.g. the _authenticated route guard) can't render a modal
 * directly — they redirect before anything mounts. They do so by sending the
 * user to a URL with ?authModal=<mode>&return_to=<path> search params. This
 * component watches for those params anywhere in the app, opens the global
 * auth modal, and strips the params from the URL so a refresh/back doesn't
 * reopen it.
 */
export function AuthModalRouteSync() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });

  useEffect(() => {
    const mode = search?.authModal as AuthModalMode | undefined;
    if (!mode) return;
    const returnTo = typeof search?.return_to === "string" ? search.return_to : undefined;
    openAuthModal({ mode, returnTo });
    const rest = { ...search };
    delete rest.authModal;
    delete rest.return_to;
    router.navigate({ to: router.state.location.pathname, search: rest as never, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.authModal]);

  return null;
}
