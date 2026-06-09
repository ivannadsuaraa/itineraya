import { motion } from "framer-motion";
import {
  Sparkles,
  Map,
  Sun,
  Wallet,
  Globe,
  Share2,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "IA de última generación",
    description: "Nuestro motor de IA analiza miles de datos en tiempo real para crear itinerarios únicos adaptados a ti.",
  },
  {
    icon: Map,
    title: "Mapas interactivos",
    description: "Visualiza tu ruta día a día con mapas integrados, indicaciones y estimaciones de tiempo entre paradas.",
  },
  {
    icon: Sun,
    title: "Planes por estación",
    description: "Obtén recomendaciones según la época del año: festivales, eventos y actividades de temporada.",
  },
  {
    icon: Wallet,
    title: "Presupuesto inteligente",
    description: "La IA equilibra calidad y coste, sugiriendo alternativas para que viajes como quieras sin sorpresas.",
  },
  {
    icon: Globe,
    title: "Destinos ilimitados",
    description: "Desde ciudades emblemáticas hasta rincones escondidos. Funciona en cualquier parte del mundo.",
  },
  {
    icon: Share2,
    title: "Comparte y colabora",
    description: "Comparte tu itinerario con amigos, deja que voten por actividades y planifiquen juntos.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-0 h-[300px] w-[300px] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-[250px] w-[250px] rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-sky-500">
            Características ✨
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-sky-900 sm:text-4xl">
            Todo lo que necesitas para viajar sin preocupaciones
          </h2>
          <p className="mt-4 text-lg text-sky-600">
            Tecnología de punta con la calidez de un agente de viajes personal.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="rounded-2xl border border-sky-100 bg-white/70 p-6 backdrop-blur-sm transition-all hover:border-sky-200 hover:bg-white hover:shadow-lg hover:shadow-sky-900/5 sm:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-sky-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sky-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
