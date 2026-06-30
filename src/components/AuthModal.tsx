import { useEffect, useState } from "react";

import { X, Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { setPendingAuthToast } from "@/lib/post-auth-toast";

export type AuthModalMode = "signup" | "login" | "forgot";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Initial tab to show when the modal opens. Defaults to "signup". */
  initialMode?: AuthModalMode;
  /** Where to send the user after successful auth (default: /dashboard). */
  returnTo?: string;
  /** Called instead of the default returnTo navigation, when provided. */
  onAuthed?: () => void;
};

export function AuthModal({ open, onClose, title, description, initialMode, returnTo, onAuthed }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthModalMode>(initialMode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [lastResendAt, setLastResendAt] = useState(0);

  // Reset to a clean slate every time the modal is (re)opened.
  useEffect(() => {
    if (!open) return;
    setMode(initialMode ?? "signup");
    setEmail("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setSignupSent(false);
    setForgotSent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const resetPanels = () => {
    setSignupSent(false);
    setForgotSent(false);
  };

  const goToReturnTo = (toastKind: "loggedIn" | "accountCreated") => {
    setPendingAuthToast(toastKind);
    onClose();
    if (onAuthed) {
      onAuthed();
      return;
    }
    // Full reload so the _authenticated layout's beforeLoad guard re-runs
    // against the freshly-established session.
    window.location.assign(returnTo ?? "/dashboard");
  };

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

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email) return;
      setBusy(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setForgotSent(true);
        toast.success(t("auth.forgotSent"));
      } catch (err) {
        toast.error(err instanceof Error ? mapAuthError(err.message) : t("auth.somethingWrong"));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!email || !password) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmed`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          toast.error(t("auth.emailExistsCta"));
          return;
        }
        setSignupSent(true);
        toast.success(t("auth.accountCreated"));
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) goToReturnTo("loggedIn");
      }
    } catch (err) {
      toast.error(err instanceof Error ? mapAuthError(err.message) : t("auth.somethingWrong"));
    } finally {
      setBusy(false);
    }
  };

  const handleAlreadyVerified = async () => {
    if (!email || !password) {
      toast.error(t("auth.needCreds"));
      return;
    }
    setVerifyChecking(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("not confirmed")) {
          toast.error(t("auth.notVerifiedYet"));
        } else {
          toast.error(mapAuthError(error.message));
        }
        return;
      }
      if (data.user) goToReturnTo("accountCreated");
    } finally {
      setVerifyChecking(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error(t("auth.needCreds"));
      return;
    }
    if (Date.now() - lastResendAt < 30_000) {
      toast.error(t("auth.resendCooldown"));
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/email-confirmed` },
      });
      if (error) throw error;
      setLastResendAt(Date.now());
      toast.success(t("auth.resendSent"));
    } catch {
      toast.error(t("auth.resendFail"));
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      // Google hasn't responded yet, so we don't know if this is a brand
      // new account or a returning user. The authenticated layout refines
      // this to "accountCreated" if the resulting user was just created.
      setPendingAuthToast("loggedIn");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${returnTo ?? "/dashboard"}` },
      });
      if (error) {
        toast.error(error.message);
        setBusy(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
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
          {signupSent ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                <Mail className="h-8 w-8 text-[#1E6B9A]" />
              </div>
              <h2 className="font-display text-xl font-bold text-sky-900">{t("auth.checkEmail")}</h2>
              <p className="mt-3 text-sm text-sky-700">
                {t("auth.checkEmailSentTo")}
                <span className="font-semibold break-all">{email}</span>
                {t("auth.checkEmailHelp")}
              </p>
              <button
                type="button"
                onClick={handleAlreadyVerified}
                disabled={verifyChecking}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 hover:bg-[#15577E] disabled:opacity-60"
              >
                {verifyChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.alreadyVerified")}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-[#1E6B9A] hover:bg-sky-50 disabled:opacity-60"
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.resendEmail")}
              </button>
              <button
                type="button"
                onClick={() => { resetPanels(); setMode("login"); }}
                className="mt-4 text-sm font-semibold text-[#1E6B9A] hover:underline"
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          ) : forgotSent ? (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                <Mail className="h-8 w-8 text-[#1E6B9A]" />
              </div>
              <h2 className="font-display text-xl font-bold text-sky-900">{t("auth.checkEmail")}</h2>
              <p className="mt-3 text-sm text-sky-700">{t("auth.forgotSent")}</p>
              <button
                type="button"
                onClick={() => { resetPanels(); setMode("login"); }}
                className="mt-6 text-sm font-semibold text-[#1E6B9A] hover:underline"
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          ) : mode === "forgot" ? (
            <div>
              <button
                type="button"
                onClick={() => { resetPanels(); setMode("login"); }}
                className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1E6B9A] hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> {t("auth.backToLoginShort")}
              </button>
              <h2 className="font-display text-xl font-bold text-sky-900">{t("auth.forgotTitle")}</h2>
              <p className="mt-1 text-sm text-sky-600">{t("auth.forgotSubtitle")}</p>
              <form onSubmit={handleEmail} className="mt-5 space-y-3">
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
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 hover:bg-[#15577E] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.forgotBtn")}
                </button>
              </form>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-sky-900">
                {title ?? (mode === "signup" ? t("authModal.signupTitle", { defaultValue: "Sign up to save your trip" }) : t("authModal.loginTitle", { defaultValue: "Welcome back" }))}
              </h2>
              {description && <p className="mt-1 text-sm text-sky-700">{description}</p>}

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50 disabled:opacity-50"
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
                {mode === "signup" && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("auth.fullNamePh")}
                      className="w-full rounded-2xl border border-sky-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                    />
                  </div>
                )}
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
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("authModal.password", { defaultValue: "Password" })}
                    className="w-full rounded-2xl border border-sky-200 bg-white py-3 pl-10 pr-9 text-sm outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-sky-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { resetPanels(); setMode("forgot"); }}
                      className="text-xs font-semibold text-[#1E6B9A] hover:underline"
                    >
                      {t("auth.forgot")}
                    </button>
                  </div>
                )}
                {mode === "signup" && (
                  <div className="space-y-1 px-1">
                    {[
                      { label: t("auth.req6"), met: password.length >= 6 },
                      { label: t("auth.reqUpper"), met: /[A-Z]/.test(password) },
                      { label: t("auth.reqDigit"), met: /[0-9]/.test(password) },
                      { label: t("auth.reqSymbol"), met: /[^A-Za-z0-9]/.test(password) },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-2 text-xs">
                        <div className={`h-1.5 w-1.5 rounded-full ${req.met ? "bg-green-500" : "bg-red-500"}`} />
                        <span className={req.met ? "text-green-600" : "text-red-500"}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 hover:bg-[#15577E] disabled:opacity-50"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
