import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
  /** Custom fallback UI. If omitted, renders the default full-page friendly screen. */
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

// Class component: React error boundaries can only be implemented this way
// (no hook equivalent). i18n.t se usa directo (no useTranslation) porque una
// clase no puede llamar hooks, y porque este componente debe seguir
// funcionando aunque el error haya roto el árbol de providers por encima.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? <DefaultErrorFallback />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center bg-white px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-[#0c1a2e]">
        {i18n.t("errors.boundaryTitle")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{i18n.t("errors.boundaryBody")}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" />
          {i18n.t("errors.reloadPage")}
        </button>
        <a
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-100 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.97]"
        >
          <Home className="h-4 w-4" />
          {i18n.t("errors.backHome")}
        </a>
      </div>
    </div>
  );
}

// Fallback compacto para widgets críticos embebidos en una pantalla más
// grande (mapa, globo) — no debe tomar toda la página, solo el hueco del
// propio widget, para que el resto de la pantalla siga siendo usable.
export function InlineErrorFallback({ message }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-100">
      <AlertTriangle className="h-5 w-5 text-slate-400" />
      <p className="text-sm text-slate-500">{message ?? i18n.t("errors.widgetUnavailable")}</p>
    </div>
  );
}
