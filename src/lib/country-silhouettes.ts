// Siluetas SVG estilizadas (low-poly, viewBox 0 0 100 100) de los 20 países
// más comunes entre los destinos de Itineraya, más una silueta genérica de
// isla para el resto. No pretenden precisión cartográfica: son arte de póster,
// reconocibles de un vistazo.

export type CountryKey =
  | "spain"
  | "france"
  | "italy"
  | "japan"
  | "usa"
  | "uk"
  | "portugal"
  | "greece"
  | "thailand"
  | "indonesia"
  | "mexico"
  | "morocco"
  | "netherlands"
  | "germany"
  | "iceland"
  | "croatia"
  | "turkey"
  | "egypt"
  | "argentina"
  | "ireland"
  | "generic";

// Cada silueta puede tener varios sub-paths (islas, penínsulas separadas).
export const COUNTRY_PATHS: Record<CountryKey, string[]> = {
  spain: [
    "M10 24 L32 12 L58 8 L80 14 L90 30 L76 50 L82 68 L64 84 L38 88 L26 76 L30 62 L18 58 L14 42 Z",
    // Baleares
    "M84 56 L92 54 L94 60 L86 62 Z",
  ],
  france: [
    "M22 16 L50 6 L66 12 L78 22 L88 42 L78 58 L62 86 L40 82 L30 68 L10 52 L16 34 Z",
    // Córcega
    "M88 68 L94 64 L96 80 L90 82 Z",
  ],
  italy: [
    "M25 8 L48 3 L70 8 L64 18 L52 22 L56 32 L64 44 L76 54 L88 60 L94 58 L97 66 L86 72 L74 68 L63 72 L58 84 L46 90 L40 82 L50 72 L52 60 L44 48 L34 34 L28 20 Z",
    // Sicilia
    "M38 94 L54 91 L48 99 L36 98 Z",
    // Cerdeña
    "M12 58 L20 56 L22 74 L13 75 Z",
  ],
  japan: [
    // Hokkaido
    "M70 6 L84 4 L90 14 L79 21 L68 15 Z",
    // Honshu
    "M76 25 L83 33 L74 46 L61 56 L47 62 L35 67 L26 75 L32 60 L46 52 L59 42 L68 32 Z",
    // Shikoku
    "M37 72 L50 68 L46 77 L35 78 Z",
    // Kyushu
    "M21 78 L31 74 L30 87 L19 88 Z",
  ],
  usa: [
    "M6 30 L28 25 L58 27 L84 22 L90 15 L94 24 L85 37 L89 48 L78 56 L80 66 L84 79 L76 70 L62 62 L49 70 L47 83 L38 66 L22 60 L8 52 Z",
  ],
  uk: [
    // Gran Bretaña
    "M46 4 L58 8 L52 18 L61 26 L54 34 L64 44 L60 56 L70 66 L64 80 L48 87 L36 80 L45 68 L37 60 L45 48 L35 40 L43 28 L35 18 L43 12 Z",
    // Irlanda del Norte insinuada con la isla vecina
    "M14 44 L27 40 L31 52 L22 63 L10 57 Z",
  ],
  portugal: ["M32 6 L54 9 L48 26 L56 40 L50 58 L58 72 L52 92 L30 94 L35 74 L28 56 L34 38 L26 22 Z"],
  greece: [
    "M28 5 L58 8 L74 16 L60 24 L50 34 L62 40 L54 50 L44 48 L40 58 L52 62 L48 72 L36 74 L30 64 L38 54 L30 44 L36 30 L24 20 Z",
    // Creta
    "M38 88 L66 85 L71 92 L42 95 Z",
    // Islas
    "M72 56 L78 54 L79 61 L73 62 Z",
    "M82 44 L88 42 L89 49 L83 50 Z",
  ],
  thailand: [
    "M44 6 L60 10 L70 22 L64 36 L54 33 L50 45 L58 58 L52 63 L46 79 L52 94 L44 97 L39 80 L44 64 L37 52 L42 36 L33 24 L38 11 Z",
  ],
  indonesia: [
    // Sumatra
    "M4 28 L17 19 L34 43 L23 51 Z",
    // Java
    "M27 58 L63 62 L61 70 L29 66 Z",
    // Bali
    "M67 64 L74 63 L73 70 L66 69 Z",
    // Borneo
    "M43 24 L64 20 L70 40 L51 48 Z",
    // Sulawesi
    "M75 26 L82 23 L79 45 L72 41 Z",
  ],
  mexico: [
    "M6 18 L30 20 L50 34 L68 44 L88 47 L90 56 L74 58 L78 61 L85 67 L70 73 L60 64 L54 58 L34 45 L18 36 L4 27 Z",
    // Baja California
    "M4 22 L11 26 L27 52 L20 55 L6 31 Z",
  ],
  morocco: ["M20 9 L56 5 L71 15 L64 30 L52 38 L46 52 L34 64 L19 88 L6 86 L14 60 L11 40 Z"],
  netherlands: ["M34 14 L56 6 L70 18 L61 34 L69 52 L58 74 L38 82 L30 64 L42 52 L31 38 Z"],
  germany: [
    "M30 8 L50 4 L62 12 L58 26 L70 36 L64 52 L71 68 L56 78 L60 90 L40 93 L28 80 L34 66 L24 52 L32 38 L22 24 Z",
  ],
  iceland: [
    "M10 40 L22 28 L36 33 L46 22 L62 27 L78 20 L90 32 L84 48 L89 58 L72 68 L52 73 L30 66 L14 56 Z",
  ],
  croatia: [
    "M20 10 L48 6 L60 14 L48 22 L36 20 L34 32 L44 42 L56 54 L70 66 L84 80 L78 88 L62 76 L46 62 L34 48 L26 32 Z",
  ],
  turkey: ["M8 40 L20 28 L40 24 L64 22 L84 28 L94 40 L88 52 L70 58 L48 60 L28 56 L18 62 L6 54 Z"],
  egypt: ["M12 14 L78 10 L83 20 L77 30 L87 22 L92 34 L82 43 L86 78 L60 86 L14 82 Z"],
  argentina: [
    "M30 4 L54 8 L66 18 L60 32 L68 42 L58 54 L52 68 L46 82 L41 97 L34 97 L36 82 L30 66 L36 50 L26 36 L34 20 Z",
  ],
  ireland: [
    "M30 12 L54 8 L66 20 L60 36 L68 48 L58 66 L64 78 L44 88 L24 80 L14 62 L22 48 L12 34 L26 28 Z",
  ],
  generic: [
    // Isla abstracta con bahías — para destinos sin silueta propia
    "M18 34 L34 18 L54 12 L74 18 L86 32 L82 46 L90 58 L78 72 L60 80 L58 88 L46 86 L46 78 L30 74 L20 60 L26 48 L14 44 Z",
    "M70 86 L80 83 L82 91 L72 93 Z",
  ],
};

// Palabras clave (país en es/en/fr/pt + ciudades principales) → país.
// Se evalúa sobre el string completo de destino en minúsculas.
const COUNTRY_KEYWORDS: Array<[RegExp, CountryKey]> = [
  [
    /españa|spain|espagne|madrid|barcelona|sevilla|granada|valencia|bilbao|málaga|malaga|ibiza|mallorca|menorca|canarias|tenerife|san sebasti/i,
    "spain",
  ],
  [
    /francia|france|parís|paris|lyon|marsella|marseille|niza|nice|burdeos|bordeaux|estrasburgo/i,
    "france",
  ],
  [
    /italia|italy|italie|roma|rome|venecia|venice|florencia|florence|milán|milan|nápoles|naples|sicilia|toscana|amalfi/i,
    "italy",
  ],
  [/japón|japan|japon|tokio|tokyo|kioto|kyoto|osaka|nara|hiroshima|okinawa/i, "japan"],
  [
    /estados unidos|united states|usa|eeuu|nueva york|new york|los ángeles|los angeles|miami|chicago|san francisco|las vegas|hawái|hawaii|boston/i,
    "usa",
  ],
  [
    /reino unido|united kingdom|inglaterra|england|escocia|scotland|londres|london|edimburgo|edinburgh|manchester|liverpool|gales/i,
    "uk",
  ],
  [/portugal|lisboa|lisbon|oporto|porto|algarve|madeira|azores/i, "portugal"],
  [/grecia|greece|atenas|athens|santorini|mykonos|creta|crete|rodas|corfú/i, "greece"],
  [/tailandia|thailand|bangkok|phuket|chiang mai|krabi|koh samui/i, "thailand"],
  [/indonesia|bali|yakarta|jakarta|ubud|lombok|java/i, "indonesia"],
  [
    /méxico|mexico|cancún|cancun|tulum|ciudad de méxico|cdmx|oaxaca|guadalajara|playa del carmen|riviera maya/i,
    "mexico",
  ],
  [
    /marruecos|morocco|maroc|marrakech|marrakesh|fez|fès|casablanca|chefchaouen|tánger|tangier/i,
    "morocco",
  ],
  [
    /países bajos|paises bajos|netherlands|holanda|holland|ámsterdam|amsterdam|róterdam|rotterdam|la haya/i,
    "netherlands",
  ],
  [
    /alemania|germany|allemagne|berlín|berlin|múnich|munich|hamburgo|hamburg|colonia|cologne|frankfurt|fráncfort/i,
    "germany",
  ],
  [/islandia|iceland|reikiavik|reykjavik|reykjavík/i, "iceland"],
  [/croacia|croatia|dubrovnik|split|zagreb|hvar|dalmacia/i, "croatia"],
  [/turquía|turquia|turkey|estambul|istanbul|capadocia|cappadocia|ankara|esmirna|izmir/i, "turkey"],
  [/egipto|egypt|el cairo|cairo|luxor|asuán|aswan|hurghada|sharm/i, "egypt"],
  [/argentina|buenos aires|bariloche|mendoza|patagonia|ushuaia|córdoba, arg/i, "argentina"],
  [/irlanda|ireland|dublín|dublin|galway|cork/i, "ireland"],
];

export function countryForDestination(destination: string): CountryKey {
  const d = destination.toLowerCase();
  for (const [re, key] of COUNTRY_KEYWORDS) {
    if (re.test(d)) return key;
  }
  return "generic";
}
