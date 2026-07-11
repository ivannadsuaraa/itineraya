import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { DestinationCard } from "@/components/ui/destination-card";
import { RevealGroup, RevealItem, ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

// Mosaico Bento asimétrico: Bali manda como pieza grande, y las demás respiran
// en tamaños variados (ancho, alto, 1×1). grid-flow-dense rellena huecos.
const BENTO_SPANS = [
  "col-span-2 row-span-2", // Bali — feature
  "", // Tokio
  "", // París
  "col-span-2", // Nueva York — ancho
  "row-span-2", // Tailandia — alto
  "", // Roma
  "", // Maldivas
  "col-span-2", // Islandia — ancho
];

type Destination = {
  name: string;
  country: string;
  image: string;
  /** Key into popular.tags.* — the actual tag label is resolved via t() at render time. */
  tagKey: string;
  themeColor: string;
};

const W = "?w=900&q=75&auto=format&fit=crop";

const DESTINATIONS: Destination[] = [
  {
    name: "Bali",
    country: "Indonesia",
    image: `https://images.unsplash.com/photo-1537996194471-e657df975ab4${W}`,
    tagKey: "bali",
    themeColor: "163 55% 25%",
  },
  {
    name: "Tokio",
    country: "Japón",
    image: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf${W}`,
    tagKey: "tokio",
    themeColor: "345 60% 35%",
  },
  {
    name: "París",
    country: "Francia",
    image: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34${W}`,
    tagKey: "paris",
    themeColor: "280 45% 35%",
  },
  {
    name: "Nueva York",
    country: "EE. UU.",
    image: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9${W}`,
    tagKey: "nuevaYork",
    themeColor: "210 70% 28%",
  },
  {
    name: "Tailandia",
    country: "Asia",
    image: `https://images.unsplash.com/photo-1528181304800-259b08848526${W}`,
    tagKey: "tailandia",
    themeColor: "35 70% 35%",
  },
  {
    name: "Roma",
    country: "Italia",
    image: `https://images.unsplash.com/photo-1552832230-c0197dd311b5${W}`,
    tagKey: "roma",
    themeColor: "20 55% 32%",
  },
  {
    name: "Maldivas",
    country: "Océano Índico",
    image: `https://images.unsplash.com/photo-1514282401047-d79a71a590e8${W}`,
    tagKey: "maldivas",
    themeColor: "190 65% 28%",
  },
  {
    name: "Islandia",
    country: "Europa",
    image: `https://images.unsplash.com/photo-1531366936337-7c912a4589a7${W}`,
    tagKey: "islandia",
    themeColor: "220 50% 30%",
  },
];

function encodePrefill(destination: string) {
  const payload = { destination };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function PopularDestinationsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [pending, setPending] = useState<Destination | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const handlePick = (d: Destination) => {
    if (isLoggedIn) {
      navigate({
        to: "/onboarding",
        search: { prefill: encodePrefill(`${d.name}, ${d.country}`) },
      });
    } else {
      setPending(d);
    }
  };

  const onAuthed = () => {
    if (!pending) return;
    navigate({
      to: "/onboarding",
      search: { prefill: encodePrefill(`${pending.name}, ${pending.country}`) },
    });
    setPending(null);
  };

  return (
    <section className="relative bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera: entra desde la izquierda — gesto propio de esta sección */}
        <ScrollReveal direction="left" amount={0.4}>
          <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#0c1a2e] sm:text-4xl">
                {t("popular.title")}
              </h2>
              <p className="mt-2 max-w-xl text-base text-slate-500">{t("popular.subtitle")}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#38bdf8]/10 px-3 py-1.5 text-xs font-semibold text-[#0ea5e9] ring-1 ring-[#38bdf8]/20">
              <Sparkles className="h-3.5 w-3.5" />
              {t("popular.badge")}
            </span>
          </div>
        </ScrollReveal>

        {/* Mosaico Bento: tamaños variados, stagger de 80 ms */}
        <RevealGroup
          stagger={0.08}
          className="grid auto-rows-[150px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[180px] sm:gap-4 lg:auto-rows-[200px] lg:grid-cols-4"
        >
          {DESTINATIONS.map((d, i) => (
            <RevealItem key={d.name} className={cn(BENTO_SPANS[i], "h-full")}>
              <DestinationCard
                fill
                imageUrl={d.image}
                location={d.name}
                country={d.country}
                tag={t(`popular.tags.${d.tagKey}`)}
                ctaLabel={t("popular.cta")}
                themeColor={d.themeColor}
                onClick={() => handlePick(d)}
                className="h-full"
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <AuthModal
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending ? t("popular.modalTitle", { dest: pending.name }) : undefined}
        description={pending ? t("popular.modalDesc") : undefined}
        returnTo={
          pending
            ? `/onboarding?prefill=${encodePrefill(`${pending.name}, ${pending.country}`)}`
            : undefined
        }
        onAuthed={onAuthed}
      />
    </section>
  );
}
