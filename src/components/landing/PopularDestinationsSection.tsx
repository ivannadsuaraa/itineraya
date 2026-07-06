import { useEffect, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { DestinationCard } from "@/components/ui/destination-card";
import { RevealGroup, RevealItem, ScrollReveal } from "@/components/ui/ScrollReveal";

type Destination = {
  name: string;
  country: string;
  image: string;
  tag: string;
  themeColor: string;
};

const W = "?w=900&q=75&auto=format&fit=crop";

const DESTINATIONS: Destination[] = [
  {
    name: "Bali",
    country: "Indonesia",
    image: `https://images.unsplash.com/photo-1537996194471-e657df975ab4${W}`,
    tag: "Paraíso tropical",
    themeColor: "163 55% 25%",
  },
  {
    name: "Tokio",
    country: "Japón",
    image: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf${W}`,
    tag: "Ciudad vibrante",
    themeColor: "345 60% 35%",
  },
  {
    name: "París",
    country: "Francia",
    image: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34${W}`,
    tag: "Romántica",
    themeColor: "280 45% 35%",
  },
  {
    name: "Nueva York",
    country: "EE. UU.",
    image: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9${W}`,
    tag: "Icónica",
    themeColor: "210 70% 28%",
  },
  {
    name: "Tailandia",
    country: "Asia",
    image: `https://images.unsplash.com/photo-1528181304800-259b08848526${W}`,
    tag: "Exótica",
    themeColor: "35 70% 35%",
  },
  {
    name: "Roma",
    country: "Italia",
    image: `https://images.unsplash.com/photo-1552832230-c0197dd311b5${W}`,
    tag: "Historia",
    themeColor: "20 55% 32%",
  },
  {
    name: "Maldivas",
    country: "Océano Índico",
    image: `https://images.unsplash.com/photo-1514282401047-d79a71a590e8${W}`,
    tag: "Playa de ensueño",
    themeColor: "190 65% 28%",
  },
  {
    name: "Islandia",
    country: "Europa",
    image: `https://images.unsplash.com/photo-1531366936337-7c912a4589a7${W}`,
    tag: "Naturaleza",
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
              <h2 className="font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
                {t("popular.title")}
              </h2>
              <p className="mt-2 max-w-xl text-base text-sky-600">{t("popular.subtitle")}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              {t("popular.badge")}
            </span>
          </div>
        </ScrollReveal>

        {/* Cards en cascada: stagger de 80 ms */}
        <RevealGroup stagger={0.08} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <RevealItem key={d.name} className="h-full">
              <DestinationCard
                imageUrl={d.image}
                location={d.name}
                country={d.country}
                tag={d.tag}
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
