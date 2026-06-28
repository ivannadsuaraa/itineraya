import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** If set, the user wanted to create a trip – redirect here after signup */
  returnTo?: string;
}

export function RegistrationModal({ open, onClose, onSuccess, returnTo }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const mapAuthError = (raw: string): string => {
    const m = raw.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return t("auth.wrongPassword");
    if (m.includes("email not confirmed")) return t("auth.notVerifiedYet");
    if (m.includes("user already registered") || m.includes("already exists")) return t("auth.emailExistsCta");
    if (m.includes("weak password") || m.includes("password should")) return t("auth.weakPassword");
    if (m.includes("rate limit") || m.includes("too many")) return t("auth.tooManyRequests");
    if (m.includes("user not found")) return t("auth.noAccountFound");
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmed`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (signUpData.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
          setErrorMsg(t("auth.emailExistsCta"));
          toast.error(t("auth.emailExistsCta"));
          return;
        }
        toast.success(t("auth.accountCreated"));
        onSuccess();
      } else {
        const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
        if (signIn.user) onSuccess();
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("auth.somethingWrong");
      const msg = mapAuthError(raw);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: returnTo
          ? `${window.location.origin}${returnTo}`
          : `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        toast.error(t("auth.googleFail"));
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) onSuccess();
    } catch {
      toast.error(t("auth.googleFail"));
      setGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-sky-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-sky-500 hover:bg-sky-50 hover:text-sky-700 transition"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-lg">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-sky-900">
              {t("auth.signupTitle")}
            </h2>
            <p className="mt-1 text-sm text-sky-600">
              {t("auth.signupSubtitle")}
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-900 shadow-sm transition-all hover:bg-sky-50 hover:shadow-md disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                {t("auth.google")}
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-sky-200" />
            <span className="text-xs font-medium uppercase tracking-wider text-sky-500">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-sky-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-sky-700">{t("auth.fullName")}</label>
                <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 transition focus-within:border-[#1E6B9A] focus-within:ring-4 focus-within:ring-[#1E6B9A]/10">
                  <User className="h-4 w-4 text-sky-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.fullNamePh")}
                    className="w-full bg-transparent text-sm text-sky-900 placeholder-sky-400 outline-none"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-sky-700">{t("auth.email")}</label>
              <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 transition focus-within:border-[#1E6B9A] focus-within:ring-4 focus-within:ring-[#1E6B9A]/10">
                <Mail className="h-4 w-4 text-sky-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPh")}
                  className="w-full bg-transparent text-sm text-sky-900 placeholder-sky-400 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-sky-700">{t("auth.password")}</label>
              <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 transition focus-within:border-[#1E6B9A] focus-within:ring-4 focus-within:ring-[#1E6B9A]/10">
                <Lock className="h-4 w-4 text-sky-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-sky-900 placeholder-sky-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-sky-500 hover:text-sky-700 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1 px-1">
                {[
                  { label: t("auth.req6"), met: password.length >= 6 },
                  { label: t("auth.reqUpper"), met: /[A-Z]/.test(password) },
                  { label: t("auth.reqDigit"), met: /[0-9]/.test(password) },
                  { label: t("auth.reqSymbol"), met: /[^A-Za-z0-9]/.test(password) },
                ].map((req) => (
                  <div key={req.label} className="flex items-center gap-2 text-xs">
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: req.met ? "#22c55e" : "#ef4444" }}
                    />
                    <span className={req.met ? "text-green-600" : "text-red-500"}>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signup" ? (
                t("auth.signupBtn")
              ) : (
                t("auth.loginBtn")
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-xs text-sky-600">
            {mode === "signup" ? t("auth.yesAccount") : t("auth.noAccount")}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setErrorMsg(null);
              }}
              className="ml-1 font-semibold text-[#1E6B9A] hover:underline"
            >
              {mode === "signup" ? t("auth.loginOne") : t("auth.createOne")}
            </button>
          </p>

          <p className="mt-3 text-center text-[10px] text-sky-500">{t("auth.terms")}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}