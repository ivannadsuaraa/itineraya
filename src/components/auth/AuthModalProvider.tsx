import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthModal, type AuthModalMode } from "@/components/AuthModal";

type OpenOptions = {
  mode?: AuthModalMode;
  returnTo?: string;
  title?: string;
  description?: string;
  onAuthed?: () => void;
};

type AuthModalContextValue = {
  openAuthModal: (opts?: OpenOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean } & OpenOptions>({ open: false });

  const openAuthModal = useCallback((opts?: OpenOptions) => {
    setState({ open: true, ...opts });
  }, []);

  const closeAuthModal = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={state.open}
        onClose={closeAuthModal}
        initialMode={state.mode}
        returnTo={state.returnTo}
        title={state.title}
        description={state.description}
        onAuthed={state.onAuthed}
      />
    </AuthModalContext.Provider>
  );
}
