import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const Input = z.object({
  destination: z.string().min(1),
});

export type NewsArticle = {
  title: string;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheRow = { destination: string; articles: NewsArticle[]; fetched_at: string };

async function readCache(key: string): Promise<CacheRow | null> {
  const { data } = await supabaseAdmin
    .from("destination_news_cache" as never)
    .select("destination,articles,fetched_at")
    .eq("destination", key)
    .maybeSingle();
  return (data as CacheRow | null) ?? null;
}

async function writeCache(key: string, articles: NewsArticle[]) {
  await supabaseAdmin
    .from("destination_news_cache" as never)
    .upsert({ destination: key, articles, fetched_at: new Date().toISOString() } as never);
}

async function fetchFromNewsApi(destination: string): Promise<NewsArticle[] | null> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return null;

  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const q = `"${destination}" AND (travel OR tourism OR turismo OR culture)`;
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${from}&sortBy=publishedAt&language=es&pageSize=5`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[news] ${res.status} for "${destination}"`);
      return null;
    }
    const json = (await res.json()) as {
      articles?: Array<{
        title?: string;
        url?: string;
        urlToImage?: string;
        publishedAt?: string;
        source?: { name?: string };
      }>;
    };
    return (json.articles ?? [])
      .filter((a) => a.title && a.url)
      .slice(0, 3)
      .map((a) => ({
        title: a.title!,
        url: a.url!,
        source: a.source?.name ?? "",
        imageUrl: a.urlToImage ?? null,
        publishedAt: a.publishedAt ?? new Date().toISOString(),
      }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Noticias recientes (últimos 30 días) de viaje/turismo/cultura para un
 * destino, cacheadas 24h en Supabase. Devuelve [] ante cualquier fallo — la
 * sección "Antes de viajar" simplemente no se muestra en ese caso.
 */
export const getDestinationNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<NewsArticle[]> => {
    const key = data.destination.split(",")[0].trim().toLowerCase();
    if (!key) return [];

    try {
      const cached = await readCache(key);
      if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
        return cached.articles ?? [];
      }

      const fresh = await fetchFromNewsApi(key);
      if (fresh === null) return cached?.articles ?? [];

      void writeCache(key, fresh);
      return fresh;
    } catch (err) {
      console.warn("[news] fallo inesperado", err instanceof Error ? err.message : err);
      return [];
    }
  });
