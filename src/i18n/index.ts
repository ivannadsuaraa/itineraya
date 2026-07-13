import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";

export const SUPPORTED_LANGS = ["es", "en", "fr", "pt"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const LANGUAGE_OPTIONS: { code: AppLang; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

export function normalizeLang(input: string | null | undefined): AppLang {
  if (!input) return "es";
  const code = input.toLowerCase().slice(0, 2);
  return (SUPPORTED_LANGS as readonly string[]).includes(code) ? (code as AppLang) : "es";
}

// Solo "es" va bundleado de serie: es el idioma de SSR (fallbackLng) y el del
// mercado principal, así que siempre debe estar disponible sin red. Los otros
// 3 idiomas (~130 kB de JSON en total) se cargan bajo demanda vía import()
// dinámico — evita descargarlos en cada carga de página para el ~75% de
// visitas que nunca cambian de idioma o que ya usan es por defecto.
const LOCALE_LOADERS: Record<Exclude<AppLang, "es">, () => Promise<{ default: object }>> = {
  en: () => import("./locales/en.json"),
  fr: () => import("./locales/fr.json"),
  pt: () => import("./locales/pt.json"),
};

/** Garantiza que el bundle de traducciones de `lang` está cargado antes de usarlo. */
export async function ensureLanguageLoaded(lang: AppLang): Promise<void> {
  if (lang === "es") return;
  if (i18n.hasResourceBundle(lang, "translation")) return;
  const mod = await LOCALE_LOADERS[lang]();
  i18n.addResourceBundle(lang, "translation", mod.default, true, true);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
    },
    lng: "es",
    fallbackLng: "es",
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
