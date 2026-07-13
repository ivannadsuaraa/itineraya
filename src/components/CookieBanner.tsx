import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

type Prefs = { necessary: true; analytics: boolean; marketing: boolean };
const KEY = "itineraya:cookie-consent:v1";

function readPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Prefs;
  } catch {
    return null;
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!readPrefs()) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = (p: Prefs) => {
    savePrefs(p);
    setVisible(false);
  };

  return (
    // `pointer-events-none` en el envoltorio + `pointer-events-auto` solo en la
    // tarjeta: fuera de la tarjeta los toques atraviesan al contenido de la
    // página. La tarjeta ahora es compacta (una fila de texto + una de botones)
    // para NO cubrir CTAs de la página: antes medía ~248px de alto y tapaba
    // físicamente el botón "Siguiente" del wizard /demo en la primera visita,
    // así que el toque impactaba en el banner y no en el botón.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[2000] flex justify-center px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-sky-100 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md sm:p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-sky-700 sm:text-sm">
              <span className="font-bold text-sky-900">Tu privacidad importa. </span>
              Usamos cookies necesarias y, si lo permites, analíticas y de marketing.{" "}
              <Link to="/cookies" className="font-semibold text-[#1E6B9A] underline">
                Más info
              </Link>
              .
            </p>

            {customize && (
              <div className="mt-3 space-y-2 rounded-xl bg-sky-50/60 p-3 text-xs">
                <label className="flex items-center justify-between gap-3 opacity-70">
                  <span>
                    <span className="font-semibold text-sky-900">Necesarias</span>
                    <span className="block text-[11px] text-sky-600">
                      Siempre activas. Sesión, idioma, preferencias.
                    </span>
                  </span>
                  <input type="checkbox" checked disabled />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold text-sky-900">Analíticas</span>
                    <span className="block text-[11px] text-sky-600">
                      Nos ayudan a entender cómo se usa la web.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold text-sky-900">Marketing</span>
                    <span className="block text-[11px] text-sky-600">
                      Personalizar campañas y medir resultados.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                </label>
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => accept({ necessary: true, analytics: true, marketing: true })}
                className="rounded-full bg-[#1E6B9A] px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-[#15577E]"
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={() => accept({ necessary: true, analytics: false, marketing: false })}
                className="rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
              >
                Rechazar
              </button>
              {!customize ? (
                <button
                  type="button"
                  onClick={() => setCustomize(true)}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                >
                  Personalizar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => accept({ necessary: true, analytics, marketing })}
                  className="rounded-full bg-sky-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-800"
                >
                  Guardar selección
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => accept({ necessary: true, analytics: false, marketing: false })}
            aria-label="Cerrar"
            className="rounded-full p-1 text-sky-400 hover:bg-sky-100 hover:text-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
