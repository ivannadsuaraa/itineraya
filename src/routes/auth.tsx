import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? ("signup" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title: "Iniciar sesión – Itineraya" },
      { name: "description", content: "Accede a Itineraya para crear itinerarios de viaje personalizados con IA." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/email-confirmed`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSignupSent(true);
        toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo salió mal";
      toast.error(msg.includes("Invalid login") ? "Email o contraseña incorrectos" : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      // OAuth broker (/~oauth/*) only exists on Lovable infrastructure.
      // On custom domains hosted elsewhere (e.g. Vercel), force the callback
      // through the lovable.app domain, then bounce the user back.
      const host = window.location.hostname;
      const isLovableHost = host.endsWith(".lovable.app") || host === "localhost" || host.startsWith("127.");
      const lovableOrigin = "https://itineraya.lovable.app";
      const currentOrigin = window.location.origin;
      const redirectUri = isLovableHost
        ? currentOrigin
        : `${lovableOrigin}/auth?return_to=${encodeURIComponent(currentOrigin + "/dashboard")}`;

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUri,
      });
      if (result.error) {
        toast.error("No se pudo iniciar sesión con Google");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("No se pudo iniciar sesión con Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }}
        />
      </div>

      {/* Back link */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm backdrop-blur-md transition hover:bg-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Inicio
      </Link>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center gap-2 text-sky-900"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E6B9A] shadow-lg shadow-[#1E6B9A]/30">
            <Plane className="h-7 w-7 rotate-[-45deg] text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">Itineraya</span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full rounded-3xl bg-white/80 p-8 shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60"
        >
          {signupSent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                <Mail className="h-8 w-8 text-[#1E6B9A]" />
              </div>
              <h1 className="font-display text-2xl font-bold text-sky-900">Revisa tu email</h1>
              <p className="mt-3 text-sm text-sky-700">
                Te hemos enviado un enlace de confirmación a <span className="font-semibold">{email}</span>.
                Pulsa el botón <span className="font-semibold">"Verify Email"</span> para activar tu cuenta.
              </p>
              <p className="mt-2 text-xs text-sky-500">
                ¿No lo ves? Revisa tu carpeta de spam.
              </p>
              <button
                type="button"
                onClick={() => { setSignupSent(false); setMode("login"); }}
                className="mt-6 text-sm font-semibold text-[#1E6B9A] hover:underline"
              >
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
          <>
          {/* Tabs */}
          <div className="mb-6 flex rounded-full bg-sky-50/80 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  mode === m ? "text-white" : "text-sky-700 hover:text-sky-900"
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-full bg-[#1E6B9A] shadow-md shadow-[#1E6B9A]/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{m === "login" ? "Iniciar sesión" : "Crear cuenta"}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 10 : -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-display text-2xl font-bold text-sky-900">
                {mode === "login" ? "Bienvenido de vuelta ✈️" : "Empieza tu próxima aventura 🌍"}
              </h1>
              <p className="mt-1 text-sm text-sky-600">
                {mode === "login"
                  ? "Accede para seguir planificando viajes"
                  : "Crea tu cuenta gratis en segundos"}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <Field icon={<User className="h-4 w-4" />} label="Nombre completo">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="María García"
                      className="w-full bg-transparent text-sm text-sky-900 placeholder-sky-400 outline-none"
                    />
                  </Field>
                )}
                <Field icon={<Mail className="h-4 w-4" />} label="Email">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-transparent text-sm text-sky-900 placeholder-sky-400 outline-none"
                  />
                </Field>
                <Field icon={<Lock className="h-4 w-4" />} label="Contraseña">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-sky-900 placeholder-sky-400 outline-none"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] hover:shadow-xl hover:shadow-[#1E6B9A]/30 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "login" ? (
                    "Iniciar sesión"
                  ) : (
                    "Crear cuenta gratis"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-sky-200" />
                <span className="text-xs font-medium uppercase tracking-wider text-sky-500">o</span>
                <div className="h-px flex-1 bg-sky-200" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-900 shadow-sm transition-all hover:bg-sky-50 hover:shadow-md disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    Continuar con Google
                  </>
                )}
              </button>

              <p className="mt-6 text-center text-xs text-sky-600">
                {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold text-[#1E6B9A] hover:underline"
                >
                  {mode === "login" ? "Crear una" : "Inicia sesión"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
          </>
          )}
        </motion.div>

        <p className="mt-6 text-center text-xs text-sky-600">
          Al continuar, aceptas nuestros Términos y Política de privacidad.
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-sky-700">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 transition-all focus-within:border-[#1E6B9A] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1E6B9A]/10">
        <span className="text-sky-500">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
