import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad – Itineraya" },
      {
        name: "description",
        content:
          "Política de privacidad de Itineraya conforme al RGPD y la legislación española. Qué datos recopilamos, cómo los usamos y tus derechos.",
      },
      { property: "og:title", content: "Política de Privacidad – Itineraya" },
      {
        property: "og:description",
        content: "Cómo Itineraya protege tus datos personales según el RGPD.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { i18n } = useTranslation();
  const isEs = i18n.language?.startsWith("es");
  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 to-white">
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
          {isEs ? <PrivacyEs /> : <PrivacyEn />}
        </article>
      </main>
    </div>
  );
}

function PrivacyEs() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p>
        <strong>Última actualización:</strong> 18 de junio de 2026
      </p>
      <p>
        En <strong>Itineraya</strong> nos tomamos muy en serio la protección de tus
        datos personales. Esta Política de Privacidad explica qué información
        recopilamos, cómo la utilizamos y qué derechos tienes, de conformidad con
        el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de Protección
        de Datos Personales y garantía de los derechos digitales (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Titular:</strong> Itineraya</li>
        <li><strong>Correo de contacto:</strong> privacy@itineraya.com</li>
        <li><strong>Sitio web:</strong> https://itineraya.com</li>
      </ul>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y credenciales de autenticación (incluido inicio de sesión con Google).</li>
        <li><strong>Datos de viaje:</strong> destinos, fechas, preferencias y contenidos que generas dentro de la app.</li>
        <li><strong>Datos de pago:</strong> gestionados directamente por nuestro proveedor Stripe; no almacenamos los datos completos de tu tarjeta.</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador, registros de uso y errores.</li>
      </ul>

      <h2>3. Finalidades y base legal</h2>
      <ul>
        <li><strong>Prestación del servicio</strong> (ejecución de contrato): crear y gestionar tu cuenta, generar itinerarios y asistirte durante el viaje.</li>
        <li><strong>Pagos y facturación</strong> (obligación legal y contrato): procesar suscripciones y emitir comprobantes.</li>
        <li><strong>Mejora del producto</strong> (interés legítimo): analítica agregada y prevención de fraude.</li>
        <li><strong>Comunicaciones</strong> (consentimiento): novedades y newsletter, solo si te suscribes.</li>
      </ul>

      <h2>4. Conservación de los datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Tras la baja, los
        eliminamos en un plazo máximo de 30 días, salvo los datos que debamos
        retener por obligaciones fiscales o legales (hasta 6 años).
      </p>

      <h2>5. Destinatarios y encargados del tratamiento</h2>
      <p>Compartimos datos únicamente con proveedores necesarios para operar el servicio:</p>
      <ul>
        <li><strong>Stripe</strong> (pagos)</li>
        <li><strong>Supabase</strong> (alojamiento de base de datos y autenticación)</li>
        <li><strong>Google</strong> (autenticación e inteligencia artificial Gemini)</li>
        <li><strong>Proveedores de envío de correo y analítica</strong></li>
      </ul>
      <p>
        Algunos de estos proveedores pueden realizar transferencias internacionales
        de datos fuera del EEE, siempre amparadas por Cláusulas Contractuales Tipo
        aprobadas por la Comisión Europea.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento los derechos de acceso, rectificación,
        supresión, oposición, limitación del tratamiento y portabilidad de tus
        datos, así como retirar el consentimiento prestado, escribiendo a{" "}
        <strong>privacy@itineraya.com</strong>. Tienes también derecho a presentar
        una reclamación ante la Agencia Española de Protección de Datos
        (www.aepd.es).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Utilizamos cookies técnicas estrictamente necesarias para el
        funcionamiento del servicio (sesión, autenticación, preferencias de
        idioma) y, previo consentimiento, cookies analíticas para medir el uso
        agregado. No usamos cookies publicitarias de terceros.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas apropiadas (cifrado en
        tránsito, control de accesos y copias de seguridad) para proteger tus
        datos frente a accesos no autorizados, pérdida o alteración.
      </p>

      <h2>9. Menores</h2>
      <p>
        El servicio no está dirigido a menores de 14 años. Si detectamos una
        cuenta de un menor sin consentimiento parental, la eliminaremos.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar mejoras o cambios
        legales. Te avisaremos por correo o dentro de la app cuando haya
        cambios sustanciales.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para cualquier consulta sobre privacidad, escríbenos a{" "}
        <strong>privacy@itineraya.com</strong>.
      </p>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        <strong>Last updated:</strong> June 18, 2026
      </p>
      <p>
        At <strong>Itineraya</strong> we take the protection of your personal data
        seriously. This Privacy Policy explains what information we collect, how we
        use it and your rights, in accordance with Regulation (EU) 2016/679 (GDPR)
        and the Spanish Organic Law 3/2018 on Personal Data Protection (LOPDGDD).
      </p>

      <h2>1. Data controller</h2>
      <ul>
        <li><strong>Controller:</strong> Itineraya</li>
        <li><strong>Contact email:</strong> privacy@itineraya.com</li>
        <li><strong>Website:</strong> https://itineraya.com</li>
      </ul>

      <h2>2. Data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address and authentication credentials (including Google sign-in).</li>
        <li><strong>Trip data:</strong> destinations, dates, preferences and content you generate inside the app.</li>
        <li><strong>Payment data:</strong> handled directly by our provider Stripe; we never store full card details.</li>
        <li><strong>Technical data:</strong> IP address, device type, browser, usage logs and error reports.</li>
      </ul>

      <h2>3. Purposes and legal basis</h2>
      <ul>
        <li><strong>Service delivery</strong> (contract performance): create and manage your account, generate itineraries and assist you while traveling.</li>
        <li><strong>Payments and billing</strong> (legal obligation and contract): process subscriptions and issue receipts.</li>
        <li><strong>Product improvement</strong> (legitimate interest): aggregated analytics and fraud prevention.</li>
        <li><strong>Communications</strong> (consent): newsletter and product updates, only if you opt in.</li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We keep your data while your account is active. After deletion, we
        remove it within 30 days, except for data we must keep due to tax or
        legal obligations (up to 6 years).
      </p>

      <h2>5. Recipients and processors</h2>
      <p>We only share data with providers necessary to operate the service:</p>
      <ul>
        <li><strong>Stripe</strong> (payments)</li>
        <li><strong>Supabase</strong> (database hosting and authentication)</li>
        <li><strong>Google</strong> (authentication and Gemini AI)</li>
        <li><strong>Email and analytics providers</strong></li>
      </ul>
      <p>
        Some of these providers may carry out international data transfers
        outside the EEA, always under Standard Contractual Clauses approved by
        the European Commission.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You may exercise at any time your rights of access, rectification,
        erasure, objection, restriction of processing and data portability, as
        well as withdraw consent, by writing to{" "}
        <strong>privacy@itineraya.com</strong>. You also have the right to lodge
        a complaint with the Spanish Data Protection Agency (www.aepd.es).
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use strictly necessary technical cookies for the service to operate
        (session, authentication, language preferences) and, with your consent,
        analytical cookies to measure aggregated usage. We do not use
        third-party advertising cookies.
      </p>

      <h2>8. Security</h2>
      <p>
        We apply appropriate technical and organizational measures (encryption
        in transit, access controls and backups) to protect your data from
        unauthorized access, loss or alteration.
      </p>

      <h2>9. Minors</h2>
      <p>
        The service is not intended for children under 14. If we detect an
        account from a minor without parental consent, we will delete it.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy to reflect improvements or legal changes. We
        will notify you by email or inside the app when there are material
        changes.
      </p>

      <h2>11. Contact</h2>
      <p>
        For any privacy-related inquiry, please write to{" "}
        <strong>privacy@itineraya.com</strong>.
      </p>
    </>
  );
}
