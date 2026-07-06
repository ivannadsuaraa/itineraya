// Pasaporte digital del perfil: cada viaje genera un sello circular con el
// nombre del destino en el borde (textPath), fecha en el centro, rotación e
// "intensidad de tinta" deterministas por viaje.

import { useTranslation } from "react-i18next";
import { hashString } from "@/lib/flight";

export type StampTrip = {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
};

const INKS = [
  { stroke: "#1E6B9A", text: "#15577E" }, // azul marca
  { stroke: "#0f766e", text: "#0f766e" }, // teal tinta
  { stroke: "#b45309", text: "#92400e" }, // ámbar sellado
  { stroke: "#9f1239", text: "#9f1239" }, // granate consular
] as const;

function stampDate(trip: StampTrip, lang: string): string {
  const d = trip.end_date ?? trip.start_date;
  if (!d) return "— — —";
  return new Date(`${d}T00:00:00`)
    .toLocaleDateString(lang.startsWith("en") ? "en-GB" : lang, {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    })
    .toUpperCase()
    .replace(/\./g, "");
}

function Stamp({ trip, lang }: { trip: StampTrip; lang: string }) {
  const h = hashString(trip.id);
  const ink = INKS[h % INKS.length];
  const rotate = ((h % 25) - 12) * 1.1; // ±13°
  const city = trip.destination.split(",")[0].trim().toUpperCase();
  const arcId = `stamp-arc-${trip.id}`;
  // El nombre repetido llena el aro en destinos cortos.
  const ringText = city.length < 9 ? `${city} · ITINERAYA · ${city} ·` : `${city} · ITINERAYA ·`;

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-24 w-24 sm:h-28 sm:w-28"
      style={{ transform: `rotate(${rotate}deg)`, opacity: 0.82 + (h % 10) / 60 }}
      role="img"
      aria-label={city}
    >
      <defs>
        <path id={arcId} d="M 60 14 A 46 46 0 1 1 59.9 14" fill="none" />
      </defs>
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke={ink.stroke}
        strokeWidth="2.5"
        strokeOpacity="0.85"
      />
      <circle
        cx="60"
        cy="60"
        r="47"
        fill="none"
        stroke={ink.stroke}
        strokeWidth="1"
        strokeOpacity="0.55"
        strokeDasharray="3 4"
      />
      <text
        fontFamily="ui-monospace, Menlo, monospace"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="1.5"
        fill={ink.text}
        fillOpacity="0.9"
      >
        <textPath href={`#${arcId}`} startOffset="0">
          {ringText}
        </textPath>
      </text>
      {/* Avión + fecha en el centro */}
      <g
        transform="translate(60, 50)"
        stroke={ink.stroke}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          transform="translate(-9,-9) scale(0.75)"
          d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
        />
      </g>
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fontFamily="ui-monospace, Menlo, monospace"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1"
        fill={ink.text}
      >
        {stampDate(trip, lang)}
      </text>
      <line
        x1="34"
        y1="86"
        x2="86"
        y2="86"
        stroke={ink.stroke}
        strokeWidth="1"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

export function PassportStamps({ trips }: { trips: StampTrip[] }) {
  const { t, i18n } = useTranslation();

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold text-slate-900">
          {t("airport.passport.title")}
        </p>
        <span className="font-flight text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
          {t("airport.passport.eyebrow")}
        </span>
      </div>
      {trips.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("airport.passport.empty")}</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-1 sm:gap-2">
          {trips.map((trip) => (
            <Stamp key={trip.id} trip={trip} lang={i18n.language} />
          ))}
        </div>
      )}
    </section>
  );
}
