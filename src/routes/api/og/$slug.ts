import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// og:image dinámico y branded para itinerarios públicos (/trip/$slug).
// Un enlace compartido en WhatsApp/Twitter/iMessage muestra la foto del
// destino CON la marca, el nº de días y el gancho — en vez de una foto
// anónima de Unsplash. satori (JSX→SVG) + resvg (SVG→PNG), sin Chromium.
//
// Filosofía de fallos: este endpoint NUNCA devuelve un error a un scraper.
// Cualquier problema (fuente, imagen, BD) degrada a un 302 a la imagen del
// héroe o al og-image.jpg estático.

const SITE = "https://itineraya.com";

// ── Fuente: Inter 400/700 en TTF. Se resuelve una vez por instancia
// (module scope) vía el CSS de Google Fonts con un UA legacy, que devuelve
// URLs TTF — satori no acepta woff2. ──
type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };
let fontsPromise: Promise<FontSpec[]> | null = null;

async function fetchTtf(cssUrl: string): Promise<ArrayBuffer> {
  const css = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:10.0) Gecko/20100101 Firefox/10.0" },
  }).then((r) => r.text());
  // El UA legacy hace que Google sirva TTF o WOFF (ambos válidos para
  // satori; woff2 no lo es, y es lo que devuelve con UAs modernos).
  const m = css.match(/src:\s*url\(([^)]+\.(?:ttf|woff))\)/);
  if (!m) throw new Error("No TTF/WOFF url in Google Fonts CSS");
  const res = await fetch(m[1]);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

function loadFonts(): Promise<FontSpec[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchTtf("https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap"),
      fetchTtf("https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap"),
    ]).then(([regular, bold]) => [
      { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
    ]);
    // Si falla, permitir reintento en la siguiente petición en vez de cachear el error.
    fontsPromise.catch(() => {
      fontsPromise = null;
    });
  }
  return fontsPromise;
}

async function fetchImageDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 6 * 1024 * 1024) return null; // no incrustar monstruos
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return null;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

// Árbol satori en notación objeto (fichero .ts, sin JSX).
function h(
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra?: Record<string, unknown>,
) {
  return { type, props: { style, ...(extra ?? {}), children } };
}

function buildTree(opts: {
  destination: string;
  nDays: number | null;
  heroDataUri: string | null;
}) {
  const { destination, nDays, heroDataUri } = opts;
  const title = destination.length > 26 ? `${destination.slice(0, 25)}…` : destination;
  return h(
    "div",
    {
      display: "flex",
      width: "100%",
      height: "100%",
      position: "relative",
      fontFamily: "Inter",
      backgroundColor: "#0c1a2e",
    },
    [
      heroDataUri
        ? h(
            "img",
            { position: "absolute", width: "1200px", height: "630px", objectFit: "cover" },
            undefined,
            { src: heroDataUri },
          )
        : h("div", {
            position: "absolute",
            width: "1200px",
            height: "630px",
            background: "linear-gradient(135deg, #0c1a2e 0%, #0c4a6e 60%, #1E6B9A 100%)",
          }),
      // Velo para legibilidad del texto
      h("div", {
        position: "absolute",
        width: "1200px",
        height: "630px",
        background:
          "linear-gradient(to top, rgba(4,16,32,0.94) 0%, rgba(4,16,32,0.45) 45%, rgba(4,16,32,0.18) 100%)",
      }),
      // Contenido
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          width: "100%",
          height: "100%",
          padding: "56px 64px",
        },
        [
          // Chip de marca
          h(
            "div",
            {
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.14)",
              borderRadius: "9999px",
              padding: "10px 22px",
              marginBottom: "22px",
              alignSelf: "flex-start",
            },
            [
              h("div", {
                width: "12px",
                height: "12px",
                borderRadius: "9999px",
                backgroundColor: "#38bdf8",
                marginRight: "12px",
              }),
              h(
                "span",
                { color: "#ffffff", fontSize: "26px", fontWeight: 700, letterSpacing: "2px" },
                "ITINERAYA",
              ),
            ],
          ),
          // Destino
          h(
            "span",
            {
              color: "#ffffff",
              fontSize: title.length > 16 ? "76px" : "96px",
              fontWeight: 700,
              lineHeight: 1.05,
              marginBottom: "14px",
            },
            title,
          ),
          // Sublínea
          h(
            "span",
            {
              color: "rgba(255,255,255,0.88)",
              fontSize: "32px",
              fontWeight: 400,
              marginBottom: "26px",
            },
            nDays
              ? `Itinerario de ${nDays} ${nDays === 1 ? "día" : "días"}, hora a hora, con mapa`
              : "Itinerario día a día, hora a hora, con mapa",
          ),
          // Fila inferior: CTA + dominio
          h(
            "div",
            {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            },
            [
              h(
                "div",
                {
                  display: "flex",
                  backgroundColor: "#38bdf8",
                  borderRadius: "9999px",
                  padding: "12px 26px",
                },
                h(
                  "span",
                  { color: "#0c1a2e", fontSize: "26px", fontWeight: 700 },
                  "Copia y personaliza este viaje gratis",
                ),
              ),
              h(
                "span",
                { color: "rgba(255,255,255,0.65)", fontSize: "26px", fontWeight: 400 },
                "itineraya.com",
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

export const Route = createFileRoute("/api/og/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug;
        const fallback = (hero?: string | null) =>
          Response.redirect(hero || `${SITE}/og-image.jpg`, 302);

        let hero: string | null = null;
        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!url || !key) return fallback();
          const client = createClient<Database>(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: row } = await client
            .from("trips")
            .select("destination, hero_image_url, start_date, end_date")
            .eq("share_slug" as never, slug)
            .eq("is_public" as never, true)
            .maybeSingle();
          if (!row) return fallback();
          const r = row as {
            destination: string;
            hero_image_url: string | null;
            start_date: string | null;
            end_date: string | null;
          };
          hero = r.hero_image_url;

          // Import dinámico: satori/resvg solo se cargan cuando se pide un OG,
          // y quedan fuera del bundle de cliente y de las rutas normales.
          const [{ default: satori }, { Resvg }, fonts, heroDataUri] = await Promise.all([
            import("satori"),
            import("@resvg/resvg-js"),
            loadFonts(),
            r.hero_image_url ? fetchImageDataUri(r.hero_image_url) : Promise.resolve(null),
          ]);

          const svg = await satori(
            buildTree({
              destination: r.destination,
              nDays: daysBetween(r.start_date, r.end_date),
              heroDataUri,
            }) as never,
            { width: 1200, height: 630, fonts },
          );
          const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

          return new Response(new Uint8Array(png), {
            headers: {
              "Content-Type": "image/png",
              // 24h en CDN: los scrapers cachean agresivo igualmente, y el
              // contenido (destino, días) apenas cambia.
              "Cache-Control":
                "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            },
          });
        } catch (e) {
          console.error("[og] render failed, falling back", e);
          return fallback(hero);
        }
      },
    },
  },
});
