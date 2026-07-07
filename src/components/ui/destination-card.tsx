import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  location: string;
  country?: string;
  tag?: string;
  stats?: string;
  themeColor?: string;
  /** Label for the "explore" pill revealed on hover. Caller supplies the translated string. */
  ctaLabel: string;
  onClick?: () => void;
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  (
    {
      className,
      imageUrl,
      location,
      country,
      tag,
      stats,
      themeColor = "210 80% 35%",
      ctaLabel,
      onClick,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        style={{ "--theme-color": themeColor } as React.CSSProperties}
        className={cn("group relative w-full overflow-hidden", className)}
        {...props}
      >
        <button
          type="button"
          onClick={onClick}
          className="relative block w-full overflow-hidden rounded-2xl shadow-lg transition-all duration-500 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          style={{
            boxShadow: `0 4px 24px -8px hsl(var(--theme-color) / 0.45)`,
          }}
        >
          {/* Image with parallax zoom */}
          <div className="aspect-[4/5] overflow-hidden">
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-110"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          </div>

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(var(--theme-color) / 0.92), hsl(var(--theme-color) / 0.55) 35%, transparent 65%)`,
            }}
          />

          {/* Tag chip */}
          {tag && (
            <div className="absolute left-3 top-3">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-900 backdrop-blur-sm">
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

            {/* Explore button - appears on hover */}
            <div className="mt-4 flex items-center justify-between overflow-hidden rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-md ring-1 ring-white/20 transition-all duration-300 group-hover:bg-white/25 group-hover:ring-white/40">
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
