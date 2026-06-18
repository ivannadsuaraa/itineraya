import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, X, Sparkles } from "lucide-react";

type Destination = {
  name: string;
  country: string;
  image: string;
  tag: string;
};

const W = "?w=900&q=75&auto=format&fit=crop";

const DESTINATIONS: Destination[] = [
  { name: "Bali", country: "Indonesia", image: `https://images.unsplash.com/photo-1537996194471-e657df975ab4${W}`, tag: "Paraíso tropical" },
  { name: "Tokio", country: "Japón", image: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf${W}`, tag: "Ciudad vibrante" },
  { name: "París", country: "Francia", image: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34${W}`, tag: "Romántica" },
  { name: "Nueva York", country: "EE. UU.", image: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9${W}`, tag: "Icónica" },
  { name: "Tailandia", country: "Asia", image: `https://images.unsplash.com/photo-1528181304800-259b08848526${W}`, tag: "Exótica" },
  { name: "Roma", country: "Italia", image: `https://images.unsplash.com/photo-1552832230-c0197dd311b5${W}`, tag: "Historia" },
  { name: "Maldivas", country: "Océano Índico", image: `https://images.unsplash.com/photo-1514282401047-d79a71a590e8${W}`, tag: "Playa de ensueño" },
  { name: "Islandia", country: "Europa", image: `https://images.unsplash.com/photo-1531366936337-7c912a4589a7${W}`, tag: "Naturaleza" },
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
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setIsLoggedIn(!!session?.user),
    );
    return () => subscription.unsubscribe();
  }, []);

  const handlePick = (d: Destination) => {
    if (isLoggedIn) {
      navigate({ to: "/onboarding", search: { prefill: encodePrefill(`${d.name}, ${d.country}`) } });
    } else {
      setPending(d);
    }
  };

  const goSignup = () => {
    if (!pending) return;
    const returnTo = `${window.location.origin}/onboarding?prefill=${encodeURIComponent(encodePrefill(`${pending.name}, ${pending.country}`))}`;
    navigate({ to: "/auth", search: { mode: "signup", return_to: returnTo } });
  };

  return (
    <section className="relative py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
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
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d, i) => (
            <motion.button
              type="button"
              key={d.name}
              onClick={() => handlePick(d)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.03 * i }}
              className="group relative overflow-hidden rounded-2xl text-left shadow-sm transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  {d.tag}
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-1 text-xs opacity-90">
                    <MapPin className="h-3 w-3" />
                    {d.country}
                  </div>
                  <div className="font-display text-2xl font-bold drop-shadow">{d.name}</div>
                  <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold opacity-0 transition group-hover:opacity-100">
                    {t("popular.cta")} →
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setPending(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPending(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative h-40 w-full overflow-hidden">
              <img src={pending.image} alt={pending.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-5 text-white">
                <div className="text-xs opacity-90">{pending.country}</div>
                <div className="font-display text-2xl font-bold">{pending.name}</div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-bold text-sky-900">
                {t("popular.modalTitle", { dest: pending.name })}
              </h3>
              <p className="mt-2 text-sm text-sky-700">{t("popular.modalDesc")}</p>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={goSignup}
                  className="w-full rounded-full bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition hover:bg-[#15577E]"
                >
                  {t("popular.modalSignup")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!pending) return;
                    const returnTo = `${window.location.origin}/onboarding?prefill=${encodeURIComponent(encodePrefill(`${pending.name}, ${pending.country}`))}`;
                    navigate({ to: "/auth", search: { mode: "login", return_to: returnTo } });
                  }}
                  className="w-full rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
                >
                  {t("popular.modalLogin")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
