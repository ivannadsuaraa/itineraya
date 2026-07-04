import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies – Itineraya" },
      {
        name: "description",
        content:
          "Política de cookies de Itineraya: qué cookies usamos, con qué finalidad y cómo gestionarlas.",
      },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <div className="min-h-dvh bg-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-32 pb-16 sm:px-6 sm:pt-40">
        <h1 className="font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
          Política de Cookies
        </h1>
        <p className="mt-3 text-sm text-sky-500">
          Última actualización: {new Date().toLocaleDateString("es-ES")}
        </p>

        <div className="prose prose-sky mt-8 max-w-none text-sky-800">
          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que un sitio web guarda en tu dispositivo
            cuando lo visitas. Sirven para que la web funcione correctamente, recordar tus
            preferencias y obtener información estadística sobre su uso.
          </p>

          <h2>2. Tipos de cookies que utilizamos</h2>
          <ul>
            <li>
              <strong>Necesarias:</strong> imprescindibles para el funcionamiento del sitio
              (sesión, idioma, consentimiento). No requieren consentimiento.
            </li>
            <li>
              <strong>Analíticas:</strong> nos permiten medir y entender cómo interactúan los
              usuarios con la web para mejorarla.
            </li>
            <li>
              <strong>Marketing:</strong> se utilizan para mostrar publicidad relevante y medir
              campañas. Solo se activan si las aceptas.
            </li>
          </ul>

          <h2>3. Base legal</h2>
          <p>
            De acuerdo con el RGPD y la LSSI, las cookies no necesarias requieren tu
            consentimiento previo, expreso y revocable. Puedes aceptarlas, rechazarlas o
            personalizar tu elección desde el banner de cookies.
          </p>

          <h2>4. Gestión de cookies</h2>
          <p>
            Puedes cambiar tus preferencias en cualquier momento borrando los datos de tu
            navegador para este sitio: al volver a entrar, el banner aparecerá de nuevo.
            También puedes bloquear o eliminar cookies desde la configuración de tu navegador.
          </p>

          <h2>5. Cookies de terceros</h2>
          <p>
            Algunas funcionalidades pueden cargar recursos de terceros (mapas, fuentes,
            proveedores de pago). Esos terceros pueden establecer sus propias cookies. Consulta
            sus políticas para más información.
          </p>

          <h2>6. Contacto</h2>
          <p>
            Si tienes dudas sobre esta política, puedes escribirnos desde la{" "}
            <Link to="/contact" className="text-[#1E6B9A] underline">
              página de contacto
            </Link>
            .
          </p>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
