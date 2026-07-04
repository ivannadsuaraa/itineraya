// Contenido de las landing pages SEO por destino (/viajes/$destino).
// Páginas en español a propósito: apuntan a keywords en español (GROWTH_REPORT §2);
// las versiones EN irían bajo /en/travel/* con hreflang cuando se traduzcan.

export type SeoDay = {
  title: string;
  items: string[];
};

export type SeoFaq = {
  q: string;
  a: string;
};

export type SeoDestination = {
  slug: string;
  /** Nombre visible y valor que se precarga en el onboarding. */
  name: string;
  prefillDestination: string;
  tripTypes: string[];
  nDays: number;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  heroImage: string;
  days: SeoDay[];
  practical: string[];
  faq: SeoFaq[];
  related: string[];
};

const U = "?w=1600&q=75&auto=format&fit=crop";

export const SEO_DESTINATIONS: SeoDestination[] = [
  {
    slug: "paris",
    name: "París",
    prefillDestination: "París, Francia",
    tripTypes: ["cultural", "food", "romantic"],
    nDays: 4,
    title: "Itinerario París 4 días: qué ver día a día (2026) | Itineraya",
    metaDescription:
      "Itinerario de París en 4 días hecho por IA y revisado por viajeros: Louvre, Montmartre, Torre Eiffel y barrios secretos, con tiempos reales y transporte. Personalízalo gratis en 1 minuto.",
    h1: "Itinerario de París en 4 días: la ruta perfecta día a día",
    intro:
      "París castiga la improvisación: colas de 2 horas en el Louvre, museos cerrados los lunes o martes y barrios que merecen medio día a 40 minutos de metro entre sí. Este itinerario de 4 días agrupa la ciudad por zonas —como haría un local— para que camines más y viajes menos. Y si tus fechas, presupuesto o ritmo son otros, genera tu versión personalizada gratis en un minuto.",
    heroImage: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34${U}`,
    days: [
      {
        title: "Día 1 — Corazón clásico: Isla de la Cité y el Louvre",
        items: [
          "9:00 · Notre-Dame y Sainte-Chapelle (entra antes de las 10 para evitar grupos)",
          "11:30 · Paseo por los muelles del Sena hasta el Louvre",
          "12:30 · Comida en el Marais (Rue des Rosiers, falafel legendario)",
          "14:30 · Louvre con entrada reservada — ala Denon: Mona Lisa y Victoria de Samotracia",
          "18:00 · Jardín de las Tullerías al atardecer",
          "20:30 · Cena en un bouillon clásico (Le Petit Bouillon Pharamond)",
        ],
      },
      {
        title: "Día 2 — Montmartre y Ópera",
        items: [
          "8:30 · Sacré-Cœur al amanecer, antes de los grupos",
          "10:00 · Place du Tertre y Rue de l'Abreuvoir, el Montmartre de postal",
          "13:00 · Comida en La Boîte aux Lettres",
          "15:30 · Galerías Lafayette: la cúpula y la azotea gratuita",
          "17:00 · Ópera Garnier por dentro",
          "20:30 · Cena por Pigalle; cabaret opcional",
        ],
      },
      {
        title: "Día 3 — Torre Eiffel y orilla izquierda",
        items: [
          "8:30 · Trocadéro para la foto clásica sin multitudes",
          "10:00 · Subida a la Torre Eiffel con reserva previa",
          "12:30 · Les Invalides o Museo Rodin (jardines incluidos)",
          "14:00 · Comida en la Rue Cler",
          "16:00 · Saint-Germain-des-Prés y Jardín de Luxemburgo",
          "19:30 · Crucero de 1 hora por el Sena al atardecer",
        ],
      },
      {
        title: "Día 4 — Versalles o barrios con alma",
        items: [
          "Opción A · Versalles: RER C temprano, palacio + jardines (día completo)",
          "Opción B · Canal Saint-Martin de mañana, Le Marais a fondo por la tarde",
          "Opción B · Cementerio de Père-Lachaise para despedirte de otro París",
        ],
      },
    ],
    practical: [
      "Mejor época: abril-junio y septiembre-octubre.",
      "Presupuesto medio: 120-180 € por persona y día (alojamiento incluido).",
      "Transporte: pase Navigo Découverte si te quedas 4 días o más.",
      "Ojo: los museos nacionales cierran lunes o martes — nuestro generador lo comprueba con tus fechas exactas.",
    ],
    faq: [
      {
        q: "¿Cuántos días necesito para ver París?",
        a: "Entre 3 y 5. Con 4 días cubres lo esencial (Louvre, Torre Eiffel, Montmartre, Marais) sin correr, y te queda margen para Versalles o un barrio menos turístico.",
      },
      {
        q: "¿Es muy caro viajar a París?",
        a: "Depende del estilo: 60-90 €/día en plan mochilero (hostal y bouillons), unos 150 €/día en plan medio. Los museos nacionales son gratis el primer domingo de mes.",
      },
      {
        q: "¿Merece la pena el Paris Museum Pass?",
        a: "Sí a partir de 3 museos en 2 días: ahorra dinero y, sobre todo, colas. Si solo vas al Louvre y a la Torre Eiffel, reserva entradas sueltas online.",
      },
      {
        q: "¿Dónde alojarse en París la primera vez?",
        a: "Le Marais (céntrico y con vida), Saint-Germain (elegante) u Ópera (bien conectado). Evita alojarte lejos por ahorrar 20 €: lo pagas en horas de metro.",
      },
      {
        q: "¿París es seguro para turistas?",
        a: "Sí. La precaución real son los carteristas en Montmartre, la línea 1 de metro y los alrededores de la Torre Eiffel: bolso cerrado y móvil guardado.",
      },
    ],
    related: ["barcelona", "nueva-york", "tokio"],
  },
  {
    slug: "tokio",
    name: "Tokio",
    prefillDestination: "Tokio, Japón",
    tripTypes: ["cultural", "food", "adventure"],
    nDays: 7,
    title: "Itinerario Tokio 7 días: ruta día a día sin agobios (2026) | Itineraya",
    metaDescription:
      "Una semana en Tokio organizada por barrios: Shibuya, Asakusa, Shinjuku, Akihabara y una excursión a Nikko o Kamakura. Con JR Pass, presupuesto y consejos. Personalízalo gratis.",
    h1: "Itinerario de Tokio en 7 días: la ciudad infinita, ordenada",
    intro:
      "Tokio no se «visita»: se navega. Son 23 barrios-ciudad y el error clásico es cruzarla dos veces al día. Esta ruta agrupa por zonas conectadas por la línea Yamanote y deja un día para una escapada. Cada bloque respeta horarios reales: los templos abren a las 6, los izakayas no arrancan hasta las 18.",
    heroImage: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf${U}`,
    days: [
      {
        title: "Día 1 — Asakusa y Ueno",
        items: [
          "7:30 · Sensō-ji al amanecer, con la Nakamise-dori aún vacía",
          "10:30 · Parque de Ueno y Museo Nacional de Tokio",
          "13:30 · Comida y compras callejeras en Ameyoko",
          "17:00 · Orilla del Sumida y vistas del Skytree",
        ],
      },
      {
        title: "Día 2 — Shibuya y Harajuku",
        items: [
          "9:00 · Meiji Jingū entre los árboles, antes del gentío",
          "11:00 · Takeshita-dori y Omotesandō",
          "14:00 · El cruce de Shibuya y la estatua de Hachikō",
          "18:00 · Shibuya Sky al atardecer (reserva franja)",
        ],
      },
      {
        title: "Día 3 — Shinjuku",
        items: [
          "10:00 · Jardín Gyoen, el pulmón de la ciudad",
          "13:00 · Comida de ramen en Omoide Yokocho",
          "16:00 · Mirador gratuito del Metropolitan Government Building",
          "20:00 · Golden Gai: bares de seis taburetes",
        ],
      },
      {
        title: "Día 4 — Akihabara y Ginza",
        items: [
          "10:00 · Electrónica, retro-gaming y anime en Akihabara",
          "14:00 · teamLab (reserva con semanas de antelación)",
          "18:00 · Sushi en el mercado exterior de Tsukiji y paseo por Ginza",
        ],
      },
      {
        title: "Día 5 — Excursión: Nikko o Kamakura",
        items: [
          "Opción A · Nikko: santuario Tōshō-gū y cascada Kegon (tren 2 h)",
          "Opción B · Kamakura + Enoshima: Gran Buda, templos y costa (tren 1 h)",
        ],
      },
      {
        title: "Día 6 — Odaiba o Kichijōji + Ghibli",
        items: [
          "Opción A · Odaiba: bahía, Rainbow Bridge y Gundam a escala real",
          "Opción B · Museo Ghibli (reserva con meses) y parque Inokashira",
        ],
      },
      {
        title: "Día 7 — Compras finales y despedida",
        items: [
          "10:00 · Última ronda: Shimokitazawa vintage o depachika de Tokyo Station",
          "15:00 · Character Street y camino al aeropuerto con margen",
        ],
      },
    ],
    practical: [
      "Suica o Pasmo digital en el móvil desde el primer minuto.",
      "JR Pass solo si sigues viaje a Kioto/Osaka; para Tokio no compensa.",
      "Presupuesto: 90-140 € por persona y día.",
      "Efectivo aún necesario en izakayas y templos pequeños.",
      "Mejor época: finales de marzo (sakura, reserva con 4 meses) y noviembre (momiji).",
    ],
    faq: [
      {
        q: "¿Una semana es mucho para Tokio?",
        a: "No: es lo mínimo para verla por barrios sin correr y con una excursión. Quien va 3 días vuelve con la sensación de haber visto solo estaciones de tren.",
      },
      {
        q: "¿Necesito JR Pass solo para Tokio?",
        a: "No. El metro y la Yamanote se pagan con Suica y el JR Pass no se amortiza si no sales de la ciudad. Actívalo solo si continúas hacia Kioto u Osaka.",
      },
      {
        q: "¿Tokio o Kioto primero?",
        a: "Aterriza en Tokio para adaptarte al huso horario con la ciudad más «fácil», y deja Kioto para la segunda mitad, cuando ya te muevas como local.",
      },
      {
        q: "¿Cuánto cuesta una semana en Tokio?",
        a: "Entre 900 y 1.400 € por persona sin vuelos, en plan medio (hotel de negocios, comidas locales, alguna actividad de pago).",
      },
      {
        q: "¿Se puede viajar a Japón sin hablar japonés?",
        a: "Sí: con Google Maps para trenes y un traductor en el móvil se resuelve todo. La señalización en inglés es excelente en Tokio.",
      },
    ],
    related: ["bali", "paris", "nueva-york"],
  },
  {
    slug: "nueva-york",
    name: "Nueva York",
    prefillDestination: "Nueva York, Estados Unidos",
    tripTypes: ["cultural", "party", "food"],
    nDays: 5,
    title: "Itinerario Nueva York 5 días: la ruta definitiva (2026) | Itineraya",
    metaDescription:
      "5 días en Nueva York organizados de sur a norte: Lower Manhattan, Midtown, Central Park, Brooklyn y un mirador cada noche. Presupuesto realista y consejos de metro. Genera tu versión gratis.",
    h1: "Itinerario de Nueva York en 5 días (sin perder medio día en el metro)",
    intro:
      "Nueva York se recorre de sur a norte o pierdes horas bajo tierra. Cinco días bien ordenados: cada jornada es una franja de Manhattan o un borough, y cada noche un plan de skyline distinto — porque la primera vez, la ciudad se mira desde arriba.",
    heroImage: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9${U}`,
    days: [
      {
        title: "Día 1 — Lower Manhattan",
        items: [
          "7:30 · Ferry gratuito a Staten Island: la Estatua de la Libertad al amanecer",
          "10:00 · Wall Street y el Charging Bull",
          "11:30 · 9/11 Memorial y el Oculus",
          "14:00 · Comida en Stone Street",
          "18:30 · Cruzar el puente de Brooklyn al atardecer",
        ],
      },
      {
        title: "Día 2 — Midtown",
        items: [
          "9:00 · Grand Central y Biblioteca Pública",
          "10:30 · Bryant Park y Quinta Avenida",
          "13:00 · MoMA (viernes tarde con descuento)",
          "17:00 · Times Square cuando enciende (mejor de noche que de día)",
          "20:00 · Summit One Vanderbilt: el mirador espejo",
        ],
      },
      {
        title: "Día 3 — Central Park y museos",
        items: [
          "9:00 · Central Park en bici: Bethesda, Bow Bridge, Strawberry Fields",
          "12:30 · The Met (mínimo 3 horas; elige 3 alas y asume que no verás todo)",
          "17:00 · Upper West Side y Lincoln Center",
        ],
      },
      {
        title: "Día 4 — Brooklyn",
        items: [
          "10:00 · Dumbo y la foto de Manhattan Bridge en Washington Street",
          "12:30 · Smorgasburg si es fin de semana; si no, pizza en Juliana's",
          "15:00 · Williamsburg: vintage, murales y cafés",
          "19:00 · Atardecer con skyline desde Westlight",
        ],
      },
      {
        title: "Día 5 — High Line y despedida",
        items: [
          "9:30 · High Line completa desde Gansevoort",
          "11:30 · Chelsea Market para picar",
          "13:30 · Hudson Yards y Little Island",
          "18:00 · Top of the Rock: el Empire State se mira, no se sube",
        ],
      },
    ],
    practical: [
      "Metro: paga con tarjeta contactless (OMNY); tope semanal automático de 34 $.",
      "Presupuesto: 200-300 $ por persona y día con hotel en Manhattan.",
      "ESTA: solicítala con al menos 3 semanas de margen.",
      "Propinas: 18-20 % en restaurantes; está normalizado y se espera.",
      "CityPASS solo si harás 3 o más miradores/museos de pago.",
    ],
    faq: [
      {
        q: "¿5 días son suficientes para Nueva York?",
        a: "Para una primera vez, sí: Manhattan por franjas + un día de Brooklyn. Harlem, Queens y los museos que faltan son el motivo perfecto para volver.",
      },
      {
        q: "¿Dormir en Manhattan o en Brooklyn?",
        a: "Manhattan (Midtown/Chelsea) si priorizas tiempo; Long Island City o Williamsburg si priorizas precio con buena conexión de metro.",
      },
      {
        q: "¿Cuánto cuesta una semana en Nueva York?",
        a: "Con hotel medio, 1.800-2.500 € por persona sin vuelos. La partida que más varía es el alojamiento: reserva con 2-3 meses.",
      },
      {
        q: "¿Cuál es el mejor mirador?",
        a: "Summit al amanecer por los espejos, Top of the Rock al atardecer porque ves el Empire State en la foto. El Empire mejor de noche.",
      },
      {
        q: "¿Merece la pena Nueva York en diciembre?",
        a: "Es mágica (luces, pistas de hielo, escaparates) y helada: guantes, capas y un plan B indoor por día — nuestra IA ajusta el itinerario al clima de tus fechas.",
      },
    ],
    related: ["paris", "barcelona", "tokio"],
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    prefillDestination: "Barcelona, España",
    tripTypes: ["cultural", "food", "beach"],
    nDays: 3,
    title: "Itinerario Barcelona 3 días: Gaudí, Gótico y mar (2026) | Itineraya",
    metaDescription:
      "Tres días perfectos en Barcelona: Sagrada Familia y Park Güell con reservas, Barrio Gótico a pie, Barceloneta y Montjuïc. Con horarios reales y transporte. Personalízalo gratis.",
    h1: "Itinerario de Barcelona en 3 días: lo esencial sin colas",
    intro:
      "Barcelona en 3 días es factible con una condición: reservar Sagrada Familia y Park Güell antes de llegar. El resto es caminar la ciudad correcta en el orden correcto — el Gótico por la mañana antes que los grupos, la Barceloneta cuando cae el sol y Montjuïc para despedirte desde arriba.",
    heroImage: `https://images.unsplash.com/photo-1583422409516-2895a77efded${U}`,
    days: [
      {
        title: "Día 1 — Ciutat Vella y mar",
        items: [
          "9:00 · Catedral y callejones del Gótico antes de los grupos",
          "11:00 · Santa Maria del Mar y el Born",
          "12:30 · Museo Picasso (reserva online)",
          "14:00 · Tapas en La Xampanyeria",
          "18:00 · Paseo y atardecer en la Barceloneta",
        ],
      },
      {
        title: "Día 2 — Ruta Gaudí",
        items: [
          "9:00 · Sagrada Familia en el primer turno (reserva sí o sí)",
          "11:30 · Recinto modernista de Sant Pau",
          "13:30 · Comida por la dreta de l'Eixample",
          "15:30 · Passeig de Gràcia: La Pedrera y Casa Batlló (por fuera si el presupuesto aprieta)",
          "17:00 · Park Güell con la luz de la tarde",
          "21:00 · Cena en Gràcia, la villa dentro de la ciudad",
        ],
      },
      {
        title: "Día 3 — Montjuïc y La Boqueria",
        items: [
          "9:00 · La Boqueria temprano, cuando compran los cocineros",
          "11:00 · Teleférico a Montjuïc",
          "12:00 · Fundació Miró o el MNAC (vistas desde la escalinata gratis)",
          "16:00 · Poble Espanyol o jardines de Montjuïc",
          "21:00 · Font Màgica si está operativa; si no, vermut de despedida en el Poble-sec",
        ],
      },
    ],
    practical: [
      "T-casual de 10 viajes: la tarjeta que compensa para 3 días.",
      "Carteristas en las Ramblas y el metro: la única precaución seria.",
      "Comer: menú del día de 14-18 € — la mejor relación calidad-precio de Europa.",
      "Mejor época: mayo-junio y septiembre.",
      "Muchos museos son gratis los domingos por la tarde.",
    ],
    faq: [
      {
        q: "¿3 días son suficientes para Barcelona?",
        a: "Para lo esencial, sí: Gaudí, Ciutat Vella, un mercado y Montjuïc. Con un cuarto día añade Montserrat o más playa.",
      },
      {
        q: "¿Se puede entrar a la Sagrada Familia sin reserva?",
        a: "En temporada, prácticamente imposible. Reserva online con fecha y hora en cuanto tengas vuelos; el primer turno de la mañana tiene la mejor luz en el interior.",
      },
      {
        q: "¿Dónde alojarse en Barcelona?",
        a: "Eixample (cómodo y central), Gràcia (ambiente local) o el Gótico si toleras el ruido nocturno. Evita alojamientos junto a las Ramblas si valoras dormir.",
      },
      {
        q: "¿Hay playa en la propia ciudad?",
        a: "Sí, la Barceloneta y las playas del Poblenou. Para arena con menos gente, Ocata está a 25 minutos de tren.",
      },
      {
        q: "¿Qué excursión de un día merece la pena?",
        a: "Montserrat: tren + cremallera, monasterio y paisaje de otro planeta en medio día largo.",
      },
    ],
    related: ["paris", "bali", "nueva-york"],
  },
  {
    slug: "bali",
    name: "Bali",
    prefillDestination: "Bali, Indonesia",
    tripTypes: ["beach", "relax", "nature", "romantic"],
    nDays: 10,
    title: "Itinerario Bali 10 días: templos, arrozales e islas (2026) | Itineraya",
    metaDescription:
      "10 días en Bali por zonas: Ubud, Uluwatu, Munduk y las Gili o Nusa Penida. Ruta anti-atascos con presupuesto real y mejor época. Genera tu itinerario personalizado gratis.",
    h1: "Itinerario de Bali en 10 días: la isla por zonas (y sin 3 horas de scooter al día)",
    intro:
      "El error nº1 en Bali es dormir en un sitio y «hacer excursiones»: las distancias son cortas pero el tráfico es brutal. Este itinerario cambia de base 3 veces — sur, Ubud, norte e islas — para que cada mañana empiece donde está lo que quieres ver.",
    heroImage: `https://images.unsplash.com/photo-1537996194471-e657df975ab4${U}`,
    days: [
      {
        title: "Días 1-3 — El sur: Uluwatu y playas",
        items: [
          "Templo de Uluwatu al atardecer con danza kecak",
          "Playas de Bingin y Padang Padang (marea baja para las calas)",
          "Canggu si quieres cafés, surf y ambiente; Nusa Dua si quieres calma",
        ],
      },
      {
        title: "Días 4-6 — Ubud, el corazón",
        items: [
          "Arrozales de Tegalalang al amanecer (a las 7 no hay nadie)",
          "Monkey Forest y el mercado de arte",
          "Purificación en Tirta Empul",
          "Cascadas Tibumana y Kanto Lampo",
          "Clase de cocina balinesa una tarde",
        ],
      },
      {
        title: "Días 7-8 — Norte: Munduk y los lagos",
        items: [
          "Ulun Danu Beratan, el templo del lago",
          "Cascadas gemelas de Munduk (trek suave)",
          "Plantaciones de café y clima de montaña",
        ],
      },
      {
        title: "Días 9-10 — Islas: Nusa Penida o Gili",
        items: [
          "Opción A · Nusa Penida: Kelingking, Angel's Billabong y Broken Beach",
          "Opción B · Gili Trawangan/Air: snorkel con tortugas y cero coches",
        ],
      },
    ],
    practical: [
      "Conductor privado: 40-55 €/día — compartido entre 2-4 sale mejor que tres excursiones sueltas.",
      "Presupuesto: 50-90 €/día en pareja con estilo medio (villas con piscina incluidas).",
      "Mejor época: mayo-octubre (estación seca).",
      "Visado a la llegada: 35 US$, extensible.",
      "Templos: sarong y hombros cubiertos; en muchos te lo prestan en la entrada.",
    ],
    faq: [
      {
        q: "¿10 días alcanzan para Bali e islas?",
        a: "Sí, con la estructura por zonas de arriba: 3 bases + 2 días de islas. Menos de 8 días obliga a elegir entre Ubud y las islas.",
      },
      {
        q: "¿La época de lluvias arruina el viaje?",
        a: "No necesariamente: de noviembre a marzo llueve fuerte pero corto, casi siempre por la tarde. Se viaja igual con un plan flexible — la IA reordena el día según el clima.",
      },
      {
        q: "¿Bali es barato?",
        a: "Sigue siéndolo fuera de los enclaves más turísticos: comida local por 2-4 €, villas con piscina desde 40 €. Lo que sube la factura son los beach clubs y los traslados improvisados.",
      },
      {
        q: "¿Qué zona para luna de miel?",
        a: "Ubud para la parte de selva y spa, y remate en Nusa Lembongan o Gili Air para la parte de playa tranquila. Uluwatu si preferís acantilados y resorts.",
      },
      {
        q: "¿Necesito carnet internacional para alquilar scooter?",
        a: "Sí, y lo piden en los controles. Casco siempre: es la principal causa de vacaciones arruinadas en la isla.",
      },
    ],
    related: ["tokio", "barcelona", "paris"],
  },
];

export function getSeoDestination(slug: string): SeoDestination | undefined {
  return SEO_DESTINATIONS.find((d) => d.slug === slug);
}

/** Codifica el payload de prefill igual que dashboard/explore (btoa de JSON UTF-8-safe). */
export function encodePrefill(payload: Record<string, unknown>): string {
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
