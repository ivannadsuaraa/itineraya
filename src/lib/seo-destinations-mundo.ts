// Landings SEO — islas españolas y resto del mundo (10 destinos).
// Mismo formato que seo-destinations.ts; se concatenan allí.
import type { SeoDestination } from "./seo-destinations";

const U = "?w=1600&q=75&auto=format&fit=crop";

export const SEO_DESTINATIONS_MUNDO: SeoDestination[] = [
  {
    slug: "mallorca",
    name: "Mallorca",
    prefillDestination: "Mallorca, España",
    tripTypes: ["beach", "nature", "relax"],
    nDays: 5,
    title: "Itinerario Mallorca 5 días: calas, Tramuntana y Palma (2026) | Itineraya",
    metaDescription:
      "Mallorca en 5 días con coche: Palma y su catedral, los pueblos de la Tramuntana (Valldemossa, Deià, Sóller), calas turquesas y Formentor. Ruta anti-masificación. Gratis.",
    h1: "Itinerario de Mallorca en 5 días: la isla más allá de la playa",
    intro:
      "Mallorca son tres islas en una: la Palma monumental, la sierra de Tramuntana con sus pueblos de piedra, y las calas que salen en los fondos de pantalla. Con coche y madrugando — las calas buenas se llenan a las 11 — cinco días dan para las tres.",
    heroImage: `https://loremflickr.com/1600/900/mallorca,cala`,
    days: [
      {
        title: "Día 1 — Palma",
        items: [
          "9:30 · Catedral de Palma (La Seu) y el Palacio de la Almudaina",
          "11:30 · Casco antiguo: patios señoriales y el barrio judío",
          "14:00 · Comida en el mercado de Santa Catalina",
          "17:00 · Castillo de Bellver, el circular con vistas a la bahía",
          "20:30 · Cena y vermut por La Lonja",
        ],
      },
      {
        title: "Día 2 — Tramuntana: Valldemossa, Deià y Sóller",
        items: [
          "9:00 · Valldemossa antes de los autobuses: la cartuja y coca de patata",
          "11:30 · Deià: el pueblo de los artistas y la cala de piedras",
          "14:00 · Comida en el puerto de Sóller",
          "16:30 · Tren histórico de Sóller o jardines de Alfabia",
          "19:00 · Atardecer en el mirador de Sa Foradada — de los grandes del Mediterráneo",
        ],
      },
      {
        title: "Día 3 — Calas del este",
        items: [
          "8:30 · Cala Varques o Cala des Moro TEMPRANO (a las 11 no cabe un alma)",
          "13:00 · Comida en Portocolom o Portopetro",
          "15:30 · Segunda cala: Cala Mondragó (parque natural, parking)",
          "19:00 · Santanyí: mercado, galerías y cena",
        ],
      },
      {
        title: "Día 4 — Formentor y el norte",
        items: [
          "9:00 · Cabo de Formentor y su mirador (restricciones de coche en verano: bus/barco)",
          "12:00 · Playa de Formentor entre pinos",
          "14:30 · Comida en Pollença; subida a el Calvari",
          "17:00 · Alcúdia: la ciudad romana amurallada",
        ],
      },
      {
        title: "Día 5 — Es Trenc o senderismo",
        items: [
          "Opción A · Es Trenc: el Caribe balear (parking de pago, madruga)",
          "Opción B · Ruta por el Torrent de Pareis desde Sa Calobra",
          "18:00 · Última puesta de sol con vistas: Es Baluard en Palma o San Telmo",
        ],
      },
    ],
    practical: [
      "Coche imprescindible fuera de Palma; resérvalo con semanas en verano.",
      "Presupuesto: 90-150 € por persona y día en temporada media.",
      "Las calas top no tienen servicios: agua, sombrilla y escarpines.",
      "Junio y septiembre: mismo mar, mitad de gente que agosto.",
      "Formentor en verano: acceso restringido en coche — bus lanzadera o barco desde Pollença.",
    ],
    faq: [
      {
        q: "¿Cuántos días para Mallorca?",
        a: "5 días para Palma + Tramuntana + calas sin correr. Un fin de semana da para Palma y un día de sierra o cala, y te quedas con ganas.",
      },
      {
        q: "¿Hace falta coche en Mallorca?",
        a: "Para las calas y la Tramuntana, sí. Solo Palma y alrededores funciona en transporte público, pero pierdes lo mejor de la isla.",
      },
      {
        q: "¿Cuál es la mejor zona para alojarse?",
        a: "Palma para restaurantes y vida; Sóller o Pollença para la sierra; el sureste (Santanyí) para calas. Con 5 días, dos bases es la jugada.",
      },
      {
        q: "¿Mallorca en temporada baja merece la pena?",
        a: "De octubre a mayo la isla es otra: Tramuntana verde, almendros en flor (enero-febrero), precios a la mitad. Para playa, de junio a septiembre.",
      },
    ],
    related: ["tenerife", "valencia", "santorini"],
  },
  {
    slug: "tenerife",
    name: "Tenerife",
    prefillDestination: "Tenerife, España",
    tripTypes: ["nature", "beach", "adventure"],
    nDays: 5,
    title: "Itinerario Tenerife 5 días: Teide, Anaga y playas (2026) | Itineraya",
    metaDescription:
      "Tenerife en 5 días: amanecer sobre las nubes en el Teide, laurisilva de Anaga, La Laguna colonial, acantilados de Los Gigantes y playas negras y doradas. Personalízalo gratis.",
    h1: "Itinerario de Tenerife en 5 días: del volcán a la selva",
    intro:
      "Tenerife es un continente en miniatura: desierto volcánico a 2.400 metros, selva de laurisilva del terciario, ciudades coloniales y dos climas el mismo día. La clave es dividir la isla en norte (verde, auténtico) y sur (sol garantizado) y cruzarla por el Teide.",
    heroImage: `https://loremflickr.com/1600/900/tenerife,teide`,
    days: [
      {
        title: "Día 1 — Santa Cruz y La Laguna",
        items: [
          "10:00 · La Laguna: la ciudad colonial Patrimonio de la Humanidad",
          "13:00 · Comida en un guachinche (vino de la casa y carne fiesta)",
          "16:00 · Santa Cruz: el Auditorio y el parque García Sanabria",
          "19:00 · Atardecer en la playa de Las Teresitas, la de arena dorada",
        ],
      },
      {
        title: "Día 2 — Parque Nacional del Teide",
        items: [
          "8:00 · Subida por La Esperanza: miradores sobre el mar de nubes",
          "10:00 · Teleférico del Teide (reserva) o ruta de los Roques de García",
          "13:30 · Comida en el parador o pícnic entre coladas de lava",
          "16:00 · Paisaje lunar de los Azulejos y bajada por Vilaflor",
          "Opcional · Vuelve de noche: el cielo del Teide es reserva starlight",
        ],
      },
      {
        title: "Día 3 — Anaga, la selva",
        items: [
          "9:00 · Cruz del Carmen y sendero de los Sentidos (laurisilva)",
          "11:30 · Taganana y la playa de Benijo: el norte salvaje",
          "14:00 · Pescado en un chiringuito de Benijo con los roques delante",
          "17:00 · Playa de las Gaviotas o San Andrés",
        ],
      },
      {
        title: "Día 4 — El norte: Garachico y La Orotava",
        items: [
          "9:30 · La Orotava: casas de los balcones y jardines",
          "12:00 · Icod de los Vinos: el drago milenario",
          "13:30 · Comida en Garachico, el pueblo que renació de la lava",
          "16:00 · Piscinas naturales de El Caletón",
          "19:00 · Punta de Teno: el faro del fin del mundo (acceso restringido en coche: revisa horarios)",
        ],
      },
      {
        title: "Día 5 — Sur: Los Gigantes y ballenas",
        items: [
          "9:30 · Acantilados de Los Gigantes en barco (avistamiento de calderones casi garantizado)",
          "14:00 · Comida en Alcalá o La Caleta",
          "16:00 · Tarde de playa: El Duque o la playa negra de La Tejita",
          "19:30 · Última puesta de sol con La Gomera en el horizonte",
        ],
      },
    ],
    practical: [
      "Coche de alquiler desde el primer día: es barato y la isla es grande.",
      "Teleférico y pico del Teide (permiso de cumbre gratuito): reserva con semanas.",
      "Presupuesto: 80-130 € por persona y día — vuelos peninsulares desde 30 €.",
      "El norte puede estar nublado y el sur soleado el mismo día: plan flexible.",
      "Todo el año es temporada: 20-27 ºC constantes; el agua, fresca (20-23 ºC).",
    ],
    faq: [
      {
        q: "¿Norte o sur de Tenerife?",
        a: "Sur para sol seguro y resorts; norte para paisaje, pueblos y comida local. La respuesta correcta: base en el sur o Puerto de la Cruz y días de ruta.",
      },
      {
        q: "¿Se puede subir al pico del Teide?",
        a: "Sí, con permiso gratuito de cumbre (se agota con semanas) o durmiendo en el refugio de Altavista. Sin permiso, el teleférico te deja a 200 m de la cima.",
      },
      {
        q: "¿Cuántos días para Tenerife?",
        a: "5 días para Teide + Anaga + norte + un día de mar. Con 7, añade playa libre o salto a La Gomera en ferry (50 min).",
      },
      {
        q: "¿Cuándo es mejor ir?",
        a: "Siempre: es la eterna primavera. Mayo-junio y septiembre-octubre tienen el mejor equilibrio precio/clima/gente.",
      },
    ],
    related: ["mallorca", "marrakech", "bali"],
  },
  {
    slug: "marrakech",
    name: "Marrakech",
    prefillDestination: "Marrakech, Marruecos",
    tripTypes: ["cultural", "adventure", "food"],
    nDays: 4,
    title: "Itinerario Marrakech 4 días: medina, zocos y desierto (2026) | Itineraya",
    metaDescription:
      "Marrakech en 4 días: la medina sin perderte (o perdiéndote bien), Jemaa el-Fna, palacios y jardines, un hammam y la excursión al Atlas o Agafay. Con regateo y consejos. Gratis.",
    h1: "Itinerario de Marrakech en 4 días: caos hermoso y té a la menta",
    intro:
      "Marrakech se disfruta cuando aceptas sus reglas: te vas a perder en la medina (está bien), todo se regatea (está bien) y la calma se compra en forma de riad, jardín o hammam. Cuatro días: dos de medina, uno de palacios y jardines, y uno fuera — Atlas o desierto de Agafay.",
    heroImage: `https://images.unsplash.com/photo-1539020140153-e479b8c22e70${U}`,
    days: [
      {
        title: "Día 1 — La medina y Jemaa el-Fna",
        items: [
          "9:00 · Mezquita Koutoubia (por fuera) y primeras calles de la medina",
          "10:30 · Zocos con calma: especias, cuero, latón — mira hoy, compra mañana",
          "13:30 · Comida en una azotea sobre el zoco",
          "16:00 · Madraza Ben Youssef, la joya que sí se visita",
          "18:30 · Jemaa el-Fna cuando despierta: cuentacuentos, humo y zumo de naranja",
          "20:30 · Cena en la plaza (puesto concurrido = puesto seguro) o en un riad",
        ],
      },
      {
        title: "Día 2 — Palacios y el sur de la medina",
        items: [
          "9:00 · Palacio de la Bahía al abrir",
          "11:00 · Tumbas Saadíes y palacio El Badi",
          "13:30 · Comida en el barrio judío (Mellah) y su zoco de especias",
          "16:00 · Hammam tradicional o de lujo: 2 horas de otro mundo",
          "20:00 · Cena con música gnawa",
        ],
      },
      {
        title: "Día 3 — Jardines y Gueliz",
        items: [
          "8:30 · Jardín Majorelle al abrir (reserva online) y museo YSL",
          "11:30 · Jardín Secreto en plena medina",
          "13:30 · Comida en Gueliz, el Marrakech francés",
          "16:00 · Compras de diseño marroquí moderno en Gueliz o Sidi Ghanem",
          "19:00 · Atardecer con la Koutoubia desde una azotea",
        ],
      },
      {
        title: "Día 4 — Atlas o desierto de Agafay",
        items: [
          "Opción A · Valle del Ourika o las cascadas de Ouzoud (día completo)",
          "Opción B · Desierto de Agafay: quad o camello + cena bereber bajo las estrellas",
          "Opción C · Essaouira, el puerto atlántico bohemio (2,5 h por trayecto)",
        ],
      },
    ],
    practical: [
      "Dirham marroquí (MAD): lleva efectivo para zocos y taxis; regatea desde el 40-50%.",
      "Presupuesto: 50-90 € por persona y día — los riads buenos desde 60 €/noche.",
      "Duerme en riad dentro de la medina: es la mitad de la experiencia.",
      "Taxis: pide precio ANTES o exige contador; del aeropuerto, precio fijo.",
      "Mejor época: octubre-abril; julio-agosto supera los 40 ºC.",
    ],
    faq: [
      {
        q: "¿Marrakech es segura?",
        a: "Sí, con picaresca: guías espontáneos ('eso está cerrado, ven por aquí'), henna no pedida y precios inventados. Un 'la, shukran' (no, gracias) firme resuelve el 95%.",
      },
      {
        q: "¿Cuánto se regatea en los zocos?",
        a: "Empieza ofreciendo un 40-50% del precio inicial y cierra en torno al 60-70%. Con sonrisa y sin prisa: es un juego social, no una guerra.",
      },
      {
        q: "¿Merece la pena dormir en el desierto?",
        a: "El Sáhara de dunas (Merzouga) está a 9 h: solo con 3+ días extra. La alternativa realista es Agafay, desierto de piedra a 40 min con campamentos y cena bereber.",
      },
      {
        q: "¿Cómo vestir en Marrakech?",
        a: "Cómodo y respetuoso: hombros y rodillas cubiertos te ahorran miradas y abre puertas (y protege del sol). Las turistas no necesitan velo.",
      },
    ],
    related: ["estambul", "granada", "dubai"],
  },
  {
    slug: "bangkok",
    name: "Bangkok",
    prefillDestination: "Bangkok, Tailandia",
    tripTypes: ["cultural", "food", "party"],
    nDays: 4,
    title: "Itinerario Bangkok 4 días: templos, mercados y comida callejera (2026) | Itineraya",
    metaDescription:
      "Bangkok en 4 días: Gran Palacio y Wat Pho temprano, mercados flotantes y de trenes, Chinatown de noche, klongs en barca y azoteas. La puerta perfecta a Tailandia. Gratis.",
    h1: "Itinerario de Bangkok en 4 días: el caos que engancha",
    intro:
      "Bangkok o la odias 24 horas o la amas para siempre — casi siempre las dos cosas en ese orden. El secreto es el ritmo: templos al amanecer antes del calor, centros comerciales o masaje en las horas de plomo, y la ciudad de verdad — mercados, klongs, comida callejera — cuando baja el sol.",
    heroImage: `https://images.unsplash.com/photo-1508009603885-50cf7c579365${U}`,
    days: [
      {
        title: "Día 1 — Templos imperiales",
        items: [
          "8:00 · Gran Palacio y Buda Esmeralda al abrir (vestimenta: rodillas y hombros)",
          "11:00 · Wat Pho: el Buda reclinado y la escuela de masaje original",
          "13:00 · Comida callejera junto al río",
          "15:00 · Cruzar en ferry a Wat Arun, el templo del amanecer",
          "18:00 · Atardecer en una azotea con vistas al Chao Phraya",
          "20:00 · Cena en Chinatown (Yaowarat): la mejor calle de comida de Asia",
        ],
      },
      {
        title: "Día 2 — Klongs y barrios",
        items: [
          "9:00 · Barca de cola larga por los klongs de Thonburi: la Bangkok canal",
          "12:00 · Museo de la casa de Jim Thompson",
          "14:00 · Comida en un food court de nivel (sí, en Tailandia lo son)",
          "16:00 · Templo dorado de Wat Saket (monte artificial con vistas)",
          "19:00 · Talad Neon o mercado nocturno que toque; masaje tailandés de una hora",
        ],
      },
      {
        title: "Día 3 — Mercados de fin de semana",
        items: [
          "8:30 · Mercado flotante (Damnoen Saduak temprano o Amphawa por la tarde)",
          "12:00 · Mercado del tren de Maeklong: los puestos se pliegan al pasar el tren",
          "16:00 · Vuelta y descanso; piscina o spa",
          "19:30 · Sukhumvit o Khao San según tu tribu: cóctel de azotea o cubo de fiesta",
        ],
      },
      {
        title: "Día 4 — Chatuchak o Ayutthaya",
        items: [
          "Opción A (finde) · Mercado de Chatuchak: 15.000 puestos, ve temprano",
          "Opción B · Ayutthaya, la antigua capital en ruinas (tren, 1,5 h)",
          "18:00 · Última cena: pad thai donde haya cola de locales",
        ],
      },
    ],
    practical: [
      "Baht tailandés (THB); efectivo para calle y mercados, tarjeta en el resto.",
      "Presupuesto: 40-80 € por persona y día — el lujo asiático es asequible.",
      "BTS/MRT + barcos de línea: el tráfico de superficie es leyenda por algo.",
      "Templos: hombros y rodillas cubiertos, descalzo dentro; respeto con los budas.",
      "Mejor época: noviembre-febrero (seco y 'fresco'); abril-mayo abrasa.",
    ],
    faq: [
      {
        q: "¿Cuántos días en Bangkok antes de islas o norte?",
        a: "3-4 días: templos, un día de mercados y uno de klongs/Chinatown. Es mejor puerta de entrada que de salida — el caos se digiere mejor al llegar.",
      },
      {
        q: "¿La comida callejera es segura?",
        a: "En general, sí: elige puestos con rotación (cola de locales), comida hecha al momento y bebidas selladas. El estómago agradece empezar suave con el picante.",
      },
      {
        q: "¿Dónde alojarse en Bangkok?",
        a: "Riverside para el encanto (y los ferrys), Sukhumvit para metro y vida moderna, la zona vieja (Banglamphu) para templos a pie y precios de mochilero.",
      },
      {
        q: "¿Timos habituales?",
        a: "El clásico: 'el Gran Palacio está cerrado hoy' + tuk-tuk a tiendas de gemas. El palacio abre todos los días; camina y compra tú los billetes.",
      },
    ],
    related: ["bali", "tokio", "dubai"],
  },
  {
    slug: "dubai",
    name: "Dubái",
    prefillDestination: "Dubái, Emiratos Árabes Unidos",
    tripTypes: ["adventure", "relax", "party"],
    nDays: 4,
    title: "Itinerario Dubái 4 días: Burj Khalifa, desierto y zocos (2026) | Itineraya",
    metaDescription:
      "Dubái en 4 días: Burj Khalifa al atardecer, el Dubái viejo y sus zocos, safari por el desierto, Marina y playas. Cuándo ir, presupuesto y trucos para que no te arruine. Gratis.",
    h1: "Itinerario de Dubái en 4 días: del zoco al rascacielos",
    intro:
      "Dubái es dos ciudades: la del récord Guinness — el edificio más alto, la fuente más grande — y la vieja ciudad comercial del Creek, con zocos de oro y especias y abras de madera por un dirham. El itinerario bueno alterna ambas y remata con la mejor obra de la zona: el desierto.",
    heroImage: `https://images.unsplash.com/photo-1512453979798-5ea266f8880c${U}`,
    days: [
      {
        title: "Día 1 — Downtown y el Burj Khalifa",
        items: [
          "10:00 · Dubai Mall: acuario y la escala del asunto",
          "13:00 · Comida en el food hall (opciones de todo el mundo)",
          "16:30 · Burj Khalifa 'At the Top' al atardecer (reserva la franja con días)",
          "19:00 · Fuentes danzantes del Burj Lake (cada 30 min)",
          "21:00 · Cena en Downtown o Souk Al Bahar",
        ],
      },
      {
        title: "Día 2 — El Dubái viejo",
        items: [
          "9:00 · Barrio histórico de Al Fahidi y museo del cruce en abra (1 AED)",
          "11:00 · Zoco de las especias y zoco del oro en Deira",
          "13:30 · Comida iraní o india en Deira (la mejor comida real de la ciudad)",
          "16:00 · Museo del Futuro o Frame de Dubái",
          "19:00 · Cena en un dhow por el Creek o vuelta a los zocos de noche",
        ],
      },
      {
        title: "Día 3 — Desierto",
        items: [
          "9:00 · Mañana de playa: JBR o Kite Beach con el skyline detrás",
          "15:00 · Safari por el desierto: dunas en 4x4, atardecer, camellos",
          "20:00 · Cena en el campamento con cielo estrellado",
        ],
      },
      {
        title: "Día 4 — Marina, Palm y despedida",
        items: [
          "10:00 · Dubai Marina y paseo de JBR",
          "12:00 · The Palm: mirador The View o el Atlantis por fuera",
          "14:00 · Comida en la Marina",
          "17:00 · Última tarde: souk Madinat Jumeirah con el Burj Al Arab de fondo",
        ],
      },
    ],
    practical: [
      "Mejor época: noviembre-marzo (25-30 ºC); de junio a septiembre, 45 ºC y vida indoor.",
      "Presupuesto: 100-180 € por persona y día — comer barato es posible fuera de los malls.",
      "Metro limpio y barato + taxis asequibles; vestimenta: discreción en zonas no turísticas.",
      "Burj Khalifa: la franja del atardecer se agota — reserva online con antelación.",
      "Ramadán: la ciudad funciona, pero revisa fechas y horarios de restaurantes.",
    ],
    faq: [
      {
        q: "¿Cuántos días merece Dubái?",
        a: "3-4 días: Downtown, ciudad vieja, desierto y Marina. Es escala perfecta (Emirates permite stopover) camino de Asia o de vuelta.",
      },
      {
        q: "¿Dubái es solo lujo?",
        a: "No: el Dubái del Creek — abras a 1 dirham, zocos, comida india e iraní — es barato y con más alma que los malls. El lujo es opcional.",
      },
      {
        q: "¿Qué normas conviene conocer?",
        a: "Nada de alcohol fuera de locales con licencia, discreción en muestras de afecto y ropa razonable en zonas no turísticas. Con sentido común, cero problemas.",
      },
      {
        q: "¿Merece la pena el safari del desierto?",
        a: "Es lo mejor de la visita: dunas al atardecer, cena bereber y silencio. Elige operador con campamento pequeño y evita los 'macro-campamentos' de 200 personas.",
      },
    ],
    related: ["marrakech", "estambul", "bangkok"],
  },
  {
    slug: "cancun",
    name: "Cancún y Riviera Maya",
    prefillDestination: "Cancún, México",
    tripTypes: ["beach", "adventure", "relax"],
    nDays: 7,
    title: "Itinerario Cancún y Riviera Maya 7 días: cenotes, ruinas y Caribe (2026) | Itineraya",
    metaDescription:
      "Una semana en la Riviera Maya: Tulum y Chichén Itzá, cenotes sin multitudes, Isla Mujeres o Cozumel, Bacalar y el Caribe turquesa. Ruta con o sin coche. Personalízalo gratis.",
    h1: "Itinerario de Cancún y Riviera Maya en 7 días: más que all-inclusive",
    intro:
      "El error clásico es no salir del resort: la península de Yucatán tiene ruinas mayas de primera, cenotes de agua cristalina y pueblos con sabor a 40 minutos de la piscina. Esta semana equilibra Caribe (3 días de playa e islas) con Yucatán profundo (ruinas, cenotes y Valladolid).",
    heroImage: `https://images.unsplash.com/photo-1552074284-5e88ef1aef18${U}`,
    days: [
      {
        title: "Días 1-2 — Cancún e Isla Mujeres",
        items: [
          "Playa Delfines (pública, con el cartel de Cancún) y hotel zone",
          "Ferry a Isla Mujeres: Playa Norte, top-5 del Caribe, y vuelta en carrito de golf",
          "Cena en el centro de Cancún (Parque de las Palapas): el México real",
        ],
      },
      {
        title: "Día 3 — Chichén Itzá y Valladolid",
        items: [
          "7:00 · Salida temprano a Chichén Itzá: la pirámide sin el 90% de la gente",
          "11:30 · Cenote Ik Kil o Suytun (el de la foto con plataforma)",
          "14:00 · Comida en Valladolid: lomitos y marquesitas",
          "16:00 · Valladolid: casonas de colores y el convento de Sisal",
        ],
      },
      {
        title: "Día 4 — Tulum",
        items: [
          "8:00 · Ruinas de Tulum al abrir: la única ciudad maya con Caribe debajo",
          "11:00 · Playa Paraíso o las clubs de playa de la zona hotelera",
          "14:00 · Comida en el pueblo (no en la zona de playa: mitad de precio)",
          "16:00 · Cenote Gran Cenote o Calavera para el chapuzón",
        ],
      },
      {
        title: "Día 5 — Cenotes y Akumal",
        items: [
          "9:00 · Ruta de cenotes de la 307: Dos Ojos o Jardín del Edén",
          "13:00 · Comida en Akumal; por la tarde, snorkel con tortugas (con guía respetuoso)",
          "19:00 · Atardecer y cena en Puerto Aventuras o Playa del Carmen",
        ],
      },
      {
        title: "Días 6-7 — Bacalar o Cozumel + despedida",
        items: [
          "Opción A · Bacalar: la laguna de los 7 colores (2 h al sur, vale cada minuto)",
          "Opción B · Cozumel en ferry: el mejor snorkel/buceo de México",
          "Último día · Playa libre, compras y vuelo",
        ],
      },
    ],
    practical: [
      "Coche de alquiler = libertad total (ojo a los topes); si no, colectivos y ADO.",
      "Presupuesto: 70-130 € por persona y día según hotel; comer local es barato.",
      "Cenotes: protector solar BIODEGRADABLE o mejor ninguno (te lo pedirán).",
      "Sargazo: revisa el mapa en temporada (mayo-agosto); las islas suelen librarse.",
      "Mejor época: noviembre-abril; septiembre-octubre es lotería de lluvia y sargazo.",
    ],
    faq: [
      {
        q: "¿Cancún o Riviera Maya?",
        a: "Cancún para playa espectacular y vida nocturna; Playa del Carmen o Tulum como base para cenotes y ruinas. La jugada: 2-3 noches en cada zona.",
      },
      {
        q: "¿Chichén Itzá por libre o excursión?",
        a: "Por libre con coche saliendo a las 7:00 ganas dos horas a los autobuses y eliges tus cenotes. Sin coche, las excursiones tempranas cumplen.",
      },
      {
        q: "¿Es seguro viajar por Yucatán?",
        a: "La península es de las zonas más seguras de México para el turista. Precauciones normales de cualquier destino: nada específico que temer en la ruta descrita.",
      },
      {
        q: "¿Merece la pena Bacalar?",
        a: "Si tienes 2 días extra, es de lo mejor del viaje: una laguna dulce de siete azules sin el gentío de la costa. Ve antes de que se masifique.",
      },
    ],
    related: ["ciudad-de-mexico", "rio-de-janeiro", "bali"],
  },
  {
    slug: "ciudad-de-mexico",
    name: "Ciudad de México",
    prefillDestination: "Ciudad de México, México",
    tripTypes: ["cultural", "food", "party"],
    nDays: 5,
    title: "Itinerario Ciudad de México 5 días: centro, Frida y tacos (2026) | Itineraya",
    metaDescription:
      "CDMX en 5 días: Zócalo y Templo Mayor, Chapultepec y Antropología, Coyoacán con Frida, Teotihuacán al amanecer, Xochimilco y la mejor ruta de tacos. Personalízalo gratis.",
    h1: "Itinerario de Ciudad de México en 5 días: la capital que se come",
    intro:
      "CDMX es enorme, pero se viaja por barrios-planeta: el Centro Histórico sobre la antigua Tenochtitlan, la Roma-Condesa de las terrazas, Coyoacán y Frida, y dos salidas obligadas — las pirámides de Teotihuacán y las trajineras de Xochimilco. Y entre todo, tacos: es el mejor destino gastronómico del continente.",
    heroImage: `https://images.unsplash.com/photo-1518105779142-d975f22f1b0a${U}`,
    days: [
      {
        title: "Día 1 — Centro Histórico",
        items: [
          "9:00 · Zócalo, Catedral Metropolitana y Templo Mayor (la ciudad azteca debajo)",
          "12:00 · Palacio Nacional: los murales de Diego Rivera",
          "14:00 · Comida en un clásico del centro (Azul Histórico o cantina)",
          "16:30 · Palacio de Bellas Artes y mirador de la Torre Latinoamericana",
          "19:00 · Plaza Garibaldi con mariachis (temprano) y cena de tacos al pastor",
        ],
      },
      {
        title: "Día 2 — Chapultepec y Polanco",
        items: [
          "9:00 · Museo Nacional de Antropología: 3 h mínimo, la sala mexica es cumbre mundial",
          "13:30 · Comida en Polanco",
          "15:30 · Castillo de Chapultepec y su bosque",
          "18:00 · Paseo por Reforma; el Ángel de la Independencia",
          "20:30 · Cena en la Roma o Condesa: la escena que sale en las listas mundiales",
        ],
      },
      {
        title: "Día 3 — Teotihuacán",
        items: [
          "7:00 · Salida a Teotihuacán (1 h): pirámides del Sol y la Luna con fresco",
          "12:00 · Comida en una cueva-restaurante junto al sitio o vuelta a la ciudad",
          "16:00 · Basílica de Guadalupe a la vuelta (opcional)",
          "20:00 · Mezcal y cena tranquila: mañana también se madruga poco",
        ],
      },
      {
        title: "Día 4 — Coyoacán y San Ángel",
        items: [
          "9:30 · Museo Frida Kahlo (reserva con semanas) y casa de Trotski",
          "12:30 · Centro de Coyoacán: mercado, tostadas y churros",
          "16:00 · San Ángel (sábado: bazar de arte) o museo Anahuacalli",
          "20:00 · Cena y pulquería o mezcalería en la Roma",
        ],
      },
      {
        title: "Día 5 — Xochimilco y despedida",
        items: [
          "10:00 · Trajineras de Xochimilco: 2 h de canales, música y micheladas",
          "14:00 · Comida de barbacoa o el mercado de Coyoacán",
          "17:00 · Últimas compras: La Ciudadela para artesanía",
        ],
      },
    ],
    practical: [
      "Altitud 2.240 m: hidrátate y tómatelo con calma el primer día.",
      "Presupuesto: 60-110 € por persona y día — la relación calidad-precio gastro es imbatible.",
      "Muévete en Uber/Didi (baratos y seguros) + metro en horas valle.",
      "Museo Frida: SOLO con reserva online anticipada; se agota con semanas.",
      "Mejor época: octubre-mayo (seco); las lluvias de verano son chaparrones de tarde.",
    ],
    faq: [
      {
        q: "¿CDMX es segura para turistas?",
        a: "En los barrios del itinerario (Centro, Roma, Condesa, Polanco, Coyoacán), sí, con precauciones de gran ciudad: Uber de noche, nada de ostentación, efectivo justo.",
      },
      {
        q: "¿Cuántos días necesito?",
        a: "5 días para los barrios + Teotihuacán + Xochimilco. Con 7, añade Puebla o los viñedos de Querétaro.",
      },
      {
        q: "¿Dónde comer los mejores tacos?",
        a: "Pastor: El Vilsito o El Huequito. Suadero: los puestos nocturnos de la Roma. Y un consejo: donde haya cola de chilangos a medianoche, entra.",
      },
      {
        q: "¿Teotihuacán por libre?",
        a: "Sí: Uber o autobús desde Autobuses del Norte (1 h). Llega a las 8:00 cuando abre — a las 11 el sol y los grupos pegan fuerte. Ya no se pueden subir las pirámides.",
      },
    ],
    related: ["cancun", "cusco", "buenos-aires"],
  },
  {
    slug: "buenos-aires",
    name: "Buenos Aires",
    prefillDestination: "Buenos Aires, Argentina",
    tripTypes: ["cultural", "food", "party"],
    nDays: 5,
    title: "Itinerario Buenos Aires 5 días: tango, asado y barrios (2026) | Itineraya",
    metaDescription:
      "Buenos Aires en 5 días: San Telmo y La Boca, Recoleta y su cementerio, Palermo de día y de noche, milonga de verdad, asado y un día en el Tigre. Personalízalo gratis.",
    h1: "Itinerario de Buenos Aires en 5 días: la ciudad de la nostalgia",
    intro:
      "Buenos Aires se recorre por barrios con personalidad propia: el sur tanguero y obrero (San Telmo, La Boca), el norte elegante (Recoleta), y Palermo, que es donde la ciudad come, bebe y sale. Cinco días dan para todos, una milonga de verdad y una escapada al delta del Tigre.",
    heroImage: `https://loremflickr.com/1600/900/buenos,aires,argentina`,
    days: [
      {
        title: "Día 1 — Centro y Puerto Madero",
        items: [
          "10:00 · Plaza de Mayo, Casa Rosada y Catedral (la capilla de Francisco)",
          "12:00 · Café Tortoni o London City: el rito del café porteño",
          "14:00 · Comida en Puerto Madero o el Mercado de San Telmo",
          "16:30 · Obelisco y avenida Corrientes: librerías y pizza al molde",
          "20:00 · El Ateneo Grand Splendid: la librería-teatro",
          "21:30 · Primera cena porteña: bife de chorizo (se cena tarde, como en casa)",
        ],
      },
      {
        title: "Día 2 — San Telmo y La Boca",
        items: [
          "10:00 · San Telmo: mercado, anticuarios y la feria si es domingo",
          "13:00 · Parrilla de barrio en San Telmo",
          "15:00 · La Boca: Caminito, La Bombonera (museo) — de día y por la zona turística",
          "18:00 · Vuelta por Barracas o directo a descansar",
          "22:00 · Milonga de verdad (La Viruta, Salon Canning): ver, y si te animas, clase previa",
        ],
      },
      {
        title: "Día 3 — Recoleta y Palermo",
        items: [
          "10:00 · Cementerio de la Recoleta: Evita y el mausoleo infinito",
          "12:00 · Museo de Bellas Artes (gratis) o el MALBA",
          "14:00 · Comida en Palermo Soho",
          "16:00 · Bosques de Palermo y el Rosedal",
          "20:00 · Palermo de noche: bares con premio mundial y parrillas de autor",
        ],
      },
      {
        title: "Día 4 — Tigre y el delta",
        items: [
          "9:00 · Tren de la Costa o mitre a Tigre (1 h)",
          "10:30 · Lancha colectiva por el delta: la vida entre ríos",
          "13:30 · Almuerzo en un recreo isleño",
          "17:00 · Puerto de Frutos para compras y vuelta",
          "21:30 · Cena de despedida del barrio que más te haya gustado",
        ],
      },
      {
        title: "Día 5 — Lo que faltó",
        items: [
          "10:30 · Barrio Chino y Belgrano, o el Konex si hay percusión (lunes)",
          "13:00 · Última parrilla o milanesa napolitana",
          "16:00 · Compras: cuero, vino, alfajores y dulce de leche para la maleta",
        ],
      },
    ],
    practical: [
      "Cambio: paga con tarjeta extranjera (tipo de cambio turista) o Western Union; infórmate al llegar, cambia poco.",
      "Presupuesto: 50-100 € por persona y día — para el visitante europeo es asequible.",
      "SUBE para colectivos y subte; Uber/Cabify funcionan bien.",
      "La Boca: solo la zona turística de Caminito y de día.",
      "Mejor época: marzo-mayo y septiembre-noviembre (primavera/otoño austral).",
    ],
    faq: [
      {
        q: "¿Cuántos días para Buenos Aires?",
        a: "4-5 días para los barrios + Tigre. Muchos la combinan con Iguazú (2 días, vuelo interno) o una estancia pampeana.",
      },
      {
        q: "¿Dónde ver tango auténtico?",
        a: "Las cenas-show son espectáculo (bueno, pero show). La milonga — La Viruta, Canning — es donde el tango se baila de verdad; entrada por poco dinero y clase incluida muchas noches.",
      },
      {
        q: "¿Buenos Aires es segura?",
        a: "Como toda gran capital: microcentro y turísticas de día sin problema, móvil guardado en el subte, La Boca solo zona turística. Palermo y Recoleta, tranquilas de noche.",
      },
      {
        q: "¿Qué hay que comer sí o sí?",
        a: "Bife de chorizo con malbec, empanadas (salteñas si las ves), milanesa napolitana, helado de dulce de leche y un alfajor de maicena. Se viene a engordar.",
      },
    ],
    related: ["cusco", "rio-de-janeiro", "ciudad-de-mexico"],
  },
  {
    slug: "cusco",
    name: "Cusco y Machu Picchu",
    prefillDestination: "Cusco, Perú",
    tripTypes: ["adventure", "cultural", "nature"],
    nDays: 6,
    title: "Itinerario Cusco y Machu Picchu 6 días: Valle Sagrado (2026) | Itineraya",
    metaDescription:
      "6 días entre Cusco, el Valle Sagrado y Machu Picchu: aclimatación bien hecha, Pisac y Ollantaytambo, la ciudadela al amanecer y la montaña de colores. Entradas y consejos. Gratis.",
    h1: "Itinerario de Cusco y Machu Picchu en 6 días: el viaje de la vida, bien hecho",
    intro:
      "El error nº1 en Cusco es la altitud: llegar a 3.400 m y querer subir cerros el primer día. Este plan aclimata bajando — el Valle Sagrado está más bajo que Cusco — y deja Machu Picchu para el tercer día, cuando el cuerpo ya entiende dónde está. Las entradas, eso sí, se compran con semanas.",
    heroImage: `https://images.unsplash.com/photo-1526392060635-9d6019884377${U}`,
    days: [
      {
        title: "Día 1 — Cusco suave",
        items: [
          "Llegada y mate de coca: día de aclimatación SIN esfuerzos",
          "16:00 · Plaza de Armas, catedral y barrio de San Blas paseando lento",
          "19:00 · Cena ligera (la digestión pesada y la altura no se llevan)",
        ],
      },
      {
        title: "Día 2 — Valle Sagrado: Pisac y Ollantaytambo",
        items: [
          "8:30 · Ruinas y mercado de Pisac",
          "13:00 · Almuerzo en Urubamba",
          "15:00 · Fortaleza de Ollantaytambo y su pueblo inca vivo",
          "19:00 · Noche en Ollantaytambo o tren a Aguas Calientes",
        ],
      },
      {
        title: "Día 3 — Machu Picchu",
        items: [
          "5:30 · Primeros buses a la ciudadela: amanecer entre nubes",
          "6:00-10:00 · Machu Picchu con guía (circuito según tu entrada)",
          "Opcional · Huayna Picchu o Montaña (entrada aparte, agotada con meses)",
          "Tarde · Tren de vuelta; noche en Cusco",
        ],
      },
      {
        title: "Día 4 — Cusco a fondo",
        items: [
          "9:00 · Qorikancha: el templo del sol bajo el convento",
          "11:00 · Sacsayhuamán y los miradores sobre la ciudad",
          "14:00 · Comida en el mercado de San Pedro (menú local) o picantería",
          "17:00 · Museos o compras de alpaca de verdad (no 'maybe alpaca')",
        ],
      },
      {
        title: "Día 5 — Montaña de colores o Moray y Maras",
        items: [
          "Opción A · Vinicunca (montaña de 7 colores): madrugón y 5.000 m — solo ya aclimatado",
          "Opción B · Moray (los anillos incas) y salineras de Maras: media jornada suave",
          "19:00 · Cena de celebración: cuy para valientes, alpaca para todos",
        ],
      },
      {
        title: "Día 6 — Despedida",
        items: [
          "Mañana libre por San Blas: café con vistas y últimas compras",
          "Vuelo o continuación a Arequipa/Titicaca",
        ],
      },
    ],
    practical: [
      "Entradas de Machu Picchu con circuito y franja: cómpralas en la web oficial con semanas (Huayna Picchu, con meses).",
      "Tren PeruRail/IncaRail desde Ollantaytambo: reserva también anticipada.",
      "Altitud: 2 días de calma, agua, poca cena y mate de coca. Sorojchi pills si eres propenso.",
      "Presupuesto: 60-110 € por persona y día incluyendo tren y entradas prorrateadas.",
      "Mejor época: mayo-septiembre (seca); febrero cierra el Camino Inca.",
    ],
    faq: [
      {
        q: "¿Machu Picchu se puede hacer en el día desde Cusco?",
        a: "Se puede pero es una paliza (madrugón de 4:00 y vuelta a las 22:00). Dormir en Aguas Calientes u Ollantaytambo la víspera cambia el viaje.",
      },
      {
        q: "¿Camino Inca o tren?",
        a: "El Camino Inca clásico (4 días) es inolvidable y se agota con 4-6 meses. Alternativas: Salkantay (5 días, sin cupos tan estrictos) o el tren, que es panorámico y digno.",
      },
      {
        q: "¿Cómo llevo la altitud?",
        a: "Los dos primeros días mandan: nada de alcohol ni esfuerzos, comidas ligeras, mucha agua. El Valle Sagrado (2.800 m) es mejor primera noche que Cusco (3.400 m).",
      },
      {
        q: "¿La montaña de colores merece la pena?",
        a: "Es espectacular pero exigente: 3:30 de madrugón y caminar a 5.000 m. Solo al final del viaje, ya aclimatado. Si dudas, Palccoyo es la versión suave.",
      },
    ],
    related: ["buenos-aires", "ciudad-de-mexico", "rio-de-janeiro"],
  },
  {
    slug: "rio-de-janeiro",
    name: "Río de Janeiro",
    prefillDestination: "Río de Janeiro, Brasil",
    tripTypes: ["beach", "party", "nature"],
    nDays: 5,
    title: "Itinerario Río de Janeiro 5 días: Cristo, playas y samba (2026) | Itineraya",
    metaDescription:
      "Río en 5 días: Cristo Redentor y Pan de Azúcar con la mejor luz, Copacabana e Ipanema como un carioca, Santa Teresa, samba en Lapa y la selva de Tijuca. Personalízalo gratis.",
    h1: "Itinerario de Río de Janeiro en 5 días: la ciudad maravillosa",
    intro:
      "Río es la única megaciudad metida dentro de una selva entre montañas y playas — y eso ordena el viaje: los iconos (Cristo, Pan de Azúcar) con la luz correcta, las playas con sus códigos, y la noche donde suena la samba de verdad. Cinco días, ritmo carioca: sin prisa, pero sin perder el atardecer.",
    heroImage: `https://images.unsplash.com/photo-1483729558449-99ef09a8c325${U}`,
    days: [
      {
        title: "Día 1 — Copacabana e Ipanema",
        items: [
          "9:00 · Paseo por la orla de Copacabana: el mosaico de Burle Marx",
          "11:00 · Playa a la carioca: silla, sombrilla y agua de coco (puesto fijo)",
          "14:00 · Comida en un quilo (buffet al peso): el invento que amarás",
          "17:30 · Atardecer en el Arpoador: la roca donde Ipanema aplaude al sol",
          "21:00 · Cena en Ipanema o Leblon",
        ],
      },
      {
        title: "Día 2 — Cristo y Santa Teresa",
        items: [
          "8:00 · Cristo Redentor en el primer tren del Corcovado (antes de las nubes)",
          "11:30 · Santa Teresa: el barrio bohemio de las colinas, en bondinho o a pie",
          "13:30 · Feijoada en Santa Teresa (mejor si es viernes o sábado)",
          "16:00 · Escalera de Selarón y arcos de Lapa",
          "22:00 · Samba en Lapa: Rio Scenarium o una roda callejera",
        ],
      },
      {
        title: "Día 3 — Pan de Azúcar y Urca",
        items: [
          "9:00 · Playa Vermelha y sendero del Morro da Urca (o teleférico directo)",
          "16:30 · Teleférico al Pan de Azúcar para el ATARDECER: la vista definitiva",
          "20:00 · Cerveza en el murito de Urca, el aperitivo más carioca",
          "21:30 · Cena en Botafogo, el barrio foodie",
        ],
      },
      {
        title: "Día 4 — Selva de Tijuca o Niterói",
        items: [
          "Opción A · Floresta da Tijuca: cascadas y miradores en la selva urbana",
          "Opción B · Museo de Niterói (Niemeyer) en ferry + playa de Itacoatiara",
          "18:00 · Puesta de sol en la laguna Rodrigo de Freitas en bici",
        ],
      },
      {
        title: "Día 5 — Centro y despedida",
        items: [
          "10:00 · Centro histórico: Teatro Municipal, Confeitaria Colombo y bulevar Olímpico",
          "12:00 · Museo del Mañana o los murales de Kobra",
          "14:00 · Última comida: picanha en una churrascaria",
          "16:00 · Playa final o compras en Ipanema (havaianas y cachaça)",
        ],
      },
    ],
    practical: [
      "Seguridad: playa sin móvil a la vista ni objetos, Uber de noche, copias del pasaporte. Sentido común y disfrute.",
      "Presupuesto: 60-110 € por persona y día — el real juega a favor del euro.",
      "Cristo: primer horario del tren o van; Pan de Azúcar: al atardecer. Ese orden.",
      "Playas con oleaje serio: báñate donde lo hagan los cariocas.",
      "Mejor época: abril-junio y agosto-octubre; carnaval es otro planeta (y otros precios).",
    ],
    faq: [
      {
        q: "¿Río es seguro para turistas?",
        a: "Con reglas claras, sí: zona sur (Copacabana-Leblon) de día sin problema, nada de valor a la playa, Uber por la noche y evitar calles vacías. Millones de turistas al año lo disfrutan sin incidentes.",
      },
      {
        q: "¿Cristo y Pan de Azúcar el mismo día?",
        a: "Mejor no: el Cristo pide la mañana despejada y el Pan de Azúcar, el atardecer. En días distintos duplicas la probabilidad de cielo limpio.",
      },
      {
        q: "¿Dónde alojarse en Río?",
        a: "Ipanema o Leblon (más tranquilos y caros), Copacabana (clásico, más movido), Botafogo (local y bien conectado). Santa Teresa para el encanto, con taxi nocturno.",
      },
      {
        q: "¿Merece la pena el carnaval?",
        a: "Es LA experiencia — y también multitudes y precios x3. Alternativa: los ensayos de las escuelas de samba (agosto-enero), casi tan intensos y sin la locura.",
      },
    ],
    related: ["buenos-aires", "cancun", "cusco"],
  },
];
