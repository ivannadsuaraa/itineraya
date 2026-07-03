import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const FAQ_ES = [
  {
    q: "¿Cómo funciona Itineraya?",
    a: "Itineraya usa inteligencia artificial para generar itinerarios de viaje personalizados. Solo tienes que indicar tu destino, fechas, presupuesto y estilo de viaje. En segundos recibes un plan completo día a día con actividades, restaurantes, transportes y alojamiento.",
  },
  {
    q: "¿Es gratis usar Itineraya?",
    a: "Sí, puedes crear tu primer itinerario completamente gratis. Además, todos los usuarios nuevos tienen 7 días de acceso al plan Viajero sin necesidad de tarjeta de crédito. Después puedes elegir continuar gratis o suscribirte a un plan de pago.",
  },
  {
    q: "¿Puedo compartir mi itinerario con otras personas?",
    a: "Sí. Puedes publicar tu itinerario y compartir el enlace con quien quieras. El destinatario puede ver el plan completo, guardarlo como inspiración o crear el suyo propio basado en él.",
  },
  {
    q: "¿Qué incluye cada itinerario?",
    a: "Cada itinerario incluye: actividades por día con horarios sugeridos, restaurantes locales reales, indicaciones de transporte entre paradas, estimación de tiempos, mapa interactivo y, en los planes de pago, opciones de reserva directa.",
  },
  {
    q: "¿Puedo modificar el itinerario generado?",
    a: "Con los planes Viajero y Explorador tienes acceso al asistente IA, que te permite editar, añadir o eliminar actividades usando lenguaje natural. En el plan gratuito puedes ver el itinerario completo pero no modificarlo.",
  },
  {
    q: "¿Funciona para cualquier destino del mundo?",
    a: "Sí. Itineraya funciona para prácticamente cualquier destino del mundo: desde grandes capitales como París, Tokio o Nueva York, hasta destinos menos conocidos. La IA adapta las recomendaciones según la cultura local y la época del año.",
  },
  {
    q: "¿Puedo cancelar mi suscripción en cualquier momento?",
    a: "Por supuesto. Puedes cancelar tu suscripción cuando quieras desde tu perfil. Si cancelas, seguirás teniendo acceso hasta el final del período facturado. Además ofrecemos 30 días de devolución sin preguntas.",
  },
  {
    q: "¿Cómo se tienen en cuenta mis preferencias y presupuesto?",
    a: "Durante la creación del viaje puedes indicar tu presupuesto total, el estilo de viaje (mochilero, familiar, lujo…) y tus intereses. La IA usa todos estos datos para adaptar alojamiento, restaurantes y actividades a tu perfil.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Usamos Supabase para gestionar la autenticación y el almacenamiento de datos, con cifrado en tránsito y en reposo. No vendemos ni compartimos tus datos con terceros. Puedes leer más en nuestra política de privacidad.",
  },
];

const FAQ_EN = [
  {
    q: "How does Itineraya work?",
    a: "Itineraya uses artificial intelligence to generate personalized travel itineraries. Just tell us your destination, dates, budget and travel style. In seconds you get a complete day-by-day plan with activities, restaurants, transport and accommodation.",
  },
  {
    q: "Is Itineraya free to use?",
    a: "Yes, you can create your first itinerary completely free. Plus, all new users get 7 days of Viajero plan access with no credit card required. Afterwards you can choose to stay free or subscribe to a paid plan.",
  },
  {
    q: "Can I share my itinerary with others?",
    a: "Yes. You can publish your itinerary and share the link with anyone. The recipient can view the full plan, save it as inspiration or create their own based on it.",
  },
  {
    q: "What does each itinerary include?",
    a: "Each itinerary includes: day-by-day activities with suggested times, real local restaurants, transport directions between stops, time estimates, interactive map and, on paid plans, direct booking options.",
  },
  {
    q: "Can I modify the generated itinerary?",
    a: "With Viajero and Explorador plans you have access to the AI assistant, which lets you edit, add or remove activities using natural language. On the free plan you can view the full itinerary but cannot modify it.",
  },
  {
    q: "Does it work for any destination in the world?",
    a: "Yes. Itineraya works for virtually any destination in the world: from major capitals like Paris, Tokyo or New York, to lesser-known destinations. The AI adapts recommendations based on local culture and time of year.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Absolutely. You can cancel your subscription at any time from your profile. If you cancel, you'll keep access until the end of the billing period. We also offer a 30-day no-questions-asked refund.",
  },
  {
    q: "How are my preferences and budget taken into account?",
    a: "During trip creation you can specify your total budget, travel style (backpacker, family, luxury…) and your interests. The AI uses all this data to tailor accommodation, restaurants and activities to your profile.",
  },
];

export function FAQSection() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const faqs = isEn ? FAQ_EN : FAQ_ES;
  const [open, setOpen] = useState<number | null>(null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <section className="bg-white py-20 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1E6B9A]">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
            {isEn ? "Frequently Asked Questions" : "Preguntas frecuentes"}
          </h2>
          <p className="mt-3 text-sky-600">
            {isEn
              ? "Everything you need to know about Itineraya."
              : "Todo lo que necesitas saber sobre Itineraya."}
          </p>
        </div>

        <div className="divide-y divide-sky-100 rounded-2xl border border-sky-100 bg-white shadow-sm">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-sky-50/60"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-sky-900">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-sky-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="border-t border-sky-50 bg-sky-50/40 px-6 py-4">
                  <p className="text-sm leading-relaxed text-sky-700">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
