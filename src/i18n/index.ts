import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";

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

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      pt: { translation: pt },
    },
    lng: "es",
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
