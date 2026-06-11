import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, LogIn, Plane } from "lucide-react";

export const Route = createFileRoute("/email-confirmed")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Email confirmado – Itineraya" },
      { name: "description", content: "Tu email ha sido confirmado. ¡Bienvenido a Itineraya!" },
    ],
  }),
  component: EmailConfirmedPage,
});

function EmailConfirmedPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
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

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Link to="/" className="mb-8 flex flex-col items-center gap-2 text-sky-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E6B9A] shadow-lg shadow-[#1E6B9A]/30">
            <Plane className="h-6 w-6 rotate-[-45deg] text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Itineraya</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="h-11 w-11 text-emerald-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h1 className="font-display text-3xl font-bold text-sky-900">
            ¡Email verificado!
          </h1>
          <p className="mt-3 text-sky-800/80">
            Tu cuenta en <strong>Itineraya</strong> está activa. Inicia sesión para empezar a crear itinerarios de viaje increíbles.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#1E6B9A]/30 transition hover:bg-[#185a83]"
          >
            <LogIn className="h-5 w-5" />
            Iniciar sesión
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
