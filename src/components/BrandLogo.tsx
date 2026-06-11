import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: string; icon: string; text: string }> = {
  sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4", text: "text-base" },
  md: { box: "h-9 w-9 rounded-xl", icon: "h-4 w-4", text: "text-lg" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6", text: "text-xl" },
};

export function BrandLogo({ size = "md", className = "" }: { size?: Size; className?: string }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const s = SIZES[size];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const to = isLoggedIn ? "/dashboard" : "/";

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 text-sky-900 transition hover:opacity-80 ${className}`}
    >
      <div className={`flex items-center justify-center bg-[#1E6B9A] shadow-md shadow-[#1E6B9A]/30 ${s.box}`}>
        <Plane className={`-rotate-45 text-white ${s.icon}`} />
      </div>
      <span className={`font-display font-bold tracking-tight ${s.text}`}>Itineraya</span>
    </Link>
  );
}
