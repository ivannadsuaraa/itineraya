// Secuencia de 8 emails de retención (GROWTH_REPORT §6).
// Renderizado como HTML inline-styled (mismo enfoque que el email de invitación
// de tripmates) para no acoplar react-email al scheduler. es + en; fr/pt caen a en.

export type LifecycleEmailKey =
  | "welcome"
  | "activation_nudge"
  | "day3_edit"
  | "trial_expiring" // 24 h antes de que caduque el trial (conversión)
  | "trial_end"
  | "day30_habit"
  | "reactivation_60"
  | "pretrip" // clave real en el log: pretrip_<tripId>
  | "posttrip"; // clave real en el log: posttrip_<tripId>

export type LifecycleLang = "es" | "en";

export type LifecycleEmailParams = {
  name: string;
  destination?: string;
  tripUrl?: string;
  shareUrl?: string;
  startDate?: string;
  siteUrl: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function layout(opts: {
  title: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  footer?: string;
}): string {
  const body = opts.paragraphs
    .map((p) => `<p style="color:#0c4a6e;font-size:14px;line-height:1.65;margin:0 0 14px">${p}</p>`)
    .join("");
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#f0f9ff;border-radius:16px">
  <div style="font-weight:800;font-size:18px;color:#0c4a6e;margin-bottom:18px">Itineraya ✈️</div>
  <h1 style="color:#0c4a6e;font-size:21px;margin:0 0 14px">${opts.title}</h1>
  ${body}
  <a href="${opts.ctaUrl}" style="display:inline-block;background:#1E6B9A;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:9999px;font-weight:700;margin-top:6px">${opts.ctaLabel}</a>
  ${opts.footer ? `<p style="color:#64748b;font-size:12px;line-height:1.6;margin-top:22px">${opts.footer}</p>` : ""}
</div>`;
}

function toText(paragraphs: string[], ctaLabel: string, ctaUrl: string): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, "");
  return [...paragraphs.map(strip), "", `${strip(ctaLabel)}: ${ctaUrl}`].join("\n\n");
}

type Builder = (p: LifecycleEmailParams) => RenderedEmail;

function make(
  subject: string,
  title: string,
  paragraphs: string[],
  ctaLabel: string,
  ctaUrl: string,
  footer?: string,
): RenderedEmail {
  return {
    subject,
    html: layout({ title, paragraphs, ctaLabel, ctaUrl, footer }),
    text: toText(paragraphs, ctaLabel, ctaUrl),
  };
}

const EMAILS: Record<LifecycleEmailKey, Record<LifecycleLang, Builder>> = {
  welcome: {
    es: (p) =>
      make(
        "Tu próximo viaje empieza aquí ✈️",
        `Hola ${esc(p.name)} 👋`,
        [
          "Soy Iván, de Itineraya. Ya tienes cuenta — y <strong>7 días del plan Viajero gratis</strong>, sin tarjeta, para que lo pruebes todo: asistente IA, edición por chat y compañeros de viaje.",
          "La forma más rápida de ver la magia: dime un destino, unas fechas y un presupuesto, y en 40 segundos tienes tu itinerario día a día con mapa, horarios reales y transporte entre paradas.",
          "Un consejo: cuanto más concreto el presupuesto, mejor clava los restaurantes.",
        ],
        "Crear mi primer itinerario",
        `${p.siteUrl}/new-trip`,
        "P. D.: ¿Respondes a este email con tu próximo destino? Leo todos. — Iván",
      ),
    en: (p) =>
      make(
        "Your next trip starts here ✈️",
        `Hi ${esc(p.name)} 👋`,
        [
          "I'm Iván, from Itineraya. Your account is ready — and so are <strong>7 free days of the Viajero plan</strong>, no card needed: AI assistant, chat editing and tripmates included.",
          "The fastest way to see the magic: give it a destination, rough dates and a budget, and in ~40 seconds you'll have a day-by-day itinerary with a map, real opening hours and transit between stops.",
          "One tip: the more specific the budget, the better it nails the restaurants.",
        ],
        "Create my first itinerary",
        `${p.siteUrl}/new-trip`,
        "P.S.: Reply with your next destination — I read every email. — Iván",
      ),
  },

  activation_nudge: {
    es: (p) =>
      make(
        "40 segundos. Eso es lo que te falta para ver tu viaje.",
        `${esc(p.name)}, tu primer itinerario sigue esperando`,
        [
          "Te registraste ayer y lo entiendo: otra app más, otra promesa más. Así que te propongo un trato.",
          "Piensa en el viaje que llevas meses posponiendo. Escribe el destino. Elige fechas aproximadas — se pueden cambiar. Pulsa generar.",
          "Si en un minuto no tienes delante un plan día a día con sitios reales, horarios y mapa que te dé ganas de reservar el vuelo, borra la cuenta y no te escribo más.",
        ],
        "Probar con mi viaje pendiente",
        `${p.siteUrl}/new-trip`,
        "— Iván",
      ),
    en: (p) =>
      make(
        "40 seconds. That's all that stands between you and your trip.",
        `${esc(p.name)}, your first itinerary is still waiting`,
        [
          "You signed up yesterday, and I get it: another app, another promise. So here's a deal.",
          "Think of the trip you've been postponing for months. Type the destination. Pick rough dates — you can change them. Hit generate.",
          "If within a minute you don't have a day-by-day plan with real venues, times and a map that makes you want to book the flight, delete the account and I'll never write again.",
        ],
        "Try it with my pending trip",
        `${p.siteUrl}/new-trip`,
        "— Iván",
      ),
  },

  day3_edit: {
    es: (p) =>
      make(
        `Tu itinerario de ${p.destination ?? "tu viaje"} no está terminado (y eso es lo bueno)`,
        "La versión 2 es la buena",
        [
          `El plan que generaste para <strong>${esc(p.destination ?? "tu destino")}</strong> es la versión 1. Lo mejor de Itineraya es la versión 2.`,
          "Abre tu viaje y dile al asistente cosas como «el día 2 sin museos, más comida callejera», «añade una tarde de compras» o «hazlo más barato». Se reescribe en segundos manteniendo lo que ya te gustaba.",
          "¿Viajas acompañado? Invita a tu gente al itinerario y que opinen ahí, no en un grupo de WhatsApp con 200 mensajes.",
        ],
        `Editar mi viaje a ${p.destination ?? "mi destino"}`,
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "— Iván",
      ),
    en: (p) =>
      make(
        `Your ${p.destination ?? "trip"} itinerary isn't finished (and that's the good part)`,
        "Version 2 is the real one",
        [
          `The plan you generated for <strong>${esc(p.destination ?? "your destination")}</strong> is version 1. The best part of Itineraya is version 2.`,
          "Open your trip and tell the assistant things like “day 2 without museums, more street food”, “add an afternoon of shopping” or “make it cheaper”. It rewrites in seconds, keeping what you already liked.",
          "Traveling with others? Invite them to the itinerary so the debate happens there — not in a 200-message group chat.",
        ],
        `Edit my ${p.destination ?? "trip"}`,
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "— Iván",
      ),
  },

  trial_expiring: {
    es: (p) =>
      make(
        "Mañana pierdes el asistente IA — 30 segundos para decidir",
        `${esc(p.name)}, tu semana Viajero acaba mañana`,
        [
          "Mañana a esta hora, tu cuenta vuelve al plan gratuito. Tus viajes no se tocan — pero el asistente que edita por chat, los compañeros de viaje y los itinerarios ilimitados se pausan.",
          "Si esta semana Itineraya te ha montado aunque sea un viaje que te apetece hacer de verdad, esto es lo que cuesta mantenerlo: <strong>5,99 €/mes con el plan anual</strong>. Un café con hielo al mes, para todos los viajes del año.",
          "¿Solo tienes un viaje entre manos? También hay <strong>Pase de Viaje: 4,99 € una única vez</strong>, un itinerario completo más, sin suscripción.",
        ],
        "Mantener mi plan Viajero",
        `${p.siteUrl}/pricing?plan=viajero`,
        "Decidas lo que decidas, tus itinerarios son tuyos para siempre. — Iván",
      ),
    en: (p) =>
      make(
        "Tomorrow you lose the AI assistant — 30 seconds to decide",
        `${esc(p.name)}, your Viajero week ends tomorrow`,
        [
          "This time tomorrow, your account goes back to the free plan. Your trips stay untouched — but the chat-editing assistant, tripmates and unlimited itineraries pause.",
          "If Itineraya built you even one trip this week that you actually want to take, here's what keeping it costs: <strong>€5.99/month on the annual plan</strong>. One iced coffee a month, for every trip of the year.",
          "Only planning one trip? There's also the <strong>Trip Pass: €4.99 one-time</strong> — one more full itinerary, no subscription.",
        ],
        "Keep my Viajero plan",
        `${p.siteUrl}/pricing?plan=viajero`,
        "Whatever you decide, your itineraries are yours forever. — Iván",
      ),
  },

  trial_end: {
    es: (p) =>
      make(
        "Tu prueba de Viajero acaba hoy — esto es lo que pasa ahora",
        `${esc(p.name)}, hoy termina tu semana de plan Viajero`,
        [
          "Sin dramas: tu cuenta sigue gratis para siempre, con tus 2 itinerarios completos y tus viajes guardados.",
          "Lo que se pausa: el asistente para editar por chat, los compañeros de viaje y los itinerarios ilimitados.",
          "Si Itineraya te ha ahorrado aunque sea una tarde de Google, Viajero cuesta 5,99 €/mes (anual) — menos que un menú del día, para todos los viajes del año.",
        ],
        "Seguir con Viajero",
        `${p.siteUrl}/pricing?plan=viajero`,
        "Y si no, gracias por probarlo: el plan gratis es tuyo para siempre. — Iván",
      ),
    en: (p) =>
      make(
        "Your Viajero trial ends today — here's what happens now",
        `${esc(p.name)}, your Viajero week ends today`,
        [
          "No drama: your account stays free forever, with your 2 full itineraries and your saved trips.",
          "What pauses: the chat-editing assistant, tripmates and unlimited itineraries.",
          "If Itineraya saved you even one evening of googling, Viajero costs €5.99/month (annual) — less than a lunch menu, for every trip of the year.",
        ],
        "Keep Viajero",
        `${p.siteUrl}/pricing?plan=viajero`,
        "And if not — thanks for trying it: the free plan is yours forever. — Iván",
      ),
  },

  day30_habit: {
    es: (p) =>
      make(
        "¿Puente a la vista? Tenemos ideas.",
        `Un mes con nosotros, ${esc(p.name)}`,
        [
          "Los usuarios que más partido le sacan a Itineraya no la usan solo para EL viaje del año — la usan para decidir: «¿me da el presupuesto para X?», «¿qué hago 3 días en Y?».",
          "Prueba el modo Inspire: dile tu presupuesto, el mes y qué te apetece (playa, comida, fiesta…) y te propone 3 destinos con puntuación de compatibilidad.",
        ],
        "Sorpréndeme",
        `${p.siteUrl}/inspire`,
        "— Iván",
      ),
    en: (p) =>
      make(
        "Long weekend coming up? We've got ideas.",
        `One month with us, ${esc(p.name)}`,
        [
          "The people who get the most out of Itineraya don't save it for THE trip of the year — they use it to decide: “can my budget do X?”, “what would 3 days in Y look like?”.",
          "Try Inspire mode: give it your budget, the month and the vibe (beach, food, party…) and it proposes 3 destinations with a compatibility score.",
        ],
        "Surprise me",
        `${p.siteUrl}/inspire`,
        "— Iván",
      ),
  },

  reactivation_60: {
    es: (p) =>
      make(
        `${esc(p.name)}, tu viaje a ${p.destination ?? "tu último destino"} sigue aquí`,
        "Hace dos meses planeaste un viaje…",
        [
          `Hace dos meses planeaste <strong>${esc(p.destination ?? "un viaje")}</strong> y luego… la vida, ya sabemos.`,
          "Dos noticias desde entonces: los itinerarios ahora salen también en francés y portugués, y la comunidad ha publicado viajes nuevos que puedes copiar y adaptar en un clic.",
          "Tu itinerario sigue guardado, listo para retomar o para convertirse en otro destino.",
        ],
        "Ver mi viaje",
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "¿No planeas viajar? Responde a este correo y bajo el ritmo de emails. — Iván",
      ),
    en: (p) =>
      make(
        `${esc(p.name)}, your ${p.destination ?? "last"} trip is still here`,
        "Two months ago you planned a trip…",
        [
          `Two months ago you planned <strong>${esc(p.destination ?? "a trip")}</strong> and then… life, we know.`,
          "Two things happened since: itineraries now come in French and Portuguese too, and the community has published new trips you can copy and adapt in one click.",
          "Your itinerary is still saved — ready to pick up, or to become another destination.",
        ],
        "See my trip",
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "Not planning to travel? Reply to this email and I'll slow down. — Iván",
      ),
  },

  pretrip: {
    es: (p) =>
      make(
        `7 días para ${p.destination ?? "tu viaje"} 🎒 — tu checklist inteligente`,
        `¡Ya casi, ${esc(p.name)}!`,
        [
          `El ${esc(p.startDate ?? "próximo día")} empieza tu viaje a <strong>${esc(p.destination ?? "tu destino")}</strong>. Repaso rápido:`,
          "☐ Tu itinerario está al día — ¿algún cambio de última hora? El asistente lo ajusta en segundos.<br/>☐ Descarga las postales de cada día para llevarlas offline.<br/>☐ Comparte el enlace con quienes viajan contigo.<br/>☐ Si el tiempo cambia, el copiloto te replantea el día sobre la marcha.",
        ],
        "Repasar mi itinerario",
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "Buen viaje. De verdad. — Iván",
      ),
    en: (p) =>
      make(
        `7 days to ${p.destination ?? "your trip"} 🎒 — your smart checklist`,
        `Almost there, ${esc(p.name)}!`,
        [
          `Your trip to <strong>${esc(p.destination ?? "your destination")}</strong> starts on ${esc(p.startDate ?? "soon")}. Quick run-through:`,
          "☐ Your itinerary is up to date — any last-minute change? The assistant adjusts it in seconds.<br/>☐ Download each day's postcard to carry offline.<br/>☐ Share the link with everyone traveling with you.<br/>☐ If the weather turns, the copilot replans your day on the go.",
        ],
        "Review my itinerary",
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "Have a great trip. Truly. — Iván",
      ),
  },

  posttrip: {
    es: (p) =>
      make(
        `¿Qué tal ${p.destination ?? "el viaje"}? Una cosa más…`,
        `Bienvenido de vuelta, ${esc(p.name)}`,
        [
          `Esperamos que <strong>${esc(p.destination ?? "tu destino")}</strong> haya estado a la altura. Dos favores de 30 segundos:`,
          "1) Marca en tu itinerario lo que hiciste de verdad — así tus próximos planes aprenden de tus gustos.",
          `2) <strong>Publica tu viaje en el feed</strong>: alguien está ahora mismo dudando si ir a ${esc(p.destination ?? "ese destino")}, y tu itinerario real vale más que 10 blogs. Cada persona que lo copie la verás en tu contador de vistas.`,
        ],
        "Publicar mi viaje",
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "¿Y el próximo destino? Tenemos ideas… — Iván",
      ),
    en: (p) =>
      make(
        `How was ${p.destination ?? "the trip"}? One more thing…`,
        `Welcome back, ${esc(p.name)}`,
        [
          `We hope <strong>${esc(p.destination ?? "your destination")}</strong> lived up to it. Two 30-second favors:`,
          "1) Mark what you actually did in your itinerary — your next plans learn from your taste.",
          `2) <strong>Publish your trip to the feed</strong>: someone is deciding right now whether to go to ${esc(p.destination ?? "that destination")}, and your real itinerary beats 10 blog posts. You'll see every copy in your view counter.`,
        ],
        "Publish my trip",
        p.tripUrl ?? `${p.siteUrl}/dashboard`,
        "Next destination? We have ideas… — Iván",
      ),
  },
};

export function renderLifecycleEmail(
  key: LifecycleEmailKey,
  lang: string | null | undefined,
  params: LifecycleEmailParams,
): RenderedEmail {
  const l: LifecycleLang = (lang ?? "").toLowerCase().startsWith("es") ? "es" : "en";
  return EMAILS[key][l](params);
}

// ── Hitos de vistas (fuera de la secuencia: lo dispara getPublicTrip al
// cruzar 10/50/100 vistas). Es el email con mejor ratio de apertura posible:
// le dices al autor que su contenido está gustando. El CTA vuelve a compartir.
export function renderViewMilestoneEmail(
  lang: string | null | undefined,
  p: { name: string; destination: string; views: number; tripUrl: string; siteUrl: string },
): RenderedEmail {
  const es = (lang ?? "").toLowerCase().startsWith("es");
  if (es) {
    return make(
      `🔥 Tu itinerario de ${p.destination} ya tiene ${p.views} visitas`,
      `${esc(p.name)}, tu viaje está gustando`,
      [
        `Tu itinerario público de <strong>${esc(p.destination)}</strong> acaba de superar las <strong>${p.views} visitas</strong>. Gente real está usando tu plan para decidir su viaje.`,
        p.views >= 100
          ? "Estás en el club de los itinerarios más vistos de Itineraya. Compártelo una vez más — los itinerarios que pasan de 100 vistas suelen multiplicarse desde ahí."
          : "Los itinerarios que llegan aquí casi siempre siguen subiendo. Un empujón más (un grupo de WhatsApp, una historia de Instagram) y el contador se dispara.",
      ],
      "Ver mi itinerario y compartirlo",
      p.tripUrl,
      "Cada visita puede convertirse en un viajero que copia tu ruta. — Itineraya",
    );
  }
  return make(
    `🔥 Your ${p.destination} itinerary just hit ${p.views} views`,
    `${esc(p.name)}, your trip is taking off`,
    [
      `Your public <strong>${esc(p.destination)}</strong> itinerary just passed <strong>${p.views} views</strong>. Real people are using your plan to decide their trip.`,
      p.views >= 100
        ? "You're in the club of Itineraya's most-viewed itineraries. Share it once more — itineraries that pass 100 views tend to snowball from there."
        : "Itineraries that get here almost always keep climbing. One more push (a WhatsApp group, an Instagram story) and the counter takes off.",
    ],
    "See my itinerary and share it",
    p.tripUrl,
    "Every view can become a traveler copying your route. — Itineraya",
  );
}
