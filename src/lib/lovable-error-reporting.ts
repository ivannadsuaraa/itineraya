// TODO: wire up real error reporting (e.g. Sentry). For now this just makes
// sure root-boundary errors are visible in the Vercel function/runtime logs
// instead of disappearing silently.
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[root error boundary]", error, {
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...context,
  });
}
