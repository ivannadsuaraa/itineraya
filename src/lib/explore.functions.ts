import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { getRequest } from "@tanstack/react-start/server";
import { createHash } from "node:crypto";
import type { PublicTrip, PublicTripDay } from "@/lib/share.functions";

const PUBLISH_TOGGLE_DAILY_LIMIT = 30;
// El feed público es el único endpoint con coste de base de datos que no
// estaba medido: sin autenticación, `limit` hasta 100 y un `ilike '%…%'` sobre
// `destination` que no usa índice. Un tope alto no molesta a nadie real y
// acota el peor caso.
const PUBLIC_FEED_IP_DAILY_LIMIT = 300;

// Copias locales, como en demo.functions.ts: exportarlas desde
// share.functions.ts arrastraba `node:crypto` al bundle del navegador (el
// plugin de server functions solo puede podar lo que no forma parte de la
// superficie pública del módulo), y el build fallaba.
//
// Nunca se guarda la IP en claro: solo un hash truncado como clave de cuota.
function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

// La PRIMERA entrada de x-forwarded-for la elige el cliente, así que es
// falsificable; Vercel añade la IP real verificada como ÚLTIMO salto y además
// pone x-real-ip.
function resolveClientIp(request: Request | null): string {
  const xri = request?.headers.get("x-real-ip");
  if (xri) return xri.trim();
  const xff = request?.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}
const RATE_TRIP_DAILY_LIMIT = 20;

// share_slug siempre tiene esta forma exacta: slugify(destino) + "-Ndias" +
// "-" + sufijo aleatorio base36 (ver slugify/randomSuffix más abajo) — nunca
// mayúsculas, espacios ni caracteres fuera de [a-z0-9-].
const SlugInput = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
});

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "viaje"
  );
}
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}
function daysBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

function publicClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Toggle public visibility of a trip. Also ensures a share_slug exists. */
export const setTripPublic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ tripId: z.string().uuid(), isPublic: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
      "check_and_increment_rate_limit" as never,
      { p_scope: "trip_publish_user", p_key: userId, p_limit: PUBLISH_TOGGLE_DAILY_LIMIT } as never,
    );
    if (rlErr) {
      console.error("[explore] rate limit check failed (publish toggle)", rlErr);
      throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
    }
    if (!allowed) {
      throw new Error(
        `Has alcanzado el límite de ${PUBLISH_TOGGLE_DAILY_LIMIT} cambios diarios de este tipo. Inténtalo mañana.`,
      );
    }

    const { data: trip, error } = await supabase
      .from("trips")
      .select("id, destination, start_date, end_date, share_slug")
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!trip) throw new Error("Trip not found");
    const row = trip as unknown as {
      id: string;
      destination: string;
      start_date: string | null;
      end_date: string | null;
      share_slug: string | null;
    };

    let slug = row.share_slug;
    if (data.isPublic && !slug) {
      const nDays = daysBetween(row.start_date, row.end_date);
      const base = slugify(row.destination) + (nDays ? `-${nDays}-dias` : "");
      for (let i = 0; i < 5; i++) {
        const candidate = `${base}-${randomSuffix()}`;
        const { error: upErr } = await supabase
          .from("trips")
          .update({ share_slug: candidate } as never)
          .eq("id", row.id)
          .eq("user_id", userId);
        if (!upErr) {
          slug = candidate;
          break;
        }
        // Reintentar solo ante colisión real del unique index (23505).
        if (upErr.code !== "23505") throw new Error(upErr.message);
      }
      if (!slug) throw new Error("Could not generate share slug");
    }

    const { error: upErr2 } = await supabase
      .from("trips")
      .update({
        is_public: data.isPublic,
        published_at: data.isPublic ? new Date().toISOString() : null,
      } as never)
      .eq("id", row.id)
      .eq("user_id", userId);
    if (upErr2) throw new Error(upErr2.message);
    return { isPublic: data.isPublic, slug };
  });

export type PublicFeedItem = {
  slug: string;
  destination: string;
  hero_image_url: string | null;
  summary: string | null;
  n_days: number | null;
  trip_style: string | null;
  trip_types: string[];
  budget: string | null;
  published_at: string | null;
  rating_avg: number | null;
  rating_count: number;
  view_count: number;
};

const ListPublicTripsInput = z.object({
  destination: z.string().trim().max(120).optional(),
  durationBucket: z.enum(["short", "medium", "long", "all"]).optional(),
  style: z.string().trim().max(40).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const listPublicTrips = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => ListPublicTripsInput.parse(d))
  .handler(async ({ data }): Promise<PublicFeedItem[]> => {
    const ip = resolveClientIp(getRequest() ?? null);
    const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
      "check_and_increment_rate_limit" as never,
      {
        p_scope: "public_feed_ip",
        p_key: hashIp(ip),
        p_limit: PUBLIC_FEED_IP_DAILY_LIMIT,
      } as never,
    );
    // Fail OPEN, igual que getPublicTrip: es una lectura pública de la que
    // dependen visitantes reales y los rastreadores de redes sociales, y un
    // limitador roto no puede tumbar /explore. Solo se corta cuando el tope
    // se alcanza de verdad.
    if (rlErr) console.error("[explore] public feed rate limit check failed", rlErr);
    if (!rlErr && !allowed) {
      throw new Error("Demasiadas peticiones. Inténtalo de nuevo más tarde.");
    }

    const client = publicClient();
    let query = client
      .from("trips")
      .select(
        "share_slug, destination, hero_image_url, itinerary, start_date, end_date, trip_style, trip_types, budget, published_at, is_public, rating_sum, rating_count, view_count",
      )
      .eq("is_public" as never, true)
      .not("share_slug", "is", null)
      .order("published_at" as never, { ascending: false })
      .limit(Math.min(data.limit ?? 60, 100));

    if (data.destination && data.destination.trim()) {
      query = query.ilike("destination", `%${data.destination.trim()}%`);
    }
    if (data.style && data.style !== "all") {
      query = query.eq("trip_style" as never, data.style);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const items: PublicFeedItem[] = (rows ?? []).map((r) => {
      const row = r as {
        share_slug: string;
        destination: string;
        hero_image_url: string | null;
        itinerary: { summary?: string; days?: PublicTripDay[] } | null;
        start_date: string | null;
        end_date: string | null;
        trip_style: string | null;
        trip_types: string[] | null;
        budget: string | null;
        published_at: string | null;
      };
      const nDays =
        daysBetween(row.start_date, row.end_date) ?? row.itinerary?.days?.length ?? null;
      const ratingSum = (r as { rating_sum?: number | null }).rating_sum ?? 0;
      const ratingCount = (r as { rating_count?: number | null }).rating_count ?? 0;
      return {
        slug: row.share_slug,
        destination: row.destination,
        hero_image_url: row.hero_image_url,
        summary: row.itinerary?.summary ?? null,
        n_days: nDays,
        trip_style: row.trip_style,
        trip_types: row.trip_types ?? [],
        budget: row.budget,
        published_at: row.published_at,
        rating_avg: ratingCount > 0 ? ratingSum / ratingCount : null,
        rating_count: ratingCount,
        view_count: (r as { view_count?: number | null }).view_count ?? 0,
      };
    });

    if (data.durationBucket && data.durationBucket !== "all") {
      return items.filter((it) => {
        if (!it.n_days) return false;
        if (data.durationBucket === "short") return it.n_days <= 4;
        if (data.durationBucket === "medium") return it.n_days >= 5 && it.n_days <= 9;
        return it.n_days >= 10;
      });
    }
    return items;
  });

export type DiscoverableTrip = PublicTrip & {
  trip_style: string | null;
  trip_types: string[];
  budget: string | null;
};

/**
 * Submit a 1-5 star rating for a public trip (optimistic UI, silently no-ops until DB migration runs).
 * DB migration required:
 *   ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_sum integer NOT NULL DEFAULT 0;
 *   ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
 */
/**
 * DB setup required (run once in Supabase SQL editor):
 *
 *   ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_sum   integer NOT NULL DEFAULT 0;
 *   ALTER TABLE trips ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
 *
 *   CREATE OR REPLACE FUNCTION increment_trip_rating(p_slug text, p_rating int)
 *   RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
 *   BEGIN
 *     UPDATE trips
 *       SET rating_sum   = COALESCE(rating_sum,   0) + p_rating,
 *           rating_count = COALESCE(rating_count, 0) + 1
 *       WHERE share_slug = p_slug AND is_public = true;
 *   END;
 *   $$;
 *
 *   GRANT EXECUTE ON FUNCTION increment_trip_rating(text, int) TO anon, authenticated;
 */
const RateTripInput = SlugInput.extend({ rating: z.number().int().min(1).max(5) });

export const rateTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RateTripInput.parse(d))
  .handler(async ({ data, context }) => {
    // Use the authenticated supabase client from middleware context
    const { supabase, userId } = context;

    const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
      "check_and_increment_rate_limit" as never,
      { p_scope: "trip_rate_user", p_key: userId, p_limit: RATE_TRIP_DAILY_LIMIT } as never,
    );
    if (rlErr) {
      console.error("[explore] rate limit check failed (rate trip)", rlErr);
      throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
    }
    if (!allowed) {
      throw new Error(
        `Has alcanzado el límite de ${RATE_TRIP_DAILY_LIMIT} valoraciones diarias. Inténtalo mañana.`,
      );
    }

    // Call SECURITY DEFINER function — bypasses RLS, works even if columns were
    // just added without a policy that permits user-driven updates.
    const { error } = await supabase.rpc(
      "increment_trip_rating" as never,
      {
        p_slug: data.slug,
        p_rating: data.rating,
      } as never,
    );
    if (error) {
      // Function not yet created → graceful no-op; optimistic UI already updated
      console.warn("[rateTrip] rpc error (migration pending?):", error.message);
    }
    return { ok: true };
  });

export const getDiscoverableTrip = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => SlugInput.parse(d))
  .handler(async ({ data }): Promise<DiscoverableTrip | null> => {
    const client = publicClient();
    const { data: row, error } = await client
      .from("trips")
      .select(
        "destination, hero_image_url, itinerary, start_date, end_date, share_slug, trip_style, trip_types, budget, is_public",
      )
      .eq("share_slug" as never, data.slug)
      .eq("is_public" as never, true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const r = row as {
      destination: string;
      hero_image_url: string | null;
      itinerary: { summary?: string; days?: PublicTripDay[] } | null;
      start_date: string | null;
      end_date: string | null;
      share_slug: string;
      trip_style: string | null;
      trip_types: string[] | null;
      budget: string | null;
    };
    return {
      destination: r.destination,
      hero_image_url: r.hero_image_url,
      summary: r.itinerary?.summary ?? null,
      days: r.itinerary?.days ?? [],
      start_date: r.start_date,
      end_date: r.end_date,
      slug: r.share_slug,
      trip_style: r.trip_style,
      trip_types: r.trip_types ?? [],
      budget: r.budget,
    };
  });
