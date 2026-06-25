import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase JS auto-handles the recovery hash on load and emits PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError(t("auth.weakPassword")); return; }
    if (password !== confirm) { setError(t("auth.passwordsMismatch")); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success(t("auth.resetSuccess"));
      setTimeout(() => navigate({ to: "/auth", search: { mode: "login" } as never }), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-sky-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-white/60 backdrop-blur-xl">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 font-display text-2xl font-bold text-sky-900">{t("auth.resetSuccess")}</h1>
          </div>
        ) : !ready ? (
          <div className="text-center py-6 text-sm text-sky-700">
            <p>{t("auth.resetInvalidLink")}</p>
            <Link to="/auth" search={{ mode: "forgot" } as never} className="mt-4 inline-block text-sm font-semibold text-[#1E6B9A] hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-sky-900">{t("auth.resetTitle")}</h1>
            <p className="mt-1 text-sm text-sky-600">{t("auth.resetSubtitle")}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white/80 px-3 py-2.5">
                <Lock className="h-4 w-4 text-sky-500" />
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.newPassword")}
                  className="w-full bg-transparent text-sm outline-none"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="text-sky-500" tabIndex={-1}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white/80 px-3 py-2.5">
                <Lock className="h-4 w-4 text-sky-500" />
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("auth.confirmPassword")}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.resetBtn")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
