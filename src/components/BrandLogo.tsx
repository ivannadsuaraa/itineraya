import { Link } from "@tanstack/react-router";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "full" | "mark";

const HEIGHTS: Record<Size, string> = {
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
  xl: "h-16",
};

export function BrandLogo({
  size = "md",
  variant = "full",
  className = "",
  linkTo,
}: {
  size?: Size;
  variant?: Variant;
  className?: string;
  linkTo?: string;
}) {
  const { user } = useAuthSession();

  const to = linkTo ?? (user ? "/dashboard" : "/");
  const src = variant === "mark" ? "/itineraya-mark.png" : "/itineraya-logo.png";

  return (
    <Link to={to} className={`inline-flex items-center transition hover:opacity-80 ${className}`}>
      <img
        src={src}
        alt="Itineraya"
        className={`${HEIGHTS[size]} w-auto select-none`}
        draggable={false}
      />
    </Link>
  );
}
