import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { PublicTrip, PublicTripDay } from "@/lib/share.functions";

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
  .inputValidator((data: { tripId: string; isPublic: boolean }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
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
};

export const listPublicTrips = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      destination?: string;
      durationBucket?: "short" | "medium" | "long" | "all";
      style?: string;
      limit?: number;
    }) => data,
  )
  .handler(async ({ data }): Promise<PublicFeedItem[]> => {
    const client = publicClient();
    let query = client
      .from("trips")
      .select(
        "share_slug, destination, hero_image_url, itinerary, start_date, end_date, trip_style, trip_types, budget, published_at, is_public",
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
        daysBetween(row.start_date, row.end_date) ??
        (row.itinerary?.days?.length ?? null);
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
export const rateTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string; rating: number }) => data)
  .handler(async ({ data, context }) => {
    if (data.rating < 1 || data.rating > 5) throw new Error("Rating must be 1-5");
    // Use the authenticated supabase client from middleware context
    const { supabase } = context;
    // Call SECURITY DEFINER function — bypasses RLS, works even if columns were
    // just added without a policy that permits user-driven updates.
    const { error } = await supabase.rpc("increment_trip_rating" as never, {
      p_slug: data.slug,
      p_rating: data.rating,
    } as never);
    if (error) {
      // Function not yet created → graceful no-op; optimistic UI already updated
      console.warn("[rateTrip] rpc error (migration pending?):", error.message);
    }
    return { ok: true };
  });

export const getDiscoverableTrip = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
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
