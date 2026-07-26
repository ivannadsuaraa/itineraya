import "./lib/error-capture";

import { timingSafeEqual } from "node:crypto";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Vercel solo pone VERCEL_ENV="production" en el deploy de producción; los
// previews de rama/PR reciben "preview" y no existe en local (vite dev,
// `vercel dev`), así que esto nunca se activa fuera de Vercel. Ver
// STAGING_SECURITY.md.
const IS_NON_PRODUCTION_DEPLOY =
  !!process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Basic Auth opcional para previews: solo se activa si ambas variables de
// entorno están configuradas en Vercel, para no bloquear previews antes de
// que el equipo las configure.
function checkStagingAuth(request: Request): Response | null {
  if (!IS_NON_PRODUCTION_DEPLOY) return null;

  const user = process.env.STAGING_BASIC_AUTH_USER;
  const password = process.env.STAGING_BASIC_AUTH_PASSWORD;
  if (!user || !password) return null;

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex !== -1) {
      const providedUser = decoded.slice(0, separatorIndex);
      const providedPassword = decoded.slice(separatorIndex + 1);
      if (safeEqual(providedUser, user) && safeEqual(providedPassword, password)) {
        return null;
      }
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Itineraya Staging", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

// Evita que Google indexe previews/staging aunque su URL se filtre o enlace
// desde algún sitio; se aplica a toda respuesta, no solo HTML (a diferencia
// de un <meta robots>).
function withStagingHeaders(response: Response): Response {
  if (!IS_NON_PRODUCTION_DEPLOY) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
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
    const authFailure = checkStagingAuth(request);
    if (authFailure) return authFailure;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withStagingHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withStagingHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
