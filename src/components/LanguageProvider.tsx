import { useEffect, type ReactNode } from "react";
import i18n, { ensureLanguageLoaded, normalizeLang, type AppLang } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

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

async function applyLang(lang: AppLang) {
  if (i18n.language !== lang) {
    // en/fr/pt no vienen bundleados de serie (ver src/i18n/index.ts) — hay que
    // esperar su import() dinámico antes de conmutar, o i18next renderizaría
    // brevemente con el fallback (es) mientras el JSON aún no ha llegado. Si
    // el import falla (red), seguimos en es en vez de dejar la app a medias.
    try {
      await ensureLanguageLoaded(lang);
      await i18n.changeLanguage(lang);
    } catch {
      /* ignore — se queda en el idioma actual */
    }
  }
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
  const { user, session, loading } = useAuthSession();
  const userId = user?.id ?? null;
  const accessToken = session?.access_token ?? null;

  // Apply locally cached language immediately, before auth resolves.
  useEffect(() => {
    void applyLang(readInitialLang());
  }, []);

  // Then sync from the authenticated user's profile once auth is known, and
  // again whenever it changes (login/logout). Reads `userId`/`accessToken`
  // off the shared AuthSessionProvider listener instead of running its own
  // getUser()/onAuthStateChange — see AuthSessionProvider for why concurrent
  // auth calls from multiple components can deadlock the client. The token is
  // passed explicitly so this query doesn't fall back to postgrest-js's
  // internal `getSession()` lookup either.
  useEffect(() => {
    if (loading || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        let query = supabase.from("profiles").select("language").eq("id", userId);
        if (accessToken) query = query.setHeader("Authorization", `Bearer ${accessToken}`);
        const { data: profile } = await query.maybeSingle();
        if (!cancelled && profile?.language) void applyLang(normalizeLang(profile.language));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, userId, accessToken]);

  return <>{children}</>;
}

export async function setAppLanguage(lang: AppLang) {
  await applyLang(lang);
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("profiles").update({ language: lang }).eq("id", data.user.id);
  }
}
