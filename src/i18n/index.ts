import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGS = ["es", "en"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const LANGUAGE_OPTIONS: { code: AppLang; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function normalizeLang(input: string | null | undefined): AppLang {
  if (!input) return "es";
  const code = input.toLowerCase().slice(0, 2);
  return (SUPPORTED_LANGS as readonly string[]).includes(code) ? (code as AppLang) : "es";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: "es",
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
