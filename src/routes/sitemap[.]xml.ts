import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SEO_DESTINATIONS } from "@/lib/seo-destinations";

// Sitemap dinámico (GROWTH_REPORT §10.2): estáticas + landings de destino +
// todos los viajes públicos. Sustituye al antiguo public/sitemap.xml estático.

const SITE = "https://itineraya.com";

type StaticEntry = { path: string; changefreq: string; priority: string };

const STATIC_ENTRIES: StaticEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/explore", changefreq: "daily", priority: "0.8" },
  { path: "/viajes", changefreq: "weekly", priority: "0.8" },
  { path: "/terms", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
  { path: "/contact", changefreq: "monthly", priority: "0.3" },
];

function urlTag(loc: string, opts: { changefreq?: string; priority?: string; lastmod?: string }) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : null,
    opts.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : null,
    opts.priority ? `    <priority>${opts.priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchPublicTripUrls(): Promise<string[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from("trips")
      .select("share_slug, published_at, updated_at")
      .eq("is_public", true)
      .not("share_slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(5000);
    if (error || !data) return [];
    return data
      .filter((r) => r.share_slug)
      .map((r) =>
        urlTag(`${SITE}/trip/${r.share_slug}`, {
          changefreq: "monthly",
          priority: "0.6",
          lastmod: (r.published_at ?? r.updated_at ?? "").slice(0, 10) || undefined,
        }),
      );
  } catch {
    // El sitemap nunca debe romperse por la BD: emitimos solo las estáticas.
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticUrls = STATIC_ENTRIES.map((e) =>
          urlTag(`${SITE}${e.path}`, { changefreq: e.changefreq, priority: e.priority }),
        );
        const destinationUrls = SEO_DESTINATIONS.map((d) =>
          urlTag(`${SITE}/viajes/${d.slug}`, { changefreq: "weekly", priority: "0.8" }),
        );
        const tripUrls = await fetchPublicTripUrls();

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...staticUrls,
          ...destinationUrls,
          ...tripUrls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            // 1h en CDN: los viajes nuevos aparecen sin recalcular en cada hit.
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
