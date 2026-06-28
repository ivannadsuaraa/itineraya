import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Where to send the user after successful auth. */
  onAuthed?: () => void;
};

export function AuthModal({ open, onClose, title, description, onAuthed }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/email-confirmed` },
        });
        if (error) throw error;
        toast.success(t("auth.checkEmail", { defaultValue: "Check your email to confirm." }));
        onAuthed?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      onAuthed?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-6 pt-8 pb-6">
              <h2 className="font-display text-2xl font-bold text-sky-900">
                {title ?? (mode === "signup" ? t("authModal.signupTitle", { defaultValue: "Sign up to save your trip" }) : t("authModal.loginTitle", { defaultValue: "Welcome back" }))}
              </h2>
              {description && <p className="mt-1 text-sm text-sky-700">{description}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.12A6.94 6.94 0 0 1 5.47 12c0-.74.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.16 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                {t("authModal.google", { defaultValue: "Continue with Google" })}
              </button>

              <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                {t("authModal.or", { defaultValue: "or" })}
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handleEmail} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("authModal.email", { defaultValue: "Email" })}
                    className="w-full rounded-2xl border border-sky-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("authModal.password", { defaultValue: "Password" })}
                    className="w-full rounded-2xl border border-sky-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === "signup"
                    ? t("authModal.signupBtn", { defaultValue: "Create account" })
                    : t("authModal.loginBtn", { defaultValue: "Log in" })}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500">
                {mode === "signup" ? (
                  <>
                    {t("authModal.haveAccount", { defaultValue: "Already have an account?" })}{" "}
                    <button type="button" onClick={() => setMode("login")} className="font-semibold text-[#1E6B9A] hover:underline">
                      {t("authModal.login", { defaultValue: "Log in" })}
                    </button>
                  </>
                ) : (
                  <>
                    {t("authModal.noAccount", { defaultValue: "Don't have an account?" })}{" "}
                    <button type="button" onClick={() => setMode("signup")} className="font-semibold text-[#1E6B9A] hover:underline">
                      {t("authModal.signup", { defaultValue: "Sign up" })}
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
