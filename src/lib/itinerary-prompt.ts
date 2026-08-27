// Construcción del prompt de generación de itinerarios.
//
// Vive aparte de itinerary.functions.ts por una razón concreta: el prompt es
// el producto. Es lo que decide si un itinerario es fiable o inventado, y por
// tanto tiene que poder leerse, revisarse y ejecutarse sin arrancar el
// servidor entero ni tocar Supabase. `buildItineraryPrompt` es una función
// pura: mismas entradas, mismo texto.
//
// Quien lo usa:
//   - src/lib/itinerary.functions.ts  → la generación real en producción
//   - scripts/generate-test-itinerary.ts → el banco de pruebas de calidad
//
// Que ambos compartan esta función es lo que hace que una prueba signifique
// algo: si el script y producción construyeran el prompt por separado,
// probaríamos un prompt que nadie usa.

import { isInlandDestination } from "@/lib/itinerary-shared";

export type ItinLang = "es" | "en" | "fr" | "pt";

export const SUPPORTED_ITIN_LANGS: readonly ItinLang[] = ["es", "en", "fr", "pt"];

/** Días máximos que puede cubrir un itinerario. Atado a `max_tokens: 16000`
 *  en la llamada al modelo: por encima de esto la respuesta se trunca. El
 *  formulario (onboarding.tsx) y la validación de createTrip usan el mismo
 *  tope, para que nadie pueda crear un viaje más largo del que se genera. */
export const MAX_ITINERARY_DAYS = 14;

/** Regla de idioma de salida, por idioma soportado. Vive fuera de
 *  `buildItineraryPrompt` porque la edición de itinerarios
 *  (src/lib/itinerary-edit.functions.ts) tiene que aplicar exactamente la
 *  misma regla: su prompt fijaba el español, así que editar un itinerario en
 *  inglés lo reescribía entero en español. */
export const ITIN_LANGUAGE_BLOCKS: Record<ItinLang, string> = {
  es: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in Spanish from Spain (peninsular). Meal naming: "Desayuno", "Comida" (the main midday meal — never "almuerzo" or "lunch") and "Cena". Meal activity titles must start with the meal word ("Comida en …", "Cena en …").`,
  en: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in English. Meal naming: Breakfast, Lunch, Dinner, Snack. Meal activity titles must start with the meal word ("Lunch at …", "Dinner at …").`,
  fr: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in French. Meal naming: "Petit-déjeuner", "Déjeuner", "Dîner". Meal activity titles must start with the meal word ("Déjeuner à …", "Dîner à …").`,
  pt: `All user-visible text (summary, day titles, subtitles, activity titles, descriptions, transport lines) must be written in Portuguese. Meal naming: "Café da manhã", "Almoço", "Jantar". Meal activity titles must start with the meal word ("Almoço em …", "Jantar em …").`,
};

/** Todo lo que el prompt necesita saber, ya extraído de la fila de `trips` y
 *  del perfil del usuario. Nada aquí toca la base de datos. */
export type ItineraryPromptInput = {
  destination: string;
  startDate: string | null;
  endDate: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
  companion: string | null;
  /** Formato "lo-hi" en euros, tal y como lo guarda createTrip. */
  budget: string | null;
  tripStyle: string | null;
  avoid: string | null;
  tripTypes: string[] | null;
  hasAccommodation: boolean | null;
  hotelName: string | null;
  hotelAddress: string | null;
  hotelLat: number | string | null;
  hotelLng: number | string | null;
  pace: string | null;
  transport: string | null;
  firstVisit: boolean | null;
  /** Lista separada por comas, tal y como la guarda createTrip. */
  dietary: string | null;
  age: number | null;
  travelerType: string | null;
  lang: ItinLang;
  /** Resumen en una línea de los viajes anteriores, o "no previous trips". */
  historyLine: string;
};

/** Devuelve el prompt y el número de días que se le ha pedido al modelo — quien
 *  llama lo necesita para avisar si la respuesta no trae esos días. */
export function buildItineraryPrompt(input: ItineraryPromptInput): {
  prompt: string;
  dayCount: number;
} {
  const dayCount = (() => {
    if (!input.startDate || !input.endDate) return 5;
    const a = new Date(input.startDate).getTime();
    const b = new Date(input.endDate).getTime();
    const d = Math.max(1, Math.round((b - a) / 86400000) + 1);
    return Math.min(d, MAX_ITINERARY_DAYS);
  })();

  const budgetBlock = (() => {
    const raw = input.budget;
    const match = raw?.match(/^(\d+)-(\d+)$/);
    if (!match) return "";
    const lo = Number(match[1]);
    const hi = Number(match[2]);
    const mid = (lo + hi) / 2;
    const tier =
      mid < 300
        ? "backpacker (hostels, public transport, street food)"
        : mid < 800
          ? "budget (basic hotels, mixed transport, local restaurants)"
          : mid < 2000
            ? "comfortable (3-star hotels, varied restaurants)"
            : mid < 4000
              ? "premium (4-star hotels, exclusive experiences)"
              : mid < 7000
                ? "luxury (5-star hotels, private transfers, VIP experiences)"
                : "ultra-luxury (suites, exclusive experiences, no spending limit)";
    const dailyLo = Math.round(lo / dayCount);
    const dailyHi = Math.round(hi / dayCount);
    return `- Budget: ${lo}€–${hi}€ total (~${dailyLo}€–${dailyHi}€/day, everything included). Spending style: ${tier}. This is a selection filter, not a caption: the restaurants, the activities and the way they get around must all be things someone on ~${dailyLo}€–${dailyHi}€ a day would actually do. A tight budget means the free viewpoint, the market lunch, the municipal museum on its free afternoon, the day ticket instead of taxis — and paid tickets only where the sight is genuinely worth the money. A high budget means the tasting menu that needs booking, the guided or after-hours access, the boat, the private transfer. Never mix the two registers in one day, and never list something they plainly cannot afford.`;
  })();

  const monthName = (() => {
    if (!input.startDate) return "unspecified";
    const d = new Date(input.startDate);
    const names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    // getUTC*, no getMonth(): `new Date("2026-07-01")` se parsea como
    // medianoche UTC, y leerlo con los getters locales adelanta o atrasa un
    // día según la zona del runtime. En Vercel (UTC) coincidían, así que el
    // fallo estaba latente; con cualquier zona de offset negativo el prompt
    // anunciaría el mes y el día de la semana equivocados.
    return `${names[d.getUTCMonth()]} (month ${d.getUTCMonth() + 1})`;
  })();

  const arrivalTime = input.arrivalTime;
  const departureTime = input.departureTime;

  const arrivalLine = arrivalTime
    ? `Day 1 arrival time: ${arrivalTime}. Do NOT schedule activities before this time on day 1. If arrival is late (after 20:00) plan only check-in and a light dinner nearby; if arrival is after 22:00 plan ONLY check-in / rest.`
    : `Day 1 arrival: unknown — assume a normal morning start.`;
  const departureLine = departureTime
    ? `Last day (day ${dayCount}) departure time: ${departureTime}. Do NOT schedule activities after this time on the last day; leave at least 2-3h before departure for transfer to airport/station. If departure is early morning (before 10:00) plan ONLY transfer; if morning (before 13:00) keep it to breakfast + a single light activity.`
    : `Last day departure: unknown — assume a normal evening end.`;

  const tripTypes = input.tripTypes ?? [];
  const hasAccommodation = !!input.hasAccommodation;
  const hotelName = input.hotelName ?? null;
  const hotelAddress = input.hotelAddress ?? null;
  const hotelLatRaw = input.hotelLat;
  const hotelLngRaw = input.hotelLng;
  const hotelLat = hotelLatRaw != null ? Number(hotelLatRaw) : null;
  const hotelLng = hotelLngRaw != null ? Number(hotelLngRaw) : null;
  const hasHotelCoords =
    hotelLat != null && hotelLng != null && !Number.isNaN(hotelLat) && !Number.isNaN(hotelLng);
  const tripTypesLine =
    tripTypes.length > 0 ? tripTypes.join(", ") : (input.tripStyle ?? "unspecified");

  const accommodationBlock = hasHotelCoords
    ? `- Accommodation (FIXED ANCHOR): "${hotelName ?? "hotel"}"${hotelAddress ? ` (${hotelAddress})` : ""}, coordinates ${hotelLat!.toFixed(5)},${hotelLng!.toFixed(5)}. Every activity must be within ~3 km of it. Each day starts and ends here. No activities in other cities; never recommend other hotels.`
    : hasAccommodation
      ? `- Accommodation: already booked (exact location unknown). Assume a central base. Never recommend other hotels; each day starts and ends at "your accommodation".`
      : `- Accommodation: not booked yet. You may include a brief hotel check-in on day 1.`;

  const isKnownInland = isInlandDestination(input.destination);

  const weekdayName = input.startDate
    ? new Date(input.startDate).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      })
    : null;
  const datesLine =
    input.startDate && input.endDate
      ? `${input.startDate} to ${input.endDate} (day 1 is a ${weekdayName})`
      : "not specified";

  const companion = input.companion ?? null;

  // ── Personalización profunda (columnas opcionales; null si la migración
  // trip_personalization aún no está aplicada) ──
  const pace = input.pace ?? "balanced";
  const firstVisit = input.firstVisit;
  const dietaryRaw = input.dietary ?? null;

  const paceMap: Record<string, string> = {
    relaxed:
      "RELAXED pace: 4-5 activities/day, first activity never before 10:00, long unhurried meals, at least one café/terrace break per day, evenings end early or with a calm plan.",
    balanced:
      "BALANCED pace: 5-6 activities/day, days start around 09:00-09:30, a good mix of sights and downtime.",
    intense:
      "INTENSE pace: 6-7 activities/day, early starts (08:30-09:00), full days — this traveler wants to squeeze every hour; still keep transitions realistic.",
  };
  const paceLine = paceMap[pace] ?? paceMap.balanced;

  // Cómo se mueve el viajero por el destino. Cambia la geometría real del día
  // (cuánto pueden separarse dos paradas y cuánto puede abarcar la jornada
  // entera), qué líneas de transporte puede citar el modelo y qué avisos
  // prácticos necesita (aparcamiento, cuestas, dónde se cogen taxis).
  //
  // Los números NO son decorativos: se inyectan literalmente en la regla de
  // geografía y en la auto-comprobación final del prompt, porque "cerca" sin
  // una cifra es exactamente lo que producía días que zigzagueaban por toda
  // la ciudad. Un "leg" es el salto entre dos paradas consecutivas; el
  // "radio" es la distancia máxima entre las dos paradas más alejadas del día.
  const transportMode = input.transport ?? "mixed";
  type TransportProfile = {
    /** Salto máximo entre dos paradas consecutivas, en km. */
    legKm: number;
    /** Diámetro máximo del día entero, en km (excursiones aparte). */
    dayKm: number;
    /** Por debajo de esto se va andando sí o sí, sea cual sea el modo. */
    walkKm: number;
    rules: string;
  };
  const transportProfiles: Record<string, TransportProfile> = {
    walking: {
      legKm: 1,
      dayKm: 3,
      walkKm: 1,
      rules:
        "ON FOOT — this traveler wants to walk. Build each day as ONE continuous walking line or loop with no backtracking: they should be able to trace the whole day on a map with a single pencil stroke. Only use another mode for a leg that genuinely cannot be walked (a site outside town, a steep climb, a river with no nearby bridge) and say why in that description. Flag stretches that are steep, cobbled, stepped or shadeless, and warn when a day's total walking goes past ~8 km.",
    },
    transit: {
      legKm: 6,
      dayKm: 12,
      walkKm: 1,
      rules:
        "PUBLIC TRANSPORT — this traveler is happy on metro, tram and bus. Two stops may sit further apart as long as ONE direct ride (no more than a single change) connects them in under ~20 min door to door. Name a line number, colour or direction ONLY if you are certain that network and that line exist in this destination and serve those stops — otherwise give the mode and the minutes with no number. Never invent a metro network for a destination that has none.",
    },
    taxi: {
      legKm: 8,
      dayKm: 15,
      walkKm: 0.8,
      rules:
        "TAXI / RIDE-HAILING — this traveler moves between zones by taxi or ride-hailing. Give approximate ride times, never fares. Say where taxis are easy or hard to find, name a real taxi rank or pick-up point when you are sure of one, and flag any zone where hailing on the street does not work and they must book by app or phone.",
    },
    car: {
      legKm: 25,
      dayKm: 90,
      walkKm: 1,
      rules:
        "RENTAL CAR — this traveler has a car, so the day can reach beyond the destination itself: one or two days may centre on a real, named town, park, beach or viewpoint within ~60–90 min drive. Give drive times between stops. Every driving stop must say where to park — a real, named car park when you are certain of one, otherwise the kind of parking to expect and whether it is paid. Warn about restricted-traffic historic centres (ZTL/LEZ-style zones), narrow old-town streets and market days that close streets, where they exist. Once parked, the cluster around that parking spot is walked.",
    },
    mixed: {
      legKm: 4,
      dayKm: 10,
      walkKm: 1.2,
      rules:
        "MIXED — walk inside a zone, use public transport or a short taxi to jump between zones. Aim for at most two motorised hops per day; everything else is on foot. Name a transit line only when you are certain it exists and serves those stops.",
    },
  };
  const transportProfile = transportProfiles[transportMode] ?? transportProfiles.mixed;
  const transportLine = transportProfile.rules;

  // Primera visita vs. repetición cambia QUÉ sitios se eligen, no el tono con
  // el que se describen. Es la diferencia entre un itinerario personalizado y
  // uno genérico con los datos del usuario pegados encima.
  const firstVisitLine =
    firstVisit === false
      ? `REPEAT VISITOR — they have already been to ${input.destination}. They have seen the postcard sights, so DO NOT rebuild the standard first-timer route: the single most famous landmark may appear at most once, and only from a genuinely different angle (a different entrance, a rooftop that looks at it, an hour when it empties out, a wing most people skip) — or not at all. Spend the trip in residential and working neighbourhoods, in the second-tier museums, on a half-day out to a real nearby town, at the markets and bars where the queue is locals. Concretely: a repeat visitor to Rome does not get the Colosseum interior again — they get Testaccio, the Centrale Montemartini, Ostia Antica or an evening in Garbatella.`
      : `FIRST TIME in ${input.destination} — the icons are non-negotiable. Leaving out the two or three sights that define this place, in the name of being original, would be a failure of the itinerary, not a virtue: a first-timer in Rome sees the Colosseum, in Paris the Eiffel Tower, in Granada the Alhambra. Schedule them properly (right hour, right entrance, booked ahead when that matters) and then earn your keep by weaving genuine local moments around them, so the trip is more than a checklist.`;

  // Con quién viaja no es un adjetivo del texto: cambia qué sitios entran,
  // a qué hora, y qué problema práctico hay que resolver en cada parada.
  const companionMap: Record<string, string> = {
    solo: "SOLO — favour places that are comfortable alone: bar counters and market stalls over four-top tables, group-friendly or drop-in activities, neighbourhoods that stay alive after dark. Say plainly when a walk back is better done by taxi. No 'romantic dinner for two'.",
    pareja:
      "COUPLE — favour atmosphere over ticking sights off: viewpoints at the right hour, dinners worth lingering over, one evening that is clearly the highlight of the trip. Two of them, so shared tables and shared plates work.",
    amigos:
      "GROUP OF FRIENDS — favour places that work for several people at once: shared plates, terraces, markets, a night that has somewhere to go afterwards. Avoid anything that needs silence or a timed single-file entry. Book-ahead warnings matter more for groups.",
    familia:
      "FAMILY — favour short legs between stops, real places to sit and to use a toilet, earlier dinners, and stops with something for a child to actually do. Every long or ticketed activity needs a plan B for the day it collapses. Never assume a 3-hour museum will survive contact with a tired child.",
  };
  const companionLine = companion ? (companionMap[companion] ?? null) : null;

  const dietaryDescMap: Record<string, string> = {
    vegetarian: "vegetarian",
    vegan: "vegan",
    glutenFree: "gluten-free (celiac)",
    halal: "halal",
    allergies: "food allergies (details in the AVOID notes)",
  };
  const dietaryLine = dietaryRaw
    ? dietaryRaw
        .split(",")
        .map((d) => dietaryDescMap[d.trim()] ?? d.trim())
        .join(", ")
    : null;

  const age = input.age ?? null;
  const travelerType = input.travelerType ?? null;

  const travelerProfileLine = [
    age ? `${age} years old` : null,
    travelerType ? `self-described as "${travelerType}"` : null,
    companion ? `traveling ${companion}` : "solo traveler",
  ]
    .filter(Boolean)
    .join(", ");

  const beachRule = isKnownInland
    ? `${input.destination} is an inland city — beach, sea or coastal activities (beach time, snorkeling, sea kayaking, swimming in the sea) are strictly forbidden.`
    : `Only include beach or sea activities if ${input.destination} genuinely has a coastline or nearby beach AND the season allows it. A beach is never the only activity of a day; combine it with nearby stops and avoid peak-heat hours (12:00–16:00) in summer.`;

  const languageBlock = ITIN_LANGUAGE_BLOCKS[input.lang];

  const transportExampleMap: Record<ItinLang, string> = {
    es: `"🚶 8 min a pie" | "🚇 Metro L4 dirección X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Tren, 18 min" | "⛴️ Ferry, 20 min"`,
    en: `"🚶 8 min walk" | "🚇 Metro Line 4 towards X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Train, 18 min" | "⛴️ Ferry, 20 min"`,
    fr: `"🚶 8 min à pied" | "🚇 Métro L4 direction X, 12 min" | "🚌 Bus 24, 15 min" | "🚕 Taxi ~10 min" | "🚆 Train, 18 min" | "⛴️ Ferry, 20 min"`,
    pt: `"🚶 8 min a pé" | "🚇 Metrô L4 sentido X, 12 min" | "🚌 Ônibus 24, 15 min" | "🚕 Táxi ~10 min" | "🚆 Trem, 18 min" | "⛴️ Balsa, 20 min"`,
  };
  const transportExamples = transportExampleMap[input.lang];

  const avoidText = input.avoid?.trim() ?? "";
  const styleText = (input.tripStyle ?? "").trim();

  const travelerBlock = [
    `- Profile: ${travelerProfileLine}.`,
    `- ${firstVisitLine}`,
    companionLine ? `- ${companionLine}` : "",
    `- ${paceLine}`,
    `- Getting around: ${transportLine}`,
    `- Interests: ${tripTypesLine}.${styleText ? ` In their own words: "${styleText.slice(0, 400)}".` : ""}`,
    dietaryLine
      ? `- Dietary requirements: ${dietaryLine}. EVERY restaurant and food stop must genuinely work for this — if unsure a venue fits, choose one that clearly does.`
      : "",
    avoidText
      ? `- The traveler explicitly wants to AVOID: ${avoidText.slice(0, 500)}. Never schedule anything matching this.`
      : "",
    `- Previous trips (calibrate their travel experience; never repeat these destinations' style blindly): ${input.historyLine}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const logisticsBlock = [
    `- Destination: ${input.destination}`,
    `- Dates: ${datesLine} — ${dayCount} days, month: ${monthName}`,
    `- ${arrivalLine}`,
    `- ${departureLine}`,
    accommodationBlock,
    budgetBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are planning a ${dayCount}-day trip to ${input.destination} for one specific traveler. The goal: an itinerary so well-fitted, geographically coherent and locally informed that it reads like a knowledgeable friend who actually lives there wrote it — and every single place in it is one they could walk the traveler to tomorrow.

THE TRAVELER
${travelerBlock}

TRIP LOGISTICS
${logisticsBlock}

OUTPUT LANGUAGE
${languageBlock}
Exception: "place" must always hold the venue's real name in its native language, spelled exactly as it appears on its sign or on Google Maps — never translated, never approximated. Real proper nouns (streets, monuments, venues) keep their original names inside the text too.

═══ RULE ZERO — ONLY REAL, VERIFIABLE PLACES ═══
This rule outranks everything else below. A day with 4 stops that all exist beats a day with 7 where 2 do not. If honouring this rule means a thinner day, write the thinner day.

THE TEST — apply it to every single "place" before you write it: if the traveler typed this exact name into Google Maps in ${input.destination} right now, would the pin land on this venue? Anything short of a confident yes means you may not write that name.

Absolutely forbidden:
- Inventing a venue name, or reconstructing one you only half-remember.
- Manufacturing an authentic-sounding name by gluing a generic word to local flavour — "Trattoria da Nonna", "Bar Manolo", "Casa del Mar", "Café Central", "Museo del Vino" — unless that exact establishment genuinely exists in ${input.destination}.
- Moving a real venue from another city, region or country into this one, or reusing a name that is famous somewhere else.
- Giving a town or village neighbourhoods, museums, metro lines, rooftop bars or landmarks it does not have. Calibrate to what ${input.destination} really is: a capital has districts and dozens of museums; a small town has a handful of real landmarks, a church, a market, a promenade and a few well-known places to eat.
- Presenting opening hours, prices, ticket rules or booking requirements as hard fact. Plan around what is typical and phrase it as typical ("suele abrir…", "normally closed on Mondays"), and tell them to confirm before going when it matters.

THE FALLBACK — use it whenever you are not certain, instead of guessing. Name a real, unmistakable anchor (a street, square, promenade, market, neighbourhood, park or beach) plus the kind of place to look for there, and put the anchor's real name in "place". Example: title "Comida en Trastevere", place "Trastevere, Roma", description "una trattoria de las callejuelas al norte de Piazza Santa Maria — busca la carta escrita a mano y sin traducir". This reads as local knowledge, not as a hedge, and it is always better than a plausible name that does not exist.

WHERE THIS BITES HARDEST — restaurants, bars, cafés and small shops are where invented names creep in; hidden gems are the second. Landmarks, museums, markets, parks, squares, beaches and stations are safer, so let them carry the backbone of each day and use the fallback freely for food and nightlife.

BEFORE YOU FINISH — re-read every "place" you wrote and apply the test again. Replace with the fallback any name you cannot vouch for. Nobody will ever know how many names you replaced; they will absolutely notice one restaurant that does not exist.

═══ DESTINATION SCALE — BUILD THE PLACE THAT EXISTS ═══
Before you plan anything, decide honestly what ${input.destination} actually is, and say it to yourself in one line. Then obey the matching tier. Inventing structure a place does not have — districts, museums, metro lines, a nightlife scene — is a RULE ZERO violation, and it is the single most common way an itinerary announces that nobody checked it.

- VILLAGE / SMALL TOWN (roughly under 20,000 people). It has: a handful of real landmarks, a church or castle, one main street or square, a market on a set day, a promenade or river walk, a few places to eat that everyone knows. It does NOT have: named neighbourhoods, a metro or tram, a museum quarter, a rooftop bar scene, or ${dayCount} days' worth of separate sights. Do not stretch it. Organise days by what people really do there — morning at the market, afternoon in the surrounding countryside, coast or vineyards, evening in the square — and fill the remaining days with real, named nearby towns, beaches, natural parks or sites, saying how far each is and how to reach it in the traveler's transport mode. A genuine "we drove 40 min to X" beats a fabricated third district.
- MID-SIZED TOWN / SMALL CITY (roughly 20,000–200,000). It has a real old town, one or two other identifiable areas, a few genuine museums, a bus network, a proper food scene. Use the areas that really exist and name them correctly; do not manufacture a fourth quarter to fill day 4 — go out of town instead.
- CITY (roughly 200,000–1M). Real, named districts with distinct characters, several museums worth a half-day, an actual transport network. Organise by district and name each district correctly.
- METROPOLIS (over ~1M). Organise strictly by district and transport line. Never plan a day that crosses the whole city; the traveler will lose an hour to every mistake. Use the real district names locals use, not tourist-brochure inventions.

If you are not certain which tier ${input.destination} falls into, plan for the smaller one. An itinerary that treats a town as a town reads as local knowledge; one that gives a town a metro line reads as fiction, and everything else in it becomes suspect.

VOICE & TONE
Write for THIS traveler. A young group of friends gets an energetic, casual voice that knows where the night goes; a family with kids gets practical reassurance (short walking legs, early dinners, plan-B for meltdowns); a couple gets atmosphere, views and unhurried evenings; an experienced solo traveler gets confident, no-fluff local detail. Descriptions must be concrete and checkable ("pide el lampredotto", "sube al atardecer, cuando la luz da de lleno en la fachada") — never filler like "disfruta del ambiente", "empápate de la cultura" or "un sitio con mucho encanto".

RULES
1. GEOGRAPHY — This is the rule travelers feel most and forgive least: an hour lost crossing town is an hour stolen from the trip.
   - Every day is anchored on ONE real, correctly named zone (or two that genuinely border each other). Name that zone in the day's title.
   - Hard limits for this traveler's transport mode (${transportMode}): consecutive stops at most ~${transportProfile.legKm} km apart, and the two furthest-apart stops of the day at most ~${transportProfile.dayKm} km apart. Anything under ~${transportProfile.walkKm} km is walked, whatever the mode.
   - Order the stops as a line or a loop that never doubles back: each stop must be on the way to the next. If you find yourself returning to a zone you already left, the day is wrong — reorder it.
   - Meals happen inside the day's zone, at a place that is actually next to the stop before it. A restaurant across town is the classic tell of a fabricated itinerary.
   - One exception, used deliberately at most once or twice per trip: a genuine day trip to a real, named place outside the destination. Say where it is, how far, how long the journey takes in this traveler's mode, and give that whole day to it — never bolt an out-of-town site onto a normal day.
   - Give each day a different zone so the trip covers the destination progressively instead of orbiting the same square.
2. BEACH — ${beachRule}
3. SCHEDULE — Chronological order with realistic durations: museum 1.5–2h, meal 1–1.5h, monument 45–60 min, café 20–30 min; 15–30 min of slack between stops. Work out the weekday of every itinerary day from the dates above and avoid venues on the day they are typically closed (many museums close Mondays; small shops close Sunday). Meal times follow the local dining customs of ${input.destination}, not the traveler's home country. Day density and start time follow the traveler's pace.
4. SEASON — It is ${monthName} in ${input.destination}: plan around the real season. Typical weather (cold/rain → indoor priority; summer heat → outdoor mornings and evenings, indoor at midday), daylight hours (sunset changes what an "evening walk" means), high/low season (a book-ahead warning in peak months), and seasonal closures or specialities — dishes, markets, blooms — that only exist this month.
5. TRANSPORT — Every activity except the first of each day must start its "description" with a transport line: mode + route + minutes from the previous stop, in the traveler's preferred mode wherever that mode makes sense. Format: ${transportExamples}. Only cite a line or route number when you are certain that network and line exist in ${input.destination}; otherwise give mode and minutes only. In a small town assume feet, a local bus or a car.
6. FOOD — Every restaurant must match BOTH the budget tier and the dietary requirements above, and obey RULE ZERO — when unsure, use the fallback. At every meal name 1–2 signature dishes worth ordering: the specific thing a local would tell a friend to get, ideally the real speciality of this region, never the cuisine in general.
7. HIDDEN GEMS — Include 2–3 genuine non-obvious experiences across the trip: places locals love and most tourists miss (an uncrowded viewpoint, a market bar, a workshop, a lesser-known museum wing, a stretch of coast or trail). RULE ZERO applies here with full force — a real, slightly obvious spot beats an invented "secret" one.
8. TIPS — Use the optional "tip" field on 1–2 activities per day. A tip earns its place only if it is something the traveler could NOT have worked out by standing in front of the place. Every tip must be checkable and must name something real: a dish by its actual local name, a specific hour, a specific door or platform, a specific local habit.
   Good: "Pide el bocadillo de calamares en la barra, no en la terraza — la misma tapa cuesta casi el doble sentado fuera." / "La cola de la entrada sur se vacía sobre las 14:00, cuando entran los grupos por la norte." / "Aquí se cena a partir de las 21:30: a las 20:00 tendrás el comedor para ti, pero también la carta corta."
   Banned outright, in any wording: bring comfortable shoes, book in advance, arrive early, try the local food, watch your belongings, the sunset is beautiful, immerse yourself in the atmosphere, don't miss it. If the best you have for a stop is one of those, write no tip at all — an empty "tip" field is better than a filler one, and a trip with four real tips beats one with fourteen platitudes.
   RULE ZERO applies to tips too: never state an exact price, an exact opening time or a booking rule as certain fact. Say what is typical, and where it matters tell them to confirm.
9. LINKS — For "url" build a Google Maps search link: https://www.google.com/maps/search/?api=1&query=VENUE+NAME+CITY (spaces as +). When you used the fallback, link the anchor place instead. Use an official website only when you are completely certain of the exact URL. Never invent URLs; omit "url" when unsure.
10. EVENTS — Include a local festival, fair or public holiday only if it is a well-known recurring event you are confident takes place in ${input.destination} within the trip dates. Never invent events, dates or their URLs.
11. VOLUME — Exactly ${dayCount} days. Activities per day follow the traveler's pace; always fewer on days constrained by arrival or departure.${hasAccommodation ? ' Never use the "hotel" category.' : ""}
12. TRIP ARC — The trip must have a narrative shape, not ${dayCount} interchangeable days. Day 1 ends with an easy "first wow": a viewpoint, square or waterfront that makes the traveler feel they have truly arrived. Middle days alternate intensity (a packed day is followed by a gentler one). The final evening closes with a farewell moment that echoes the traveler's interests — the place they'll describe when someone asks "what was the best part?".

FIELD GUIDE
- summary: 2 sentences, second person, evocative and specific to THIS trip (destination + season + their interests) — it is the first thing they read when the itinerary appears.
- title (day): short and evocative, anchored on the real name of the day's neighborhood or zone (e.g. "Trastevere al atardecer"), never "Day 3". subtitle: a one-sentence recap of the day's arc.
- image_query: 2–3 English words for a photo of the day's area, always including the real place name (e.g. "montmartre paris street").
- time: "HH:MM" 24h. emoji: exactly one emoji. title (activity): 3–6 words. place: the exact real name (or the real anchor, when using the fallback). description: 1–2 lines. tip: only when you have a genuinely useful insider tip.

═══ FINAL AUDIT — RUN THIS BEFORE YOU ANSWER ═══
Go back over what you have written and fix what fails. Fixing means rewriting the itinerary, not adding a disclaimer.
1. REAL: every "place" passes the Google Maps test. Any name you cannot vouch for is replaced by the RULE ZERO fallback. (Look hardest at restaurants, bars and small shops.)
2. SCALE: nothing in this plan gives ${input.destination} a district, a museum, a transport line or a scene it does not have. If a day felt thin, it was filled with a real place nearby, not an invented one here.
3. GEOGRAPHY: for every day, the furthest two stops are within ~${transportProfile.dayKm} km and no consecutive pair exceeds ~${transportProfile.legKm} km; the route never doubles back; each meal sits beside the stop before it. Every activity after the first opens with a transport line in this traveler's mode.
4. PERSONALIZED: this itinerary could not be handed to a different traveler unchanged. Point to the specific stops that exist because of THEIR budget, THEIR pace, who they are travelling with, their dietary needs, and whether this is their first visit. If you cannot point to those stops, you wrote a generic guide with their details pasted on top — go back and rebuild the days around them.
5. USEFUL: every tip names something real and checkable. Every meal names a dish worth ordering. Nothing in the whole document is filler that would be equally true of any city on earth.`;

  return { prompt, dayCount };
}
