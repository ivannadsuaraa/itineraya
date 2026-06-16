import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import logoFull from "@/assets/itineraya-logo.png.asset.json";
import logoMark from "@/assets/itineraya-mark.png.asset.json";

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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const to = linkTo ?? (isLoggedIn ? "/dashboard" : "/");
  const src = variant === "mark" ? logoMark.url : logoFull.url;

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
