import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Mail, Shield, FileText } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contacto – Itineraya" },
      {
        name: "description",
        content: "Contacta con el equipo de Itineraya para soporte, privacidad o consultas comerciales.",
      },
      { property: "og:title", content: "Contacto – Itineraya" },
      { property: "og:description", content: "Estamos aquí para ayudarte." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith("es");
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:text-sky-900">
              <ArrowLeft className="h-4 w-4" />
              {isEs ? "Volver" : "Back"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold text-sky-900 sm:text-4xl">
          {isEs ? "Hablemos" : "Let's talk"}
        </h1>
        <p className="mt-3 text-slate-700">
          {isEs
            ? "Estamos para ayudarte. Elige el canal que mejor se adapte a tu consulta."
            : "We're here to help. Pick the channel that fits your request best."}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ContactCard
            icon={<Mail className="h-5 w-5" />}
            title={isEs ? "Soporte general" : "General support"}
            description={isEs ? "Dudas sobre la app, planes o cuenta." : "App, plans or account questions."}
            email="hola@itineraya.com"
          />
          <ContactCard
            icon={<Shield className="h-5 w-5" />}
            title={isEs ? "Privacidad y datos" : "Privacy & data"}
            description={isEs ? "Ejercicio de derechos RGPD." : "GDPR rights and data requests."}
            email="privacy@itineraya.com"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-sky-900">
            {isEs ? "Información legal" : "Legal information"}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-sky-700">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Link to="/privacy" className="underline-offset-2 hover:underline">
                {isEs ? "Política de Privacidad" : "Privacy Policy"}
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Link to="/terms" className="underline-offset-2 hover:underline">
                {isEs ? "Términos de Servicio" : "Terms of Service"}
              </Link>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  description,
  email,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  email: string;
}) {
  return (
    <a
      href={`mailto:${email}`}
      className="group rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        {icon}
      </div>
      <h3 className="mt-4 font-medium text-sky-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <p className="mt-3 text-sm font-medium text-sky-700 group-hover:text-sky-900">{email}</p>
    </a>
  );
}
