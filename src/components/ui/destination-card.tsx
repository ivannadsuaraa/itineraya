import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  location: string;
  country?: string;
  tag?: string;
  stats?: string;
  /** Label for the "explore" pill revealed on hover. Caller supplies the translated string. */
  ctaLabel: string;
  onClick?: () => void;
  /** Bento mode: la tarjeta llena la altura de su celda en vez de bloquear un
   *  aspect-ratio fijo — permite mosaicos de tamaños variados. */
  fill?: boolean;
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  (
    { className, imageUrl, location, country, tag, stats, ctaLabel, onClick, fill = false, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn("group relative w-full overflow-hidden", fill && "h-full", className)}
        {...props}
      >
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "relative block w-full overflow-hidden rounded-3xl shadow-sm transition-all duration-500 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]",
            fill && "h-full",
          )}
        >
          {/* Image with parallax zoom */}
          <div className={cn("overflow-hidden", fill ? "h-full min-h-[160px]" : "aspect-[4/5]")}>
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-110"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          </div>

          {/* Overlay oscuro neutro — un único tratamiento en toda la app, sin
              tinte de color por destino */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Tag chip */}
          {tag && (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-900">
                {tag}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            {country && (
              <div className="mb-1 flex items-center gap-1 text-xs text-white/75 font-medium">
                <span>{country}</span>
              </div>
            )}
            <h3 className="font-display text-2xl font-bold tracking-tight drop-shadow-sm">
              {location}
            </h3>
            {stats && <p className="mt-0.5 text-sm text-white/80 font-medium">{stats}</p>}

            {/* Explore button - appears on hover: pill sólida, sin cristal */}
            <div className="mt-4 flex items-center justify-between overflow-hidden rounded-full bg-black px-4 py-2.5 transition-all duration-300 group-hover:bg-slate-800">
              <span className="text-sm font-semibold tracking-wide">{ctaLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>
    );
  },
);
DestinationCard.displayName = "DestinationCard";
export { DestinationCard };
