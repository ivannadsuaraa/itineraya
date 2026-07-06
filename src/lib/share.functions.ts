import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "viaje";
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

export const enableTripShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { tripId: string }) => data)
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
    const tripRow = trip as unknown as {
      id: string;
      destination: string;
      start_date: string | null;
      end_date: string | null;
      share_slug: string | null;
    };
    if (tripRow.share_slug) {
      // Ensure is_public is true even if it was previously disabled
      await supabase
        .from("trips")
        .update({ is_public: true } as never)
        .eq("id", tripRow.id)
        .eq("user_id", userId);
      return { slug: tripRow.share_slug };
    }

    const nDays = daysBetween(tripRow.start_date, tripRow.end_date);
    const base = slugify(tripRow.destination) + (nDays ? `-${nDays}-dias` : "");

    for (let i = 0; i < 5; i++) {
      const candidate = `${base}-${randomSuffix()}`;
      const { error: upErr } = await supabase
        .from("trips")
        .update({ share_slug: candidate, is_public: true } as never)
        .eq("id", tripRow.id)
        .eq("user_id", userId);
      if (!upErr) return { slug: candidate };
      // Solo la colisión de unique (23505) justifica otro intento; cualquier
      // otro error (permisos, red) se propaga en vez de reintentarse a ciegas.
      if (upErr.code !== "23505") throw new Error(upErr.message);
    }
    throw new Error("Could not generate share slug");
  });

export type PublicTripActivity = {
  time: string;
  emoji?: string;
  title: string;
  place?: string;
  description: string;
  category?: string;
  tip?: string;
};
export type PublicTripDay = {
  day: number;
  title: string;
  subtitle?: string;
  image_url?: string | null;
  activities: PublicTripActivity[];
};
export type PublicTrip = {
  destination: string;
  hero_image_url: string | null;
  summary: string | null;
  days: PublicTripDay[];
  start_date: string | null;
  end_date: string | null;
  slug: string;
};

export const getPublicTrip = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<PublicTrip | null> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase not configured");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: row, error } = await client
      .from("trips")
      .select("destination, hero_image_url, itinerary, start_date, end_date, share_slug")
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
    };
    // Best-effort view counter — never block or fail the page load on this.
    void client.rpc("increment_trip_view_count" as never, { trip_slug: data.slug } as never);
    return {
      destination: r.destination,
      hero_image_url: r.hero_image_url,
      summary: r.itinerary?.summary ?? null,
      days: r.itinerary?.days ?? [],
      start_date: r.start_date,
      end_date: r.end_date,
      slug: r.share_slug,
    };
  });
