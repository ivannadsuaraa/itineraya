// Landings SEO — Europa (20 destinos). Mismo formato que seo-destinations.ts;
// se concatenan allí. Contenido en español: keywords objetivo en español.
import type { SeoDestination } from "./seo-destinations";

const U = "?w=1600&q=75&auto=format&fit=crop";

export const SEO_DESTINATIONS_EUROPA: SeoDestination[] = [
  {
    slug: "roma",
    name: "Roma",
    prefillDestination: "Roma, Italia",
    tripTypes: ["cultural", "food", "romantic"],
    nDays: 4,
    title: "Itinerario Roma 4 días: Coliseo, Vaticano y trastévere (2026) | Itineraya",
    metaDescription:
      "Roma en 4 días sin colas: Coliseo y Foro con reserva, Vaticano al amanecer, Trastevere de noche y la Roma barroca a pie. Con horarios reales y presupuesto. Personalízalo gratis.",
    h1: "Itinerario de Roma en 4 días: la ciudad eterna, ordenada",
    intro:
      "Roma castiga dos errores: no reservar (Coliseo y Vaticano se agotan con días de antelación) y querer verlo todo andando sin orden. Esta ruta agrupa por épocas — la Roma antigua, la barroca, la vaticana y la de barrio — para que cada día tenga sentido y los pies aguanten.",
    heroImage: `https://images.unsplash.com/photo-1552832230-c0197dd311b5${U}`,
    days: [
      {
        title: "Día 1 — Roma antigua: Coliseo, Foro y Palatino",
        items: [
          "8:30 · Coliseo en el primer turno (entrada combinada reservada online)",
          "11:00 · Foro Romano y Palatino con calma — mínimo 2 horas",
          "14:00 · Comida en el Rione Monti (Via Urbana)",
          "16:30 · Piazza Venezia y mirador del Vittoriano",
          "20:30 · Cena en Monti; carbonara seria en La Taverna dei Fori Imperiali",
        ],
      },
      {
        title: "Día 2 — Vaticano y Castel Sant'Angelo",
        items: [
          "8:00 · Museos Vaticanos con reserva (Capilla Sixtina antes del gentío)",
          "12:30 · Basílica de San Pedro y, si hay piernas, la cúpula",
          "14:30 · Comida en Borgo Pio",
          "16:30 · Castel Sant'Angelo y su puente de ángeles",
          "19:00 · Atardecer desde el puente Umberto I, el skyline clásico",
        ],
      },
      {
        title: "Día 3 — Roma barroca a pie",
        items: [
          "9:00 · Panteón al abrir, cuando aún resuena",
          "10:30 · Piazza Navona y San Luigi dei Francesi (los Caravaggio, gratis)",
          "13:30 · Comida cerca de Campo de' Fiori",
          "15:30 · Fontana di Trevi y Piazza di Spagna",
          "18:00 · Aperitivo y compras por Via del Corso",
        ],
      },
      {
        title: "Día 4 — Trastevere y despedida",
        items: [
          "9:30 · Trastevere de mañana: Santa Maria y callejones sin turistas",
          "11:30 · Subida al Gianicolo: la mejor vista gratuita de Roma",
          "13:30 · Comida en el mercado de Testaccio",
          "16:00 · Aventino: el ojo de la cerradura y el Jardín de los Naranjos",
        ],
      },
    ],
    practical: [
      "Reserva Coliseo y Vaticano en cuanto tengas vuelos: se agotan.",
      "Presupuesto medio: 110-160 € por persona y día con alojamiento.",
      "Muévete andando + metro puntual; el centro histórico se camina.",
      "Agua gratis en los nasoni (fuentes): lleva botella.",
      "Mejor época: abril-mayo y septiembre-octubre.",
    ],
    faq: [
      {
        q: "¿Cuántos días necesito para Roma?",
        a: "4 días es el punto dulce: Roma antigua, Vaticano, centro barroco y un día de barrios. Con 3 se puede, pero sacrificas Trastevere o el Aventino.",
      },
      {
        q: "¿Merece la pena el Roma Pass?",
        a: "Solo si vas a usar mucho transporte y entras a 2+ museos municipales. Para Coliseo + Vaticano suele salir mejor reservar entradas sueltas online.",
      },
      {
        q: "¿Dónde alojarse en Roma?",
        a: "Monti (céntrico con alma), Prati (junto al Vaticano, tranquilo) o Trastevere si te gusta la noche. Evita los alrededores de Termini si puedes.",
      },
      {
        q: "¿Se puede entrar gratis al Vaticano?",
        a: "La basílica de San Pedro es gratis siempre (cola de seguridad). Los Museos Vaticanos son gratis el último domingo de mes — con colas enormes.",
      },
    ],
    related: ["florencia", "venecia", "paris"],
  },
  {
    slug: "londres",
    name: "Londres",
    prefillDestination: "Londres, Reino Unido",
    tripTypes: ["cultural", "food", "party"],
    nDays: 4,
    title: "Itinerario Londres 4 días: la ruta perfecta día a día (2026) | Itineraya",
    metaDescription:
      "Londres en 4 días por zonas: Westminster, la City, museos gratis, Camden y Notting Hill. Con Oyster, presupuesto realista y qué reservar. Genera tu versión personalizada gratis.",
    h1: "Itinerario de Londres en 4 días (aprovechando los museos gratis)",
    intro:
      "Londres es cara de dormir y barata de visitar: sus mejores museos son gratis. El truco es agrupar por zonas conectadas — Westminster, South Bank, la City, los barrios del norte y del oeste — y pagar solo las atracciones que de verdad lo valen.",
    heroImage: `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad${U}`,
    days: [
      {
        title: "Día 1 — Westminster y South Bank",
        items: [
          "9:00 · Big Ben, Abadía de Westminster y Parliament Square",
          "11:00 · St James's Park hasta Buckingham (cambio de guardia si toca)",
          "13:30 · Comida en Borough Market — el mejor mercado de la ciudad",
          "15:30 · Paseo por South Bank: Tate Modern (gratis) y Shakespeare's Globe",
          "18:30 · Atardecer desde el puente de Waterloo o el Sky Garden (gratis, reserva)",
        ],
      },
      {
        title: "Día 2 — La City y el East End",
        items: [
          "9:30 · Torre de Londres (joyas de la corona a primera hora)",
          "12:00 · Tower Bridge y paseo hasta St Katharine Docks",
          "13:30 · Comida en Spitalfields Market",
          "15:00 · Brick Lane y el street art de Shoreditch",
          "20:00 · Cena india en Brick Lane o pintas por Shoreditch",
        ],
      },
      {
        title: "Día 3 — Museos y Soho",
        items: [
          "10:00 · British Museum (gratis): piedra Rosetta y Partenón, 2-3 h",
          "13:30 · Comida en Chinatown",
          "15:00 · National Gallery (gratis) y Trafalgar Square",
          "17:00 · Covent Garden y Neal's Yard",
          "20:00 · Teatro en el West End (entradas TKTS del día) o cena en Soho",
        ],
      },
      {
        title: "Día 4 — Notting Hill y Camden",
        items: [
          "9:30 · Notting Hill y Portobello Road (sábado = mercado completo)",
          "12:30 · Hyde Park y Kensington Gardens en bici",
          "14:30 · Comida y compras alternativas en Camden Market",
          "17:00 · Primrose Hill: el skyline de despedida",
        ],
      },
    ],
    practical: [
      "Paga el metro con contactless: tope diario automático (~8,50 £).",
      "Museos principales gratis: British, National Gallery, Tate, V&A, Historia Natural.",
      "Presupuesto: 140-220 € por persona y día, el hotel es lo que dispara.",
      "Reserva con antelación: Sky Garden (gratis), teatro, Torre de Londres.",
      "eSIM o roaming: el Reino Unido ya no entra en el roaming UE de todas las operadoras.",
    ],
    faq: [
      {
        q: "¿Cuántos días para ver Londres?",
        a: "4 días para lo esencial con ritmo humano. Con 5-6 añade Greenwich, Kew Gardens o un día de Harry Potter Studios (reserva con meses).",
      },
      {
        q: "¿Londres es muy caro?",
        a: "El alojamiento sí; el resto se controla: museos gratis, mercados para comer por 8-12 £ y transporte con tope diario. 150 €/día en plan medio es realista.",
      },
      {
        q: "¿Dónde alojarse en Londres?",
        a: "Zona 1-2 cerca de una estación bien conectada: South Bank/Waterloo, Bloomsbury o Shoreditch. Paddington y King's Cross son prácticos y algo más baratos.",
      },
      {
        q: "¿Necesito libras en efectivo?",
        a: "Prácticamente no: todo se paga con tarjeta o móvil, incluidos mercados y buses (que ya no aceptan efectivo).",
      },
    ],
    related: ["paris", "edimburgo", "dublin"],
  },
  {
    slug: "lisboa",
    name: "Lisboa",
    prefillDestination: "Lisboa, Portugal",
    tripTypes: ["cultural", "food", "romantic"],
    nDays: 3,
    title: "Itinerario Lisboa 3 días: Alfama, Belém y Sintra (2026) | Itineraya",
    metaDescription:
      "Lisboa en 3 días con sus cuestas ordenadas: Alfama y miradores, Belém con pastéis recién hechos, Chiado, y excursión a Sintra. Con tranvía 28, presupuesto y consejos. Gratis.",
    h1: "Itinerario de Lisboa en 3 días: colinas, fado y pastéis",
    intro:
      "Lisboa se sube y se baja: el error es cruzarla en zigzag y fundirte en cuestas. Esta ruta ordena la ciudad por colinas — Alfama y el castillo, la Baixa y el Chiado, Belém junto al río — y guarda medio día para el capricho que lo cambia todo: Sintra.",
    heroImage: `https://images.unsplash.com/photo-1585208798174-6cedd86e019a${U}`,
    days: [
      {
        title: "Día 1 — Alfama y el castillo",
        items: [
          "9:00 · Castillo de San Jorge al abrir, con la ciudad a los pies",
          "11:00 · Perderse por Alfama: mirador de Santa Luzia y Portas do Sol",
          "13:30 · Comida en una tasca de Alfama (bacalhau à brás)",
          "15:30 · Catedral Sé y tranvía 28 (mejor a media tarde, menos cola)",
          "20:30 · Fado en Alfama — casa pequeña, cena incluida",
        ],
      },
      {
        title: "Día 2 — Belém y Chiado",
        items: [
          "9:00 · Monasterio de los Jerónimos (reserva; la iglesia es gratis)",
          "11:00 · Torre de Belém y Padrão dos Descobrimentos por fuera",
          "12:00 · Pastéis de Belém recién hechos, en el obrador original",
          "14:30 · Vuelta al centro: LX Factory para comer y curiosear",
          "17:00 · Chiado y Barrio Alto; mirador de São Pedro de Alcântara",
          "20:00 · Cena en el Time Out Market si quieres probar de todo",
        ],
      },
      {
        title: "Día 3 — Sintra (excursión)",
        items: [
          "8:30 · Tren desde Rossio a Sintra (40 min); ve directo al Palacio da Pena",
          "9:30 · Palacio da Pena y su parque (reserva la primera franja)",
          "13:00 · Comida en el centro de Sintra (travesseiros en Piriquita)",
          "15:00 · Quinta da Regaleira y su pozo iniciático",
          "18:30 · Vuelta a Lisboa; despedida en el mirador de Graça",
        ],
      },
    ],
    practical: [
      "Tarjeta Viva Viagem con saldo zapping: vale para metro, tranvía y tren a Sintra.",
      "Presupuesto: 80-120 € por persona y día con alojamiento.",
      "Las cuestas son serias: calzado cómodo y usa los elevadores/funiculares.",
      "En Sintra, reserva Pena online y madruga: a las 11 ya hay colas de una hora.",
      "Mejor época: marzo-junio y septiembre-octubre.",
    ],
    faq: [
      {
        q: "¿Cuántos días necesito en Lisboa?",
        a: "3 días con Sintra incluida es lo mínimo cómodo. Con 4, añade Cascais o el barrio de Marvila y baja el ritmo.",
      },
      {
        q: "¿Sintra merece un día entero?",
        a: "Sí, aunque sea medio largo: Pena + Regaleira ya llenan 5-6 horas con los traslados. Querer meter 4 palacios en un día es el error clásico.",
      },
      {
        q: "¿Dónde alojarse en Lisboa?",
        a: "Baixa/Chiado por comodidad, Alfama por encanto (con maletas, ojo a las cuestas), Príncipe Real si buscas ambiente local con calma.",
      },
      {
        q: "¿Lisboa es barata?",
        a: "Comparada con otras capitales de Europa occidental, sí: menú del día por 10-14 €, transporte barato. El alojamiento ha subido en el centro.",
      },
    ],
    related: ["oporto", "sevilla", "madrid"],
  },
  {
    slug: "amsterdam",
    name: "Ámsterdam",
    prefillDestination: "Ámsterdam, Países Bajos",
    tripTypes: ["cultural", "party", "romantic"],
    nDays: 3,
    title: "Itinerario Ámsterdam 3 días: canales, museos y bici (2026) | Itineraya",
    metaDescription:
      "3 días en Ámsterdam: Rijksmuseum y Van Gogh con reserva, canales del Jordaan, mercados y un día en bici como un local. Presupuesto y consejos reales. Personalízalo gratis.",
    h1: "Itinerario de Ámsterdam en 3 días: la ciudad de los canales, sin postureo",
    intro:
      "Ámsterdam es pequeña y se recorre en bici o a pie, pero sus dos museos estrella se agotan: Van Gogh solo vende online y el Rijksmuseum se llena. Reserva eso primero y deja el resto a los canales — que es donde de verdad está la ciudad.",
    heroImage: `https://images.unsplash.com/photo-1534351590666-13e3e96b5017${U}`,
    days: [
      {
        title: "Día 1 — Centro y barrio de los museos",
        items: [
          "9:00 · Rijksmuseum (Rembrandt y Vermeer; reserva la primera hora)",
          "12:30 · Comida rápida: broodje haring o patatas en Vleminckx",
          "14:00 · Museo Van Gogh (solo con reserva online)",
          "16:30 · Vondelpark de vuelta al centro",
          "20:00 · Cena en De Pijp: el barrio que cena tarde",
        ],
      },
      {
        title: "Día 2 — Jordaan y canales",
        items: [
          "9:15 · Casa de Ana Frank (reserva exacta 6 semanas antes)",
          "11:30 · Jordaan: las 9 Calles, patios escondidos (hofjes) y cafés marrones",
          "13:30 · Comida de quesos y appeltaart en Winkel 43",
          "15:30 · Crucero de una hora por los canales (mejor barco pequeño)",
          "18:00 · Barrio Rojo con luz de día y cerveza en un bruin café",
        ],
      },
      {
        title: "Día 3 — En bici como un local",
        items: [
          "9:30 · Alquiler de bici y ruta por el este: Plantage y molino De Gooyer",
          "11:30 · NDSM en ferry gratuito: el astillero convertido en zona creativa",
          "13:30 · Comida en el Foodhallen",
          "15:30 · Mercado Albert Cuyp y stroopwafel recién hecha",
          "17:30 · Última vuelta por los canales al atardecer, la hora dorada",
        ],
      },
    ],
    practical: [
      "Van Gogh y Ana Frank: SOLO entrada online, se agotan con semanas.",
      "Presupuesto: 120-180 € por persona y día con alojamiento.",
      "La bici manda: no camines por el carril bici ni lo cruces sin mirar.",
      "OV-chipkaart o contactless para tranvías; el centro se hace andando.",
      "Mejor época: abril (tulipanes, Keukenhof) a septiembre.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Ámsterdam?",
        a: "3 días para la ciudad. Con 4-5, excursión a Zaanse Schans (molinos), Keukenhof en primavera o Utrecht.",
      },
      {
        q: "¿Es imprescindible reservar la casa de Ana Frank?",
        a: "Sí: las entradas salen online 6 semanas antes y vuelan. Sin reserva no se entra; no existe taquilla física.",
      },
      {
        q: "¿Dónde alojarse en Ámsterdam?",
        a: "Jordaan o las 9 Calles (encanto, precio alto), De Pijp (ambiente local y comida), Oud-West (relación calidad-precio con tranvía directo).",
      },
      {
        q: "¿Merece la pena el crucero por los canales?",
        a: "Sí, una vez y de día o al atardecer: la ciudad se diseñó para verse desde el agua. Los barcos pequeños abiertos ganan por goleada a los panorámicos.",
      },
    ],
    related: ["berlin", "paris", "londres"],
  },
  {
    slug: "praga",
    name: "Praga",
    prefillDestination: "Praga, República Checa",
    tripTypes: ["cultural", "romantic", "food"],
    nDays: 3,
    title: "Itinerario Praga 3 días: castillo, puente de Carlos y cerveza (2026) | Itineraya",
    metaDescription:
      "Praga en 3 días esquivando multitudes: puente de Carlos al amanecer, castillo con calma, Ciudad Vieja, Malá Strana y las cervecerías de verdad. Presupuesto y consejos. Gratis.",
    h1: "Itinerario de Praga en 3 días: cuento gótico sin colas",
    intro:
      "Praga tiene dos ciudades: la de los grupos de turistas de 11 a 18h, y la vacía y dorada del amanecer y la noche. Este itinerario juega con los horarios — el puente de Carlos a las 7:30, el castillo a primera hora — para que veas la segunda.",
    heroImage: `https://images.unsplash.com/photo-1541849546-216549ae216d${U}`,
    days: [
      {
        title: "Día 1 — Ciudad Vieja y barrio judío",
        items: [
          "9:00 · Plaza de la Ciudad Vieja y reloj astronómico (la hora en punto)",
          "10:30 · Barrio judío: sinagogas y el viejo cementerio",
          "13:00 · Comida checa: svíčková o goulash en una hospoda local",
          "15:00 · Torre de la Pólvora y Casa Municipal (art nouveau)",
          "18:00 · Torre del ayuntamiento al atardecer: la foto de los tejados",
          "20:00 · Cerveza en U Zlatého tygra o Lokál: pilsner tirada como manda",
        ],
      },
      {
        title: "Día 2 — Castillo y Malá Strana",
        items: [
          "8:00 · Cruzar el puente de Carlos casi vacío (en serio, madruga)",
          "9:00 · Castillo de Praga: catedral de San Vito y callejón del Oro",
          "13:00 · Comida en Malá Strana",
          "15:00 · Isla de Kampa y el muro de Lennon",
          "17:00 · Subida a Petřín (funicular) y su torre mirador",
          "20:30 · Cena con vistas al río o concierto de música clásica",
        ],
      },
      {
        title: "Día 3 — Vyšehrad y la Praga local",
        items: [
          "9:30 · Fortaleza de Vyšehrad: vistas, cementerio de ilustres y cero grupos",
          "12:30 · Comida en el mercado de Náplavka (sábados) o en Vinohrady",
          "15:00 · Casa danzante y paseo por la orilla",
          "17:00 · Compras: marionetas, granates o vinilos en Žižkov",
        ],
      },
    ],
    practical: [
      "Corona checa (CZK), no euro: paga en tarjeta y rechaza el 'cobro en euros' (DCC).",
      "Presupuesto: 70-110 € por persona y día — de lo mejor de Europa en calidad-precio.",
      "Cuidado con las casas de cambio del centro: comisiones abusivas.",
      "Transporte: billete de 24/72 h barato, pero el centro se camina entero.",
      "Mejor época: abril-junio y septiembre-octubre; diciembre por los mercadillos.",
    ],
    faq: [
      {
        q: "¿Cuántos días necesito en Praga?",
        a: "3 días dan para las dos orillas con calma y un barrio local. Con 4, excursión a Kutná Hora y su osario.",
      },
      {
        q: "¿Praga es barata?",
        a: "Más que Europa occidental: cerveza a 2 €, menú por 8-12 €. El centro turístico infla precios; cruza dos calles y bajan a la mitad.",
      },
      {
        q: "¿Dónde alojarse en Praga?",
        a: "Ciudad Vieja o Malá Strana para el postal total; Vinohrady o Žižkov para precio, cafés y vida local a 15 min andando.",
      },
      {
        q: "¿Se paga en euros en Praga?",
        a: "Algunos sitios los aceptan con cambio pésimo. Usa tarjeta en CZK siempre, y si te ofrecen pagar 'en euros' en el datáfono, di que no.",
      },
    ],
    related: ["viena", "budapest", "berlin"],
  },
  {
    slug: "budapest",
    name: "Budapest",
    prefillDestination: "Budapest, Hungría",
    tripTypes: ["cultural", "relax", "party"],
    nDays: 3,
    title: "Itinerario Budapest 3 días: termas, Parlamento y ruin bars (2026) | Itineraya",
    metaDescription:
      "Budapest en 3 días: Buda y sus miradores, el Parlamento por dentro, balnearios Széchenyi, mercado central y ruin bars. Con presupuesto real y consejos. Personalízalo gratis.",
    h1: "Itinerario de Budapest en 3 días: dos ciudades y un balneario",
    intro:
      "Budapest son dos ciudades separadas por el Danubio: Buda, la de las colinas y el castillo, y Pest, la de los cafés, el Parlamento y la noche. La ruta perfecta les da un día a cada una — y deja una tarde entera para lo que nadie debería recortar: las termas.",
    heroImage: `https://images.unsplash.com/photo-1551867633-194f125bddfa${U}`,
    days: [
      {
        title: "Día 1 — Pest: Parlamento y centro",
        items: [
          "9:00 · Parlamento por dentro (reserva online la visita en español)",
          "11:00 · Zapatos del Danubio y basílica de San Esteban (sube a la cúpula)",
          "13:30 · Comida en el Mercado Central: goulash y lángos",
          "15:30 · Avenida Andrássy y Ópera",
          "17:00 · Plaza de los Héroes y el parque Városliget",
          "20:30 · Cena y ruin bars del barrio judío (Szimpla Kert, sí, pero no solo)",
        ],
      },
      {
        title: "Día 2 — Buda: castillo y miradores",
        items: [
          "9:00 · Puente de las Cadenas y subida al barrio del castillo",
          "10:00 · Bastión de los Pescadores temprano (gratis por abajo) e iglesia Matías",
          "13:00 · Comida en el barrio del castillo o baja a Batthyány tér",
          "15:00 · Colina Gellért: la citadella y la mejor panorámica del Danubio",
          "19:00 · Crucero nocturno por el Danubio: el Parlamento iluminado",
        ],
      },
      {
        title: "Día 3 — Termas y despedida",
        items: [
          "9:30 · Balneario Széchenyi (o Gellért si prefieres el art nouveau): 3 h mínimo",
          "13:30 · Comida en el barrio del balneario",
          "15:30 · Compras: páprika, vino Tokaji, y café histórico (New York Café por ver)",
          "18:00 · Último paseo por la orilla de Pest al atardecer",
        ],
      },
    ],
    practical: [
      "Florín húngaro (HUF): tarjeta en todas partes; rechaza el cobro en euros.",
      "Presupuesto: 65-100 € por persona y día — muy buena relación calidad-precio.",
      "Termas: lleva chanclas y gorro si quieres nadar; toalla se alquila.",
      "Transporte: billete 72 h o Budapest Card; el metro 1 es patrimonio en sí.",
      "Mejor época: abril-junio y septiembre-octubre; las termas ganan en invierno.",
    ],
    faq: [
      {
        q: "¿Széchenyi o Gellért?",
        a: "Széchenyi para la experiencia clásica al aire libre (las piscinas amarillas); Gellért por el interior art nouveau. Entre semana a primera hora, casi vacíos.",
      },
      {
        q: "¿Cuántos días para Budapest?",
        a: "3 días: uno por orilla y uno de termas + extras. Con 4, añade el mercado de antigüedades Ecseri o Szentendre.",
      },
      {
        q: "¿Budapest es barata?",
        a: "Sí para Europa: menú por 8-12 €, cerveza a 2-3 €, termas por 20-25 €. Los precios del centro turístico son otra historia.",
      },
      {
        q: "¿Dónde alojarse en Budapest?",
        a: "Distrito V (Pest centro) para ir andando a todo; distrito VII (barrio judío) si quieres la noche en la puerta; Buda solo si buscas silencio.",
      },
    ],
    related: ["praga", "viena", "estambul"],
  },
  {
    slug: "viena",
    name: "Viena",
    prefillDestination: "Viena, Austria",
    tripTypes: ["cultural", "romantic", "food"],
    nDays: 3,
    title: "Itinerario Viena 3 días: palacios, cafés y Sisi (2026) | Itineraya",
    metaDescription:
      "Viena en 3 días: Schönbrunn con reserva, Hofburg, Ópera, cafés históricos con sachertorte y el Prater. Presupuesto, transporte y qué reservar. Genera tu versión gratis.",
    h1: "Itinerario de Viena en 3 días: la elegancia, con horario",
    intro:
      "Viena es la ciudad de la puntualidad: los palacios se reservan con franja, los cafés históricos tienen cola a media tarde y la Ópera vende entradas de pie una hora antes. Con la logística resuelta, la ciudad es un vals — todo cerca, todo señalizado, todo funciona.",
    heroImage: `https://images.unsplash.com/photo-1516550893923-42d28e5677af${U}`,
    days: [
      {
        title: "Día 1 — Centro imperial",
        items: [
          "9:00 · Catedral de San Esteban y subida a la torre sur",
          "10:30 · Hofburg: apartamentos imperiales y museo de Sisi",
          "13:30 · Comida: schnitzel en Figlmüller o mercado Naschmarkt",
          "15:30 · Biblioteca Nacional (la sala más bonita de Europa) y Albertina",
          "19:00 · Ópera de Viena: entradas de pie por unos euros, 80 min antes",
        ],
      },
      {
        title: "Día 2 — Schönbrunn y museos",
        items: [
          "8:30 · Palacio de Schönbrunn en la primera franja (reserva online)",
          "11:00 · Jardines y la Glorieta: vistas gratis del conjunto",
          "13:30 · Comida cerca del MuseumsQuartier",
          "15:00 · Kunsthistorisches (Brueghel, Vermeer) o Leopold (Klimt y Schiele)",
          "17:30 · Café histórico: sachertorte en Café Central o Demel",
        ],
      },
      {
        title: "Día 3 — Belvedere y el Danubio",
        items: [
          "9:00 · Palacio Belvedere: 'El beso' de Klimt sin multitudes a primera hora",
          "12:00 · Karlskirche y paseo por Karlsplatz",
          "13:30 · Comida en el Naschmarkt",
          "15:30 · Prater: la noria de 'El tercer hombre' y el parque",
          "18:00 · Vino local en un heuriger de Grinzing para despedirse",
        ],
      },
    ],
    practical: [
      "Vienna City Card o billetes 72 h: el metro/tranvía es impecable.",
      "Presupuesto: 110-160 € por persona y día con alojamiento.",
      "Schönbrunn y Sisi Museum: reserva online con franja horaria.",
      "Los cafés históricos no aceptan reserva: ve a media mañana o tarde-noche.",
      "Mejor época: abril-junio, septiembre-octubre y diciembre (mercadillos).",
    ],
    faq: [
      {
        q: "¿Cuántos días para Viena?",
        a: "3 días bien organizados cubren lo imperial y un par de museos grandes. Con 4, añade Hundertwasserhaus y el Danubio o excursión a Bratislava (1 h).",
      },
      {
        q: "¿Merece la pena entrar a la Ópera?",
        a: "Sí, y hay dos maneras baratas: visita guiada de día o entrada de pie (Stehplatz) por pocos euros comprada 80 minutos antes de la función.",
      },
      {
        q: "¿Schönbrunn o Belvedere?",
        a: "Son distintos: Schönbrunn es el Versalles vienés (media jornada); Belvedere es palacio + pinacoteca con Klimt (2 horas). Con 3 días caben ambos.",
      },
      {
        q: "¿Dónde alojarse en Viena?",
        a: "Innere Stadt (distrito 1) para todo a pie; Neubau (7) para diseño y cafés; Leopoldstadt (2) calidad-precio junto al Prater.",
      },
    ],
    related: ["praga", "budapest", "berlin"],
  },
  {
    slug: "berlin",
    name: "Berlín",
    prefillDestination: "Berlín, Alemania",
    tripTypes: ["cultural", "party", "adventure"],
    nDays: 4,
    title: "Itinerario Berlín 4 días: historia, museos y noche (2026) | Itineraya",
    metaDescription:
      "Berlín en 4 días: Muro y Guerra Fría, Isla de los Museos, Kreuzberg, memoriales y la noche berlinesa. Con transporte, presupuesto y consejos reales. Personalízalo gratis.",
    h1: "Itinerario de Berlín en 4 días: la ciudad que se reinventa",
    intro:
      "Berlín no es bonita: es interesante, que dura más. Es enorme y descentralizada, así que la única estrategia que funciona es por barrios: Mitte y su historia, la isla de los museos, Kreuzberg y el este alternativo. Y una noche, si te dejan entrar, de club.",
    heroImage: `https://images.unsplash.com/photo-1560969184-10fe8719e047${U}`,
    days: [
      {
        title: "Día 1 — Mitte: la historia concentrada",
        items: [
          "9:00 · Puerta de Brandeburgo y Reichstag (cúpula gratis, reserva online)",
          "11:00 · Memorial del Holocausto y búnker explicado en placas",
          "13:00 · Comida: currywurst o comida vietnamita (herencia del Este)",
          "15:00 · Checkpoint Charlie y museo Topografía del Terror (gratis)",
          "17:30 · Gendarmenmarkt y Unter den Linden hasta la catedral",
        ],
      },
      {
        title: "Día 2 — Isla de los Museos y Alexanderplatz",
        items: [
          "9:00 · Museo de Pérgamo o Neues Museum (Nefertiti): elige uno y a fondo",
          "12:30 · Catedral de Berlín y paseo por el Lustgarten",
          "13:30 · Comida en Hackescher Markt y sus patios (Hackesche Höfe)",
          "16:00 · Alexanderplatz y torre TV si quieres la vista (reserva)",
          "20:00 · Cena en Prenzlauer Berg, el barrio bonito del Este",
        ],
      },
      {
        title: "Día 3 — El Muro y el Este alternativo",
        items: [
          "9:30 · Memorial del Muro en Bernauer Straße: el tramo que lo explica de verdad",
          "12:00 · Mauerpark (domingo: karaoke y mercadillo)",
          "14:00 · Comida en Friedrichshain",
          "15:30 · East Side Gallery: 1,3 km de muro pintado",
          "18:00 · Kreuzberg: Görlitzer Park, canal y cena turca en Kottbusser Tor",
        ],
      },
      {
        title: "Día 4 — Charlottenburg o la noche",
        items: [
          "10:30 · Palacio de Charlottenburg o museo de la Fotografía (Helmut Newton)",
          "13:00 · Comida y compras en Bikini Berlin y la Ku'damm",
          "16:00 · Tiergarten en bici hasta la Columna de la Victoria",
          "23:00 · Si es fin de semana: la noche de Berlín empieza cuando otras acaban",
        ],
      },
    ],
    practical: [
      "Billete ABC 24/48h o Deutschlandticket si te quedas más: distancias grandes.",
      "Presupuesto: 100-150 € por persona y día — más barata que París o Ámsterdam.",
      "Muchos memoriales y museos clave son gratis (Topografía, Muro, East Side).",
      "Domingo: casi todo el comercio cierra; los museos y mercadillos abren.",
      "Mejor época: mayo-septiembre; el invierno es duro pero con encanto de Ostalgie.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Berlín?",
        a: "4 días es lo honesto: la ciudad es enorme y la historia pide calma. Con 5, excursión a Potsdam y sus palacios (30 min en tren).",
      },
      {
        q: "¿Berlín es cara?",
        a: "Para ser capital europea, no: kebab o currywurst por 4-6 €, cerveza a 3-4 €, museos gratis o baratos. El alojamiento sigue siendo razonable.",
      },
      {
        q: "¿Dónde alojarse en Berlín?",
        a: "Mitte para ir a todo, Prenzlauer Berg para desayunar bien y pasear, Kreuzberg/Friedrichshain para la noche y el Berlín menos pulido.",
      },
      {
        q: "¿Merece la pena el museo de Pérgamo?",
        a: "Sí, pero comprueba qué salas están abiertas (renovación por fases desde hace años). Si el altar está cerrado, el Neues con Nefertiti es apuesta segura.",
      },
    ],
    related: ["praga", "amsterdam", "viena"],
  },
  {
    slug: "estambul",
    name: "Estambul",
    prefillDestination: "Estambul, Turquía",
    tripTypes: ["cultural", "food", "adventure"],
    nDays: 4,
    title: "Itinerario Estambul 4 días: dos continentes, un viaje (2026) | Itineraya",
    metaDescription:
      "Estambul en 4 días: Santa Sofía y Mezquita Azul sin colas, Gran Bazar con cabeza, ferry al lado asiático y hammam. Con presupuesto, visado y consejos. Personalízalo gratis.",
    h1: "Itinerario de Estambul en 4 días: entre dos continentes",
    intro:
      "Estambul abruma si la atacas sin plan: 16 millones de habitantes, tres zonas imprescindibles y un tráfico feroz. La solución es el agua — moverse en ferry y tranvía — y dividir: Sultanahmet lo monumental, Gálata y Karaköy lo moderno, y una mañana en Asia, que está a 20 minutos y otro mundo.",
    heroImage: `https://images.unsplash.com/photo-1524231757912-21f4fe3a7200${U}`,
    days: [
      {
        title: "Día 1 — Sultanahmet: el corazón imperial",
        items: [
          "8:30 · Santa Sofía al abrir (ahora mezquita: gratis, respeta horarios de rezo)",
          "10:30 · Mezquita Azul y el hipódromo",
          "12:30 · Cisterna Basílica: las columnas bajo el agua",
          "14:00 · Comida de kebap honesto lejos de la calle principal",
          "16:00 · Palacio Topkapi (harén incluido) hasta el cierre",
          "20:00 · Cena con vistas a Santa Sofía iluminada",
        ],
      },
      {
        title: "Día 2 — Bazares y Cuerno de Oro",
        items: [
          "9:00 · Gran Bazar al abrir: piérdete, regatea, no compres lo primero",
          "12:00 · Mezquita de Solimán, la obra maestra de Sinan (y sin colas)",
          "13:30 · Comida en el Bazar de las Especias y muelle de Eminönü",
          "15:30 · Balat y Fener: casas de colores y cafés del barrio griego",
          "19:00 · Balik ekmek (bocadillo de pescado) junto al puente de Gálata",
        ],
      },
      {
        title: "Día 3 — Gálata, Beyoğlu y hammam",
        items: [
          "9:30 · Torre de Gálata y cuestas de Karaköy",
          "11:30 · Istiklal Caddesi con su tranvía rojo hasta Taksim",
          "13:30 · Comida de meze en un meyhane de Nevizade",
          "16:00 · Hammam de verdad (Kılıç Ali Paşa o Çemberlitaş): 2 horas de gloria",
          "20:00 · Cena en Karaköy, el barrio que se ha puesto de moda",
        ],
      },
      {
        title: "Día 4 — Bósforo y lado asiático",
        items: [
          "9:30 · Ferry a Kadıköy: desayuno turco completo en el lado asiático",
          "11:30 · Mercado de Kadıköy y barrio de Moda con su paseo marítimo",
          "14:00 · Ferry-crucero por el Bósforo (el público de línea vale perfectamente)",
          "17:00 · Ortaköy: la mezquita junto al puente y un kumpir",
        ],
      },
    ],
    practical: [
      "Lira turca (TRY): paga en tarjeta, saca poco efectivo y de cajeros de bancos.",
      "Presupuesto: 60-100 € por persona y día — el cambio juega a tu favor.",
      "Istanbulkart: una tarjeta para tranvía, metro y ferrys (los ferrys son el plan).",
      "Vestimenta en mezquitas: hombros y rodillas cubiertos; pañuelo para ellas.",
      "Mejor época: abril-junio y septiembre-noviembre.",
    ],
    faq: [
      {
        q: "¿Necesito visado para Turquía?",
        a: "Con pasaporte español no se necesita visado para estancias turísticas de hasta 90 días. Con otros pasaportes latinoamericanos, revisa la e-Visa online.",
      },
      {
        q: "¿Estambul es segura?",
        a: "Como cualquier gran ciudad: la zona turística es segura a todas horas. Las precauciones son carteristas en el tranvía y los timos de 'ven a tomar un té' nocturnos.",
      },
      {
        q: "¿Cuánto cuesta un hammam?",
        a: "Entre 30 y 70 € según el nivel: los históricos (Çemberlitaş, Kılıç Ali Paşa) rondan los 50-70 € con exfoliación y masaje de espuma. Vale cada céntimo.",
      },
      {
        q: "¿Dónde alojarse en Estambul?",
        a: "Sultanahmet para hacer lo monumental a pie; Karaköy/Gálata para cafés, diseño y sentir la ciudad real. Evita alojarte junto a Taksim si buscas dormir.",
      },
    ],
    related: ["atenas", "budapest", "marrakech"],
  },
  {
    slug: "atenas",
    name: "Atenas",
    prefillDestination: "Atenas, Grecia",
    tripTypes: ["cultural", "food", "beach"],
    nDays: 3,
    title: "Itinerario Atenas 3 días: Acrópolis, Plaka y mar (2026) | Itineraya",
    metaDescription:
      "Atenas en 3 días: Acrópolis al amanecer sin colas, Plaka y Monastiraki, el nuevo museo, Anafiotika y una tarde de Riviera ateniense. Presupuesto y consejos. Gratis.",
    h1: "Itinerario de Atenas en 3 días: ruinas, tabernas y azoteas",
    intro:
      "Atenas se ha convertido en una de las capitales más vibrantes de Europa, pero el calor y las colas de la Acrópolis castigan al que improvisa. La regla: ruinas a primera hora, museos en las horas de sol de justicia, y azoteas con vistas al Partenón iluminado para cerrar cada día.",
    heroImage: `https://images.unsplash.com/photo-1555993539-1732b0258235${U}`,
    days: [
      {
        title: "Día 1 — La Acrópolis y Plaka",
        items: [
          "8:00 · Acrópolis al abrir (entrada con franja horaria reservada)",
          "10:30 · Teatro de Dioniso y ladera sur bajando con calma",
          "11:30 · Museo de la Acrópolis: el contexto que faltaba arriba",
          "14:00 · Comida en Plaka, en las tabernas escalonadas",
          "17:00 · Anafiotika: la isla cicládica escondida bajo la roca",
          "20:30 · Cena en azotea con el Partenón iluminado de fondo",
        ],
      },
      {
        title: "Día 2 — Ágora, mercados y Atenas moderna",
        items: [
          "9:00 · Ágora antigua y el templo de Hefesto (el mejor conservado)",
          "11:00 · Mercadillo de Monastiraki y el mercado central (Varvakios)",
          "13:30 · Souvlaki serio o mezédes en Psiri",
          "16:00 · Museo Arqueológico Nacional: los bronces y las máscaras de oro",
          "19:00 · Colina de Licabeto en funicular: atardecer sobre toda la ciudad",
        ],
      },
      {
        title: "Día 3 — Templo de Zeus y la Riviera",
        items: [
          "9:00 · Templo de Zeus Olímpico y arco de Adriano",
          "10:30 · Estadio Panatenaico, el de mármol de las primeras olimpiadas",
          "12:00 · Tranvía a la Riviera ateniense: baño y pescado frente al mar",
          "17:00 · Opcional al atardecer: cabo Sunión y el templo de Poseidón",
        ],
      },
    ],
    practical: [
      "Entrada combinada de yacimientos (Acrópolis + 6): amortiza en 2 visitas.",
      "Presupuesto: 80-120 € por persona y día con alojamiento.",
      "En verano, ruinas antes de las 10 o después de las 17: el calor es serio.",
      "Metro moderno y barato; del aeropuerto al centro en 40 min.",
      "Mejor época: abril-junio y septiembre-octubre; agosto abrasa.",
    ],
    faq: [
      {
        q: "¿Cuántos días en Atenas antes de las islas?",
        a: "2-3 días completos: Acrópolis + museos + un barrio con calma. Es escala perfecta antes del ferry a las Cícladas desde El Pireo.",
      },
      {
        q: "¿La Acrópolis se reserva?",
        a: "Sí, con franja horaria online. La primera (8:00) es la buena: luz dorada, sin calor y sin cruceros. La última hora también funciona.",
      },
      {
        q: "¿Dónde alojarse en Atenas?",
        a: "Plaka/Monastiraki para todo a pie con encanto; Koukaki (bajo la Acrópolis) calidad-precio excelente; Kolonaki si buscas boutiques y cafés.",
      },
      {
        q: "¿Atenas es solo una escala hacia las islas?",
        a: "Ya no: entre el museo de la Acrópolis, la escena gastro de Psiri y las azoteas, la ciudad justifica 3 días por sí sola.",
      },
    ],
    related: ["santorini", "estambul", "roma"],
  },
  {
    slug: "santorini",
    name: "Santorini",
    prefillDestination: "Santorini, Grecia",
    tripTypes: ["romantic", "beach", "relax"],
    nDays: 4,
    title: "Itinerario Santorini 4 días: Oia, caldera y playas (2026) | Itineraya",
    metaDescription:
      "Santorini en 4 días: atardecer en Oia sin agobios, ruta de la caldera a pie, playas volcánicas, vino asirtiko y Akrotiri. Presupuesto real y consejos. Personalízalo gratis.",
    h1: "Itinerario de Santorini en 4 días: la caldera con calma",
    intro:
      "Santorini tiene dos velocidades: la del crucerista que ve Oia una hora entre empujones, y la del que duerme en la isla y la tiene para sí de 18h a 10h. Este plan es para la segunda: atardeceres sin multitudes, la ruta de la caldera a pie y las playas volcánicas del sur.",
    heroImage: `https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e${U}`,
    days: [
      {
        title: "Día 1 — Fira y la caldera",
        items: [
          "10:00 · Fira: cornisa de la caldera y callejones",
          "13:00 · Comida con vistas al volcán",
          "17:00 · Paseo Fira–Firostefani–Imerovigli: la hora dorada",
          "20:30 · Cena en Imerovigli, más tranquila que Oia",
        ],
      },
      {
        title: "Día 2 — La ruta de la caldera y Oia",
        items: [
          "8:30 · Senderismo Imerovigli–Oia (9 km, 3 h, vistas todo el rato)",
          "12:00 · Oia: cúpulas azules y bahía de Ammoudi",
          "14:00 · Pescado fresco en Ammoudi, al nivel del mar",
          "17:00 · Sitio para el atardecer ANTES de las 18h (o mejor: vuelve a Imerovigli)",
        ],
      },
      {
        title: "Día 3 — Playas volcánicas y vino",
        items: [
          "10:00 · Red Beach y Akrotiri, la Pompeya del Egeo",
          "13:30 · Comida en Vlychada junto a la playa lunar",
          "16:00 · Cata en una bodega de asirtiko con vistas (Santo Wines o Venetsanos)",
          "20:00 · Cena en Pyrgos, el pueblo interior que nadie visita y todos deberían",
        ],
      },
      {
        title: "Día 4 — Barco por la caldera",
        items: [
          "10:00 · Excursión en catamarán: volcán, aguas termales y bahías",
          "14:00 · Comida a bordo, baño en Nea Kameni",
          "18:00 · Última tarde libre: compras en Oia o baño en Perissa",
        ],
      },
    ],
    practical: [
      "Vuela en temporada media (mayo, septiembre-octubre): mitad de precio, mismo mar.",
      "Presupuesto: 130-220 € por persona y día — la isla más cara de Grecia.",
      "Alquila quad o coche pequeño un día: el bus a Oia va lleno en verano.",
      "Las 'infinity pools' de postal cuestan 400+ €/noche; Imerovigli tiene vistas idénticas por menos.",
      "Reserva restaurantes con vista a la caldera con días de antelación.",
    ],
    faq: [
      {
        q: "¿Cuántos días merece Santorini?",
        a: "3-4: caldera, playas del sur y una salida en barco. Más días, combina con Naxos o Milos en ferry (mejor playa, mitad de precio).",
      },
      {
        q: "¿Dónde ver el atardecer sin multitudes?",
        a: "El 'famoso' es en Oia y se llena 2 horas antes. El mismo sol se pone frente a Imerovigli, Firostefani o el faro de Akrotiri con un 5% de la gente.",
      },
      {
        q: "¿Santorini o Mykonos?",
        a: "Santorini para paisaje y parejas; Mykonos para playa organizada y fiesta. Si buscas Grecia auténtica y barata, la respuesta es una tercera: Naxos.",
      },
      {
        q: "¿Se puede ir con presupuesto ajustado?",
        a: "Sí: duerme en Perissa o Karterados (no en la caldera), muévete en bus, come gyros y sube a la caldera a pasear — las vistas son gratis.",
      },
    ],
    related: ["atenas", "mallorca", "bali"],
  },
  {
    slug: "dublin",
    name: "Dublín",
    prefillDestination: "Dublín, Irlanda",
    tripTypes: ["cultural", "party", "nature"],
    nDays: 3,
    title: "Itinerario Dublín 3 días: pubs, Trinity y acantilados (2026) | Itineraya",
    metaDescription:
      "Dublín en 3 días: Trinity College y el Libro de Kells, Temple Bar sin timos, Guinness Storehouse y excursión a los acantilados. Presupuesto y consejos. Personalízalo gratis.",
    h1: "Itinerario de Dublín en 3 días: pintas, letras y mar",
    intro:
      "Dublín es pequeña, andable y carísima de dormir — así que el plan es denso: la ciudad georgiana y el Trinity en un día, la Guinness y las Liberties en otro, y el tercero fuera, porque lo mejor de Irlanda empieza donde acaba el asfalto: Howth o los acantilados de Moher.",
    heroImage: `https://images.unsplash.com/photo-1549918864-48ac978761a4${U}`,
    days: [
      {
        title: "Día 1 — Trinity y la ciudad georgiana",
        items: [
          "9:00 · Trinity College: Libro de Kells y la Long Room (reserva)",
          "11:00 · Grafton Street y St Stephen's Green",
          "13:00 · Comida en un pub con música: estofado irlandés",
          "15:00 · Museo Nacional de Arqueología (gratis): oro celta y cuerpos del pantano",
          "17:30 · Puertas georgianas de Merrion Square",
          "20:00 · Temple Bar para verlo — y las pintas de verdad en The Long Hall",
        ],
      },
      {
        title: "Día 2 — Guinness, Liberties y catedrales",
        items: [
          "9:30 · Catedral de San Patricio y Christ Church",
          "11:30 · Guinness Storehouse: la pinta con vistas 360º del Gravity Bar",
          "14:00 · Comida en las Liberties",
          "16:00 · Kilmainham Gaol: la cárcel que explica Irlanda (reserva sí o sí)",
          "20:00 · Música en directo en The Cobblestone, el pub de los músicos",
        ],
      },
      {
        title: "Día 3 — Howth o los acantilados de Moher",
        items: [
          "Opción A · Howth en DART (25 min): ruta del acantilado + fish and chips",
          "Opción B · Excursión de día a los acantilados de Moher y Galway",
          "19:00 · Última pinta de despedida junto al Ha'penny Bridge",
        ],
      },
    ],
    practical: [
      "Leap Visitor Card para bus/DART/Luas; el centro se camina.",
      "Presupuesto: 120-180 € por persona y día — dormir es lo caro.",
      "Kilmainham Gaol y Libro de Kells: solo con reserva online.",
      "Los pubs de Temple Bar cobran la pinta a 9-10 €; a 5 minutos vale 6 €.",
      "Llueve cuando quiere: chaqueta impermeable siempre, paraguas nunca (viento).",
    ],
    faq: [
      {
        q: "¿Cuántos días para Dublín?",
        a: "2 días para la ciudad y uno para salir (Howth, Glendalough o Moher). Dublín es la puerta; Irlanda es lo verde de fuera.",
      },
      {
        q: "¿Merece la pena la Guinness Storehouse?",
        a: "Si te gusta la cerveza o el marketing bien hecho, sí: el Gravity Bar tiene la mejor vista de Dublín. Si no, con un pub histórico cumples.",
      },
      {
        q: "¿Moher se puede hacer sin coche?",
        a: "Sí, con excursión organizada desde Dublín (día completo, 3 h de bus por trayecto) o en tren a Galway y bus local — más lento pero más libre.",
      },
      {
        q: "¿Dublín es cara?",
        a: "El alojamiento, mucho (150+ €/noche un 3 estrellas). Comida de pub y museos gratis lo compensan en parte. Reserva cama con semanas.",
      },
    ],
    related: ["edimburgo", "londres", "paris"],
  },
  {
    slug: "edimburgo",
    name: "Edimburgo",
    prefillDestination: "Edimburgo, Escocia",
    tripTypes: ["cultural", "nature", "romantic"],
    nDays: 3,
    title: "Itinerario Edimburgo 3 días: castillo, Old Town y Highlands (2026) | Itineraya",
    metaDescription:
      "Edimburgo en 3 días: castillo y Royal Mile, closes escondidos, Arthur's Seat al amanecer, whisky y una escapada a las Highlands. Presupuesto y consejos. Gratis.",
    h1: "Itinerario de Edimburgo en 3 días: la ciudad más gótica de Europa",
    intro:
      "Edimburgo se disfruta con niebla y cuesta arriba. La Old Town medieval y la New Town georgiana se ven en dos días andando mucho; el tercero pide o Arthur's Seat con calma o el aperitivo de las Highlands. Reserva el castillo y deja hueco para perderte por los closes.",
    heroImage: `https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb${U}`,
    days: [
      {
        title: "Día 1 — Old Town y el castillo",
        items: [
          "9:00 · Castillo de Edimburgo al abrir (reserva; los Honores de Escocia)",
          "11:30 · Royal Mile con desvíos: los closes, la catedral de St Giles",
          "13:30 · Comida en Grassmarket con el castillo encima",
          "15:30 · Greyfriars Kirkyard y el museo Nacional de Escocia (gratis)",
          "18:00 · Victoria Street, la calle que inspiró el callejón Diagon",
          "20:30 · Cena y whisky en un pub de la Old Town",
        ],
      },
      {
        title: "Día 2 — Arthur's Seat y New Town",
        items: [
          "8:00 · Subida a Arthur's Seat: 45 min y la ciudad entera a tus pies",
          "11:00 · Palacio de Holyrood o el parlamento escocés",
          "13:00 · Comida en Leith (el barrio portuario, hoy el más gastro)",
          "16:00 · New Town georgiana: Dean Village y el Water of Leith",
          "18:30 · Calton Hill al atardecer: la postal de Edimburgo",
        ],
      },
      {
        title: "Día 3 — Highlands exprés o Edimburgo secreto",
        items: [
          "Opción A · Excursión de día: lago Ness, Glencoe y las Highlands",
          "Opción B · Roslyn Chapel + Portobello Beach + cata en una destilería",
          "20:00 · Última cena: haggis para valientes, marisco para el resto",
        ],
      },
    ],
    practical: [
      "Presupuesto: 120-180 € por persona y día; agosto (Fringe) dobla los precios.",
      "El castillo se agota en verano: reserva online con antelación.",
      "Tiempo cambiante los 365 días: capas e impermeable.",
      "Todo el centro es andable; el tranvía sirve sobre todo para el aeropuerto.",
      "Mejor época: mayo-junio y septiembre; agosto solo si vas AL festival.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Edimburgo?",
        a: "2 días intensos para la ciudad; 3 si quieres Arthur's Seat con calma o una excursión. Es la base perfecta para arrancar una ruta por Escocia.",
      },
      {
        q: "¿Se pueden ver las Highlands en un día?",
        a: "Se puede 'probar': Glencoe y el lago Ness en excursión de 12 horas. Para las Highlands de verdad hacen falta 3-4 días con coche.",
      },
      {
        q: "¿Edimburgo en agosto?",
        a: "Es el mes del Fringe: la ciudad es una fiesta continua y los precios, un atraco. Reserva con meses o elige junio/septiembre.",
      },
      {
        q: "¿Dónde alojarse en Edimburgo?",
        a: "Old Town para vivir dentro de la postal, New Town para dormir mejor por lo mismo, Leith para presupuesto con la mejor comida.",
      },
    ],
    related: ["dublin", "londres", "praga"],
  },
  {
    slug: "oporto",
    name: "Oporto",
    prefillDestination: "Oporto, Portugal",
    tripTypes: ["food", "cultural", "romantic"],
    nDays: 3,
    title: "Itinerario Oporto 3 días: Ribeira, bodegas y Duero (2026) | Itineraya",
    metaDescription:
      "Oporto en 3 días: la Ribeira y sus puentes, bodegas de vino de Oporto en Gaia, librería Lello sin colas, francesinha y un día por el valle del Duero. Personalízalo gratis.",
    h1: "Itinerario de Oporto en 3 días: vino, granito y río",
    intro:
      "Oporto es Lisboa sin las multitudes y con mejor vino. Dos días dan para las dos orillas — la Ribeira y las bodegas de Gaia — y el tercero es la decisión importante: valle del Duero río arriba, o playa y marisco en Matosinhos. Ambas respuestas son correctas.",
    heroImage: `https://images.unsplash.com/photo-1555881400-74d7acaacd8b${U}`,
    days: [
      {
        title: "Día 1 — Centro histórico y Ribeira",
        items: [
          "9:00 · Estación de São Bento: los azulejos que cuentan Portugal",
          "10:00 · Catedral y barrio del Barredo bajando hacia el río",
          "12:00 · Librería Lello (entrada con franja; a primera o última hora)",
          "13:30 · Francesinha en un clásico (Café Santiago) — pide media si dudas",
          "16:00 · Torre de los Clérigos y las galerías de París",
          "19:00 · Atardecer en la Ribeira con vino en mano",
        ],
      },
      {
        title: "Día 2 — Gaia y las bodegas",
        items: [
          "10:00 · Cruzar el puente Don Luis I por arriba (vértigo y fotos)",
          "10:30 · Teleférico de Gaia o paseo por la ribera",
          "11:30 · Bodega con cata (Graham's, Taylor's o una pequeña: Kopke)",
          "14:00 · Comida en el mercado Beira-Rio de Gaia",
          "16:30 · Mirador de la Serra do Pilar: LA foto de Oporto",
          "20:30 · Cena en la zona de las Flores/Carmo",
        ],
      },
      {
        title: "Día 3 — Valle del Duero o mar",
        items: [
          "Opción A · Crucero o coche por el Duero: viñedos en terraza, Pinhão, cata",
          "Opción B · Tranvía 1 hasta Foz + marisco en Matosinhos + playa",
          "19:00 · Último oporto tawny mirando el río",
        ],
      },
    ],
    practical: [
      "Presupuesto: 70-110 € por persona y día — de las mejores calidades-precio de Europa occidental.",
      "Andante Tour o billetes sueltos de metro; el centro se camina (con cuestas).",
      "Librería Lello: entrada de pago descontable en libro; reserva franja online.",
      "Las catas de bodega se reservan; las 'pequeñas' son más generosas que las famosas.",
      "Mejor época: abril-octubre; septiembre es vendimia en el Duero.",
    ],
    faq: [
      {
        q: "¿Oporto o Lisboa?",
        a: "Con una semana, ambas (3+3 y tren de 3 h). Si toca elegir: Lisboa es más monumental, Oporto más compacta, barata y gastronómica.",
      },
      {
        q: "¿Merece la pena el valle del Duero?",
        a: "Es de los paisajes de vino más bonitos del mundo. En día completo desde Oporto se hace bien (tren panorámico a Pinhão o excursión con cata).",
      },
      {
        q: "¿Dónde alojarse en Oporto?",
        a: "Ribeira/Flores para el encanto, Cedofeita para ambiente local y precio, Gaia si quieres despertarte mirando la postal de Oporto.",
      },
      {
        q: "¿Qué es la francesinha?",
        a: "Un sándwich-monumento: carne, salchicha, jamón, queso fundido y salsa de cerveza. Compártela la primera vez; se entrena.",
      },
    ],
    related: ["lisboa", "madrid", "sevilla"],
  },
  {
    slug: "florencia",
    name: "Florencia",
    prefillDestination: "Florencia, Italia",
    tripTypes: ["cultural", "romantic", "food"],
    nDays: 3,
    title: "Itinerario Florencia 3 días: Uffizi, Duomo y Toscana (2026) | Itineraya",
    metaDescription:
      "Florencia en 3 días: Uffizi y David con reserva, cúpula de Brunelleschi, Oltrarno artesano y atardecer en Piazzale Michelangelo. Con presupuesto y consejos. Gratis.",
    h1: "Itinerario de Florencia en 3 días: el Renacimiento andando",
    intro:
      "Florencia es un museo del tamaño de un barrio: todo está a 15 minutos a pie, y precisamente por eso las colas son épicas. Con Uffizi, Academia y cúpula reservados de antemano, los 3 días fluyen; sin reserva, los pierdes en filas. El Oltrarno pone la parte de ciudad viva.",
    heroImage: `https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76${U}`,
    days: [
      {
        title: "Día 1 — Duomo y el corazón",
        items: [
          "8:15 · Cúpula de Brunelleschi (reserva con franja) y vistas",
          "10:30 · Baptisterio y museo del Duomo (las puertas originales)",
          "13:00 · Panino en All'Antico Vinaio (o schiacciata sin la cola de al lado)",
          "15:00 · Piazza della Signoria y el Palazzo Vecchio",
          "17:00 · Ponte Vecchio y paseo por el Arno",
          "20:30 · Bistecca alla fiorentina — se pide al peso y se comparte",
        ],
      },
      {
        title: "Día 2 — Uffizi y Academia",
        items: [
          "8:15 · Galería Uffizi en la primera franja: Botticelli sin cabezas delante",
          "12:30 · Comida en el Mercato Centrale (arriba, street food toscano)",
          "14:30 · Galería de la Academia: el David (reserva)",
          "16:30 · San Lorenzo y capillas Mediceas",
          "19:00 · Aperitivo en una terraza con vistas al Duomo",
        ],
      },
      {
        title: "Día 3 — Oltrarno y el mirador",
        items: [
          "9:30 · Palazzo Pitti o jardines de Boboli",
          "12:00 · Santo Spirito: la plaza más viva del Oltrarno y sus artesanos",
          "13:30 · Comida en una trattoria del barrio",
          "16:00 · San Miniato al Monte, la iglesia que corona la ciudad",
          "18:30 · Piazzale Michelangelo: el atardecer de Florencia entera",
        ],
      },
    ],
    practical: [
      "Reserva Uffizi, Academia y cúpula ANTES de viajar: es la diferencia entre ver y hacer cola.",
      "Presupuesto: 110-160 € por persona y día con alojamiento.",
      "Todo se camina; no necesitas transporte salvo para Fiesole.",
      "Primer domingo de mes: museos estatales gratis (con multitudes).",
      "Mejor época: abril-mayo y septiembre-octubre; julio-agosto abrasa.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Florencia?",
        a: "3 días: dos de museos y centro, uno de Oltrarno y miradores. Con 4-5, excursión a Siena, San Gimignano o el Chianti.",
      },
      {
        q: "¿Uffizi o Academia si solo puedo uno?",
        a: "Uffizi: es una de las tres pinacotecas top del mundo. El David se 'compensa' con la copia de la Piazza della Signoria (no es lo mismo, pero salva).",
      },
      {
        q: "¿Se puede subir a la cúpula sin reserva?",
        a: "No: la cúpula de Brunelleschi exige reserva con franja horaria. Alternativa sin reserva: el campanile de Giotto, con la ventaja de que ves la cúpula en la foto.",
      },
      {
        q: "¿Dónde alojarse en Florencia?",
        a: "Centro (Duomo/Signoria) para hacerlo todo a pie; Oltrarno/Santo Spirito para dormir en la Florencia de los florentinos; Campo di Marte si el presupuesto aprieta.",
      },
    ],
    related: ["roma", "venecia", "paris"],
  },
  {
    slug: "venecia",
    name: "Venecia",
    prefillDestination: "Venecia, Italia",
    tripTypes: ["romantic", "cultural", "food"],
    nDays: 2,
    title: "Itinerario Venecia 2 días: San Marcos, canales y bacari (2026) | Itineraya",
    metaDescription:
      "Venecia en 2 días: San Marcos al amanecer, Rialto, ruta de bacari con cicchetti, Dorsoduro y las islas de Murano y Burano. Trucos anti-multitudes. Personalízalo gratis.",
    h1: "Itinerario de Venecia en 2 días: la ciudad imposible, sin agobios",
    intro:
      "Venecia de día es una avalancha; de amanecer y de noche, un milagro. La estrategia: San Marcos antes de las 9, las islas o los barrios (Dorsoduro, Cannaregio) en las horas punta, y cenar donde cenan los venecianos — de pie, con cicchetti y una ombra de vino.",
    heroImage: `https://images.unsplash.com/photo-1514890547357-a9ee288728e0${U}`,
    days: [
      {
        title: "Día 1 — San Marcos y los clásicos",
        items: [
          "8:00 · Plaza de San Marcos casi vacía: basílica al abrir (reserva)",
          "10:00 · Palacio Ducal y puente de los Suspiros",
          "13:00 · Cicchetti en un bacaro de Rialto",
          "15:00 · Puente de Rialto y mercado",
          "17:00 · Góndola compartida o traghetto (2 € y cruzas el Gran Canal)",
          "20:00 · Cena en Cannaregio, donde Venecia sigue siendo un barrio",
        ],
      },
      {
        title: "Día 2 — Islas o barrios",
        items: [
          "9:00 · Vaporetto a Murano (vidrio) y Burano (las casas de colores)",
          "14:00 · Vuelta y comida en Dorsoduro",
          "16:00 · Basílica della Salute y punta de la Aduana",
          "18:00 · Spritz en Campo Santa Margherita con los estudiantes",
          "20:00 · Última caminata nocturna: Venecia vacía es otra ciudad",
        ],
      },
    ],
    practical: [
      "Tasa de acceso los días pico si no duermes en la ciudad: revisa el calendario oficial.",
      "Pase de vaporetto 24/48 h: el billete suelto cuesta 9,50 €.",
      "Presupuesto: 130-200 € por persona y día durmiendo en Venecia (vale la pena).",
      "Góndola oficial: ~90 € / 30 min por góndola (se comparte); el traghetto es el truco barato.",
      "Mejor época: febrero (carnaval aparte), marzo-mayo y octubre-noviembre.",
    ],
    faq: [
      {
        q: "¿Venecia en un día o durmiendo?",
        a: "Duerme al menos una noche: la ciudad de 19h a 10h (sin cruceristas ni excursiones) es la que justifica el viaje entero.",
      },
      {
        q: "¿Murano y Burano merecen la pena?",
        a: "Burano sí rotundo (colores, calma); Murano está bien si te interesa el vidrio. Juntas son media jornada larga en vaporetto.",
      },
      {
        q: "¿La góndola es un timo?",
        a: "Es cara (tarifa oficial ~90 €/30 min) pero única. Truco: compártela entre 4-5, o usa el traghetto (góndola-ferry) por 2 € para la experiencia mínima.",
      },
      {
        q: "¿Dónde alojarse en Venecia?",
        a: "Cannaregio o Dorsoduro: precio algo mejor, vida local y 15 min a pie de San Marcos. Mestre solo si el presupuesto manda de verdad.",
      },
    ],
    related: ["florencia", "roma", "paris"],
  },
  {
    slug: "madrid",
    name: "Madrid",
    prefillDestination: "Madrid, España",
    tripTypes: ["cultural", "food", "party"],
    nDays: 3,
    title: "Itinerario Madrid 3 días: Prado, Austrias y tapas (2026) | Itineraya",
    metaDescription:
      "Madrid en 3 días: el triángulo del arte, el Madrid de los Austrias, Retiro, tapas por La Latina y atardecer en el templo de Debod. Con horarios y presupuesto. Gratis.",
    h1: "Itinerario de Madrid en 3 días: museos, barrios y barra de bar",
    intro:
      "Madrid no tiene un monumento-icono: tiene una forma de vivir. La ruta correcta combina el triángulo del arte (Prado, Reina Sofía, Thyssen — con sus franjas gratuitas), los Austrias y el Palacio, y lo más importante: barras. De La Latina a Malasaña, se cena dos veces.",
    heroImage: `https://images.unsplash.com/photo-1539037116277-4db20889f2d4${U}`,
    days: [
      {
        title: "Día 1 — Austrias y Palacio",
        items: [
          "9:30 · Plaza Mayor y mercado de San Miguel (mirar; comer, mejor en otro lado)",
          "11:00 · Palacio Real y catedral de la Almudena",
          "13:30 · Bocadillo de calamares en la plaza Mayor — la tradición es la tradición",
          "16:00 · Madrid de los Austrias: plaza de la Villa, San Ginés",
          "19:00 · Templo de Debod al atardecer",
          "21:00 · Tapas por La Latina (Cava Baja)",
        ],
      },
      {
        title: "Día 2 — Triángulo del arte y Retiro",
        items: [
          "9:00 · Museo del Prado: Velázquez, Goya y El Bosco (reserva)",
          "13:00 · Comida en el barrio de las Letras",
          "15:30 · Reina Sofía: el Guernica (gratis a última hora de la tarde)",
          "18:00 · Parque del Retiro: estanque y palacio de Cristal",
          "21:30 · Cena en Huertas o Lavapiés",
        ],
      },
      {
        title: "Día 3 — Malasaña, Chueca y compras",
        items: [
          "10:30 · Gran Vía desde Callao (sube a la terraza del Círculo de Bellas Artes)",
          "12:00 · Malasaña: vinilos, vintage y vermut en la plaza del Dos de Mayo",
          "14:00 · Comida en el mercado de San Ildefonso o San Antón (Chueca)",
          "17:00 · Chueca y compras por Fuencarral",
          "20:00 · Última ronda: croquetas y caña bien tirada donde caiga",
        ],
      },
    ],
    practical: [
      "Prado gratis de lunes a sábado 18-20h y domingos 17-19h (cola, pero funciona).",
      "Presupuesto: 90-140 € por persona y día con alojamiento.",
      "Metro con tarjeta Multi; el centro se anda entero.",
      "Se cena tarde: antes de las 21h estarás solo (o con otros turistas).",
      "Mejor época: abril-junio y septiembre-octubre; agosto es un horno vacío.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Madrid?",
        a: "3 días para museos + barrios + una noche larga. Con 4-5, Toledo o Segovia en tren (30 min) son excursiones redondas.",
      },
      {
        q: "¿Prado, Reina Sofía o Thyssen?",
        a: "Prado si solo hay uno. Los tres tienen franjas gratuitas o reducidas — con el orden correcto puedes ver los tres pagando uno.",
      },
      {
        q: "¿Dónde alojarse en Madrid?",
        a: "Barrio de las Letras o Austrias para turismo a pie; Malasaña/Chueca para la noche; Chamberí para vivirlo como un madrileño.",
      },
      {
        q: "¿Qué hay que comer sí o sí?",
        a: "Bocadillo de calamares, tortilla (jugosa), croquetas, cocido si es invierno y vermut de grifo un mediodía. El postre: chocolate con churros en San Ginés.",
      },
    ],
    related: ["barcelona", "sevilla", "lisboa"],
  },
  {
    slug: "sevilla",
    name: "Sevilla",
    prefillDestination: "Sevilla, España",
    tripTypes: ["cultural", "romantic", "food"],
    nDays: 3,
    title: "Itinerario Sevilla 3 días: Alcázar, Triana y azahar (2026) | Itineraya",
    metaDescription:
      "Sevilla en 3 días: Real Alcázar con reserva, catedral y Giralda, Santa Cruz, plaza de España, Triana y flamenco de verdad. Con horarios y presupuesto. Personalízalo gratis.",
    h1: "Itinerario de Sevilla en 3 días: la ciudad que huele a azahar",
    intro:
      "Sevilla tiene truco: de abril a octubre, la vida es antes de las 13h y después de las 19h. Entre medias, siesta, sombra o Alcázar. Con las entradas del Alcázar y la catedral reservadas, los 3 días caben enteros: Santa Cruz, Triana, la plaza de España y un tablao que no sea para autobuses.",
    heroImage: `https://images.unsplash.com/photo-1558370781-d6196949e317${U}`,
    days: [
      {
        title: "Día 1 — Alcázar y Santa Cruz",
        items: [
          "9:30 · Real Alcázar en la primera franja (reserva semanas antes)",
          "12:30 · Barrio de Santa Cruz: plaza de Doña Elvira, callejón del Agua",
          "14:00 · Tapas: espinacas con garbanzos y carrillada",
          "17:30 · Catedral y subida a la Giralda (rampas, no escaleras)",
          "20:00 · Terraza con vistas a la Giralda para el atardecer",
          "22:00 · Flamenco en La Carbonería o un tablao pequeño",
        ],
      },
      {
        title: "Día 2 — Plaza de España y el río",
        items: [
          "9:30 · Plaza de España y parque de María Luisa temprano",
          "12:00 · Torre del Oro y paseo por el Guadalquivir",
          "14:00 · Comida en el mercado de Triana",
          "16:30 · Triana: cerámica, calle Betis y la capilla de los marineros",
          "20:30 · Puesta de sol desde el puente de Triana; cena en calle Betis",
        ],
      },
      {
        title: "Día 3 — Setas, Macarena y despedida",
        items: [
          "10:00 · Las Setas (Metropol Parasol): pasarela con vistas",
          "11:30 · Basílica de la Macarena y muralla",
          "13:30 · Última ronda de tapas por la Alameda de Hércules",
          "17:00 · Palacio de las Dueñas o Casa de Pilatos, los palacios tranquilos",
        ],
      },
    ],
    practical: [
      "Alcázar: reserva online con antelación real; sin entrada no hay plan B.",
      "Presupuesto: 80-120 € por persona y día con alojamiento.",
      "De junio a septiembre: 38-45 ºC; planifica como un sevillano (mañana y noche).",
      "Todo el centro es peatonal o casi: alójate dentro y camina.",
      "Mejor época: marzo-mayo (azahar, Semana Santa, Feria) y octubre.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Sevilla?",
        a: "3 días para verla con el ritmo que pide. Con 4-5, Córdoba en AVE (45 min) o Cádiz (1 h) redondean el viaje.",
      },
      {
        q: "¿Cuándo NO ir a Sevilla?",
        a: "Julio y agosto, salvo que disfrutes a 43 ºC. Y en Semana Santa o Feria solo si vas A eso: precios triples y todo lleno (pero es único).",
      },
      {
        q: "¿Dónde ver flamenco auténtico?",
        a: "Huye de los tablaos de autobús: La Carbonería (gratis, informal), casa de la Memoria o peñas de Triana.",
      },
      {
        q: "¿Dónde alojarse en Sevilla?",
        a: "Santa Cruz para la postal, Alameda para la noche y precio, Triana para sentirte del barrio con el centro a 10 minutos andando.",
      },
    ],
    related: ["granada", "madrid", "lisboa"],
  },
  {
    slug: "granada",
    name: "Granada",
    prefillDestination: "Granada, España",
    tripTypes: ["cultural", "romantic", "food"],
    nDays: 2,
    title: "Itinerario Granada 2 días: Alhambra, Albaicín y tapas gratis (2026) | Itineraya",
    metaDescription:
      "Granada en 2 días: la Alhambra con la entrada que sí se agota, miradores del Albaicín, Sacromonte y la ciudad donde las tapas siguen siendo gratis. Personalízalo gratis.",
    h1: "Itinerario de Granada en 2 días: la Alhambra y todo lo demás",
    intro:
      "En Granada solo hay una regla inquebrantable: la entrada de la Alhambra se compra semanas antes o no se entra. Resuelto eso, la ciudad es generosa — miradores gratis, el Albaicín laberíntico, teterías moras y el último lugar de España donde pedir una caña incluye cena.",
    heroImage: `https://loremflickr.com/1600/900/alhambra,granada`,
    days: [
      {
        title: "Día 1 — La Alhambra entera",
        items: [
          "8:30 · Alhambra: Palacios Nazaríes en la primera franja (imprescindible reservar)",
          "11:00 · Generalife y sus jardines",
          "12:30 · Alcazaba y torre de la Vela: Granada a vista de pájaro",
          "14:30 · Comida en el barrio del Realejo",
          "18:00 · Paseo de los Tristes al caer la tarde, con la Alhambra encima",
          "21:00 · Ruta de tapas: en Granada, cada caña trae su tapa",
        ],
      },
      {
        title: "Día 2 — Albaicín, Sacromonte y centro",
        items: [
          "9:30 · Subida al Albaicín: plaza Larga y sus calles moriscas",
          "11:00 · Mirador de San Nicolás: la foto de la Alhambra con Sierra Nevada",
          "13:00 · Té y dulces árabes en una tetería de la calle Calderería",
          "14:30 · Comida con vistas o bajando hacia el centro",
          "16:30 · Catedral y Capilla Real (los Reyes Católicos)",
          "20:00 · Zambra flamenca en una cueva del Sacromonte",
        ],
      },
    ],
    practical: [
      "Alhambra: entradas oficiales en alhambra-patronato.es; se agotan con semanas.",
      "Presupuesto: 60-100 € por persona y día — de las capitales más baratas de España.",
      "El Albaicín se sube andando o en microbús C31/C32: cuestas serias.",
      "Las tapas van incluidas con la bebida: pedir 3 cañas es cenar.",
      "Mejor época: marzo-junio y septiembre-noviembre; en invierno, esquí a 40 min.",
    ],
    faq: [
      {
        q: "¿Qué pasa si no hay entradas de la Alhambra?",
        a: "Plan B parcial: Generalife y Alcazaba a veces tienen entradas sueltas, la visita nocturna se agota más tarde, y la Dobla de Oro combina monumentos del Albaicín. Pero los Palacios Nazaríes, sin reserva, no.",
      },
      {
        q: "¿Granada en una excursión de un día?",
        a: "Se hace desde Sevilla o Málaga, pero pierdes lo mejor: el atardecer desde San Nicolás y la noche de tapas. Duerme una noche al menos.",
      },
      {
        q: "¿Dónde alojarse en Granada?",
        a: "Centro (catedral) para comodidad, Albaicín bajo para el encanto (con cuestas y sin coche), Realejo para el equilibrio perfecto.",
      },
      {
        q: "¿Las tapas gratis son de verdad?",
        a: "Sí: con cada bebida (2,50-3,50 €) sale una tapa de cocina. En dos rondas has cenado. Zonas: calle Navas, plaza Nueva y el Realejo.",
      },
    ],
    related: ["sevilla", "madrid", "marrakech"],
  },
  {
    slug: "valencia",
    name: "Valencia",
    prefillDestination: "Valencia, España",
    tripTypes: ["food", "beach", "cultural"],
    nDays: 3,
    title: "Itinerario Valencia 3 días: paella, Ciudad de las Artes y playa (2026) | Itineraya",
    metaDescription:
      "Valencia en 3 días: casco antiguo y mercado Central, Ciudad de las Artes y las Ciencias, el Turia en bici, la Malvarrosa y la paella donde toca. Personalízalo gratis.",
    h1: "Itinerario de Valencia en 3 días: la ciudad del Turia",
    intro:
      "Valencia es la gran capital española más fácil de viajar: llana, con un parque de 9 km donde había un río, playa urbana de verdad y la mejor relación calidad-precio del Mediterráneo. Tres días dan para el casco antiguo, la Ciudad de las Artes y una paella hecha con respeto.",
    heroImage: `https://loremflickr.com/1600/900/valencia,spain,architecture`,
    days: [
      {
        title: "Día 1 — Casco antiguo",
        items: [
          "9:30 · Mercado Central: el templo del producto (desayuna allí)",
          "11:00 · Lonja de la Seda (Patrimonio de la Humanidad) y plaza Redonda",
          "12:30 · Catedral, el Miguelete y el Santo Grial",
          "14:00 · Comida en el barrio del Carmen",
          "17:00 · Torres de Serranos y de Quart al atardecer",
          "20:30 · Cena y calle por Ruzafa, el barrio con más vida",
        ],
      },
      {
        title: "Día 2 — Turia y Ciudad de las Artes",
        items: [
          "10:00 · Jardín del Turia en bici: 9 km de parque donde había un río",
          "12:00 · Ciudad de las Artes y las Ciencias: el conjunto de Calatrava",
          "13:00 · Oceanogràfic (el mayor acuario de Europa) o Museo de las Ciencias",
          "15:00 · Comida por la zona",
          "18:00 · Palmeral y umbráculo con la luz baja: las fotos buenas",
        ],
      },
      {
        title: "Día 3 — Paella y playa",
        items: [
          "10:30 · Playa de la Malvarrosa y paseo marítimo",
          "14:00 · Paella valenciana EN la playa o mejor: en El Palmar (la Albufera)",
          "17:00 · Paseo en barca por la Albufera al atardecer",
          "20:00 · Última horchata con fartons en una horchatería histórica",
        ],
      },
    ],
    practical: [
      "Valenbisi o bici de alquiler: la ciudad es llana y el Turia, una autopista verde.",
      "Presupuesto: 75-115 € por persona y día con alojamiento.",
      "La paella es comida de MEDIODÍA: los sitios serios no la sirven de noche.",
      "Entradas conjuntas de la Ciudad de las Artes: más baratas online.",
      "Mejor época: marzo (Fallas, si te van), abril-junio y septiembre-octubre.",
    ],
    faq: [
      {
        q: "¿Dónde se come la paella de verdad?",
        a: "En El Palmar (Albufera) o en los arroceros históricos de la Malvarrosa. La paella valenciana lleva pollo, conejo y garrofón — la 'mixta' es para turistas.",
      },
      {
        q: "¿Merece la pena el Oceanogràfic?",
        a: "Es el acuario más grande de Europa y está muy bien hecho: medio día. Si hay que elegir por presupuesto, pasear el conjunto de Calatrava gratis ya luce.",
      },
      {
        q: "¿Valencia tiene buena playa urbana?",
        a: "Sí: Malvarrosa y Patacona, anchas y con paseo. Para calas, El Saler y la Devesa a 15 min, dentro del parque natural de la Albufera.",
      },
      {
        q: "¿Dónde alojarse en Valencia?",
        a: "Ciutat Vella para turismo a pie, Ruzafa para gastronomía y noche, Cabanyal si quieres playa con alma de barrio marinero.",
      },
    ],
    related: ["barcelona", "madrid", "mallorca"],
  },
];
