import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-only auth status hook. Returns `authed=true` until the first check
 * resolves to avoid SSR/hydration mismatches and content flashes.
 */
export function useAuthStatus() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAuthed(!!data.user);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setAuthed(!!session?.user);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { checked, authed };
}
