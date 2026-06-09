import { Plane } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="border-t border-sky-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sky-800">
            <Plane className="h-5 w-5 rotate-[-45deg]" />
            <span className="font-display text-lg font-bold tracking-tight">Itineraya</span>
          </div>
          <p className="text-sm text-sky-500">
            u00a9 {new Date().getFullYear()} Itineraya. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-sky-600 transition-colors hover:text-sky-900">
              Privacidad
            </a>
            <a href="#" className="text-sm text-sky-600 transition-colors hover:text-sky-900">
              Tuu00e9rminos
            </a>
            <a href="#" className="text-sm text-sky-600 transition-colors hover:text-sky-900">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
