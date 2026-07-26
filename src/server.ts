import "./lib/error-capture";

import { timingSafeEqual } from "node:crypto";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

// Vercel sets VERCEL_ENV to "production" only on the production domain
// (itineraya.com); every Preview Deployment (one per PR/branch, the
// *.vercel.app URLs) gets "preview" — reachable by anyone with the link,
// with none of the app's own auth/RLS bypassed (it's the same app, same
// Supabase project). See STAGING_SECURITY.md for the full audit.
const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

// Stripe calls this with its own signature verification (see
// api/public/payments/webhook.ts) — it can't complete an interactive Basic
// Auth challenge, so it must stay reachable even on preview deployments.
const BASIC_AUTH_EXEMPT_PREFIXES = ["/api/public/"];

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Compare against a fixed-length buffer first so a length mismatch alone
  // never short-circuits the real comparison and leaks length via timing.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function unauthorizedResponse(): Response {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Itineraya preview", charset="UTF-8"' },
  });
}

// Gates every Preview Deployment behind HTTP Basic Auth. Fails CLOSED: if
// the credentials aren't configured as Vercel env vars scoped to Preview,
// every request is rejected rather than silently left open — a preview
// deployment with no gate at all defeats the entire point of this check.
function checkPreviewAccess(request: Request): Response | null {
  if (!IS_PREVIEW) return null;
  const url = new URL(request.url);
  if (BASIC_AUTH_EXEMPT_PREFIXES.some((p) => url.pathname.startsWith(p))) return null;

  const expectedUser = process.env.PREVIEW_BASIC_AUTH_USER;
  const expectedPass = process.env.PREVIEW_BASIC_AUTH_PASS;
  if (!expectedUser || !expectedPass) {
    console.error(
      "[preview-auth] PREVIEW_BASIC_AUTH_USER/PASS not configured — blocking all access to this preview deployment.",
    );
    return unauthorizedResponse();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return unauthorizedResponse();

  let user: string, pass: string;
  try {
    const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    if (sep === -1) return unauthorizedResponse();
    user = decoded.slice(0, sep);
    pass = decoded.slice(sep + 1);
  } catch {
    return unauthorizedResponse();
  }

  if (!timingSafeStringEqual(user, expectedUser) || !timingSafeStringEqual(pass, expectedPass)) {
    return unauthorizedResponse();
  }
  return null;
}

// Preview (and any non-production) deployments must never end up in a
// search index: they're throwaway per-branch URLs sharing the same
// production Supabase project. X-Robots-Tag works for every response type
// (HTML, JSON, images), unlike a <meta> tag which only covers HTML pages.
function withRobotsHeaderIfNonProd(response: Response): Response {
  if (IS_PRODUCTION) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, { status: response.status, headers });
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const authFailure = checkPreviewAccess(request);
    if (authFailure) return authFailure;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withRobotsHeaderIfNonProd(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withRobotsHeaderIfNonProd(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
