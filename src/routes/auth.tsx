import { createFileRoute, redirect } from "@tanstack/react-router";

// `/auth` is kept only so old bookmarks/links (?mode=signup&return_to=...)
// keep working. It immediately redirects to the home page with the global
// auth modal opened on top of it instead of rendering a full page.
export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode: "login" | "signup" | "forgot"; return_to?: string } => {
    const mode = s.mode === "signup" ? "signup" : s.mode === "forgot" ? "forgot" : "login";
    const out: { mode: "login" | "signup" | "forgot"; return_to?: string } = { mode };
    if (typeof s.return_to === "string") out.return_to = s.return_to;
    return out;
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/",
      search: { authModal: search.mode, return_to: search.return_to } as never,
    });
  },
});
