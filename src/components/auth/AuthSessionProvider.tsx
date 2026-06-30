import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthSessionContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

/**
 * Single app-wide `onAuthStateChange` subscription. Each call site used to run
 * its own `getUser()`/`getSession()` on mount, which races GoTrueClient's
 * internal single-flight init and can deadlock it permanently (auth calls
 * never resolve again for the rest of the session). `onAuthStateChange` emits
 * `INITIAL_SESSION` once the client has initialized, so one listener here is
 * enough to cover both the initial state and subsequent changes.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSessionContextValue>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) throw new Error("useAuthSession must be used within an AuthSessionProvider");
  return ctx;
}
