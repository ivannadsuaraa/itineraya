// Toasts fired right before a full-page redirect (window.location.assign,
// or an external OAuth round-trip) never get to render — the page unloads
// first. We stash which message to show in sessionStorage, then the
// authenticated layout fires it once after the new page has mounted.
const KEY = "itineraya:post-auth-toast";

export type PostAuthToastKind = "loggedIn" | "accountCreated";

export function setPendingAuthToast(kind: PostAuthToastKind) {
  try {
    sessionStorage.setItem(KEY, kind);
  } catch {
    // sessionStorage unavailable (e.g. private mode) — toast just won't show.
  }
}

export function consumePendingAuthToast(): PostAuthToastKind | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (!value) return null;
    sessionStorage.removeItem(KEY);
    return value as PostAuthToastKind;
  } catch {
    return null;
  }
}
