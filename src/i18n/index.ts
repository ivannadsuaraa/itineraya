import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";

export const SUPPORTED_LANGS = ["es", "en", "fr", "de", "it", "pt"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const LANGUAGE_OPTIONS: { code: AppLang; label: string; flag: string }[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
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
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
    },
    lng: "es",
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
