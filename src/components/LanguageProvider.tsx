import { useEffect, type ReactNode } from "react";
import i18n, { normalizeLang, type AppLang } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "itineraya:lang";

function readInitialLang(): AppLang {
  if (typeof window === "undefined") return "es";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeLang(stored);
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language;
  return normalizeLang(nav);
}

function applyLang(lang: AppLang) {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Apply locally cached language immediately.
    applyLang(readInitialLang());

    // Then try to sync from the authenticated user's profile.
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", data.user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profile?.language) applyLang(normalizeLang(profile.language));
      } catch {
        /* ignore */
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.language) applyLang(normalizeLang(profile.language));
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

export async function setAppLanguage(lang: AppLang) {
  applyLang(lang);
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("profiles").update({ language: lang }).eq("id", data.user.id);
  }
}
