import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Términos de Servicio – Itineraya" },
      {
        name: "description",
        content:
          "Términos y condiciones de uso de Itineraya: cuenta, suscripciones, pagos, cancelaciones y responsabilidades.",
      },
      { property: "og:title", content: "Términos de Servicio – Itineraya" },
      {
        property: "og:description",
        content: "Condiciones de uso de Itineraya, conforme a la normativa española y europea.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-sky-700 hover:text-sky-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {isEs ? "Volver" : "Back"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <article className="prose prose-sky max-w-none prose-headings:text-sky-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900">
          {isEs ? <TermsEs /> : <TermsEn />}
        </article>
      </main>
    </div>
  );
}

function TermsEs() {
  return (
    <>
      <h1>Términos de Servicio</h1>
      <p>
        <strong>Última actualización:</strong> 18 de junio de 2026
      </p>
      <p>
        Los presentes Términos regulan el acceso y uso de <strong>Itineraya</strong>{" "}
        (en adelante, el "Servicio"). Al registrarte o utilizar el Servicio,
        aceptas estos Términos. Si no estás de acuerdo, te rogamos no utilices la
        plataforma.
      </p>

      <h2>1. Titular</h2>
      <p>
        El Servicio es prestado por <strong>Itineraya</strong>, con correo de
        contacto <strong>hola@itineraya.com</strong>.
      </p>

      <h2>2. Descripción del Servicio</h2>
      <p>
        Itineraya es una plataforma que utiliza inteligencia artificial para
        generar itinerarios de viaje personalizados y asistirte durante el
        viaje. El contenido generado tiene carácter orientativo: te recomendamos
        verificar horarios, precios y disponibilidad antes de tomar decisiones.
      </p>

      <h2>3. Registro y cuenta</h2>
      <p>
        Debes ser mayor de 14 años para crear una cuenta y proporcionar
        información veraz. Eres responsable de la confidencialidad de tus
        credenciales y de toda la actividad realizada con tu cuenta.
      </p>

      <h2>4. Planes y pagos</h2>
      <ul>
        <li>Existen planes gratuitos y de pago. Las características y precios se publican en la página de Precios.</li>
        <li>Los pagos se procesan a través de <strong>Stripe</strong>. Los precios incluyen los impuestos aplicables salvo indicación contraria.</li>
        <li>Las suscripciones se renuevan automáticamente al final de cada periodo, salvo cancelación previa.</li>
      </ul>

      <h2>5. Cancelación y derecho de desistimiento</h2>
      <p>
        Puedes cancelar tu suscripción en cualquier momento desde tu cuenta. La
        cancelación es efectiva al final del periodo facturado en curso, sin
        nuevas renovaciones.
      </p>
      <p>
        De acuerdo con el artículo 103.m) del Texto Refundido de la Ley General
        para la Defensa de los Consumidores y Usuarios, al tratarse de
        contenido digital de ejecución inmediata, al iniciar el uso del Servicio
        consientes expresamente la prestación y reconoces la pérdida del
        derecho de desistimiento de 14 días una vez generado el primer
        itinerario o utilizada la funcionalidad de IA. Si no has utilizado
        ninguna funcionalidad de pago, puedes solicitar el reembolso dentro de
        los 14 días posteriores a la compra escribiendo a
        <strong> hola@itineraya.com</strong>.
      </p>

      <h2>6. Uso aceptable</h2>
      <ul>
        <li>No utilizar el Servicio para fines ilegales o que vulneren derechos de terceros.</li>
        <li>No intentar acceder a sistemas o datos sin autorización.</li>
        <li>No realizar ingeniería inversa, scraping masivo ni revender el Servicio.</li>
      </ul>
      <p>El incumplimiento puede suponer la suspensión o cancelación de tu cuenta sin reembolso.</p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        Todos los derechos sobre la plataforma, marca y software corresponden a
        Itineraya. Los itinerarios que generes son tuyos para uso personal;
        Itineraya conserva una licencia limitada para almacenarlos y mostrarlos
        en su versión pública si decides compartirlos.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        El Servicio se ofrece "tal cual". En la máxima medida permitida por la
        ley, Itineraya no responderá por daños indirectos, pérdida de
        beneficios o por la información generada por IA. No somos responsables
        de los servicios contratados con terceros (alojamientos, transporte,
        actividades).
      </p>

      <h2>9. Modificación del Servicio y los Términos</h2>
      <p>
        Podemos modificar el Servicio o estos Términos por motivos legales,
        técnicos o de mejora. Te avisaremos con antelación razonable cuando los
        cambios sean sustanciales.
      </p>

      <h2>10. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por la legislación española. Para cualquier
        controversia, las partes se someten a los Juzgados y Tribunales del
        domicilio del consumidor. También puedes acudir a la plataforma europea
        de resolución de litigios en línea:
        https://ec.europa.eu/consumers/odr.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos, escríbenos a{" "}
        <strong>hola@itineraya.com</strong>.
      </p>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>
        <strong>Last updated:</strong> June 18, 2026
      </p>
      <p>
        These Terms govern your access to and use of <strong>Itineraya</strong>{" "}
        (the "Service"). By registering or using the Service, you accept these
        Terms. If you do not agree, please do not use the platform.
      </p>

      <h2>1. Provider</h2>
      <p>
        The Service is provided by <strong>Itineraya</strong>, contact email{" "}
        <strong>hola@itineraya.com</strong>.
      </p>

      <h2>2. Service description</h2>
      <p>
        Itineraya is a platform that uses artificial intelligence to generate
        personalized travel itineraries and assist you while traveling. Generated
        content is informational: please verify schedules, prices and
        availability before making decisions.
      </p>

      <h2>3. Registration and account</h2>
      <p>
        You must be at least 14 years old to create an account and provide
        accurate information. You are responsible for keeping your credentials
        confidential and for all activity under your account.
      </p>

      <h2>4. Plans and payments</h2>
      <ul>
        <li>Free and paid plans are available. Features and prices are published on the Pricing page.</li>
        <li>Payments are processed by <strong>Stripe</strong>. Prices include applicable taxes unless otherwise stated.</li>
        <li>Subscriptions renew automatically at the end of each period unless cancelled in advance.</li>
      </ul>

      <h2>5. Cancellation and right of withdrawal</h2>
      <p>
        You may cancel your subscription at any time from your account. The
        cancellation takes effect at the end of the current billing period; no
        further renewals will occur.
      </p>
      <p>
        Pursuant to Article 103.m) of the Spanish Consumer Protection Act, since
        this is immediately-executed digital content, by starting to use the
        Service you expressly consent to its supply and acknowledge the loss of
        the 14-day right of withdrawal once the first itinerary is generated or
        the AI functionality is used. If you have not used any paid
        functionality, you may request a refund within 14 days of purchase by
        writing to <strong>hola@itineraya.com</strong>.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>Do not use the Service for illegal purposes or to infringe third-party rights.</li>
        <li>Do not attempt to access systems or data without authorization.</li>
        <li>Do not reverse-engineer, mass-scrape or resell the Service.</li>
      </ul>
      <p>Breach may result in suspension or termination of your account without refund.</p>

      <h2>7. Intellectual property</h2>
      <p>
        All rights in the platform, brand and software belong to Itineraya. The
        itineraries you generate are yours for personal use; Itineraya retains a
        limited license to store and display them in their public form if you
        choose to share them.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        The Service is provided "as is". To the maximum extent permitted by
        law, Itineraya is not liable for indirect damages, loss of profits or
        for AI-generated information. We are not responsible for services
        booked with third parties (accommodation, transport, activities).
      </p>

      <h2>9. Changes to the Service and Terms</h2>
      <p>
        We may modify the Service or these Terms for legal, technical or
        improvement reasons. We will give reasonable notice when changes are
        material.
      </p>

      <h2>10. Governing law and jurisdiction</h2>
      <p>
        These Terms are governed by Spanish law. For any dispute, the parties
        submit to the courts of the consumer's domicile. You may also use the
        European online dispute resolution platform:
        https://ec.europa.eu/consumers/odr.
      </p>

      <h2>11. Contact</h2>
      <p>
        For any question regarding these Terms, please write to{" "}
        <strong>hola@itineraya.com</strong>.
      </p>
    </>
  );
}
