-- Security audit (2026-07-12): fixes for findings that require DB changes.
-- Code-level fixes (invite email match, auth-email fail-closed, escapeHtml
-- gap, real rate limiting on demo/inspire/edit endpoints) live in the app
-- repo; this migration provides the DB-side support those fixes need.

-- ============================================================
-- 1) Lock down `trip_invitations` — a legacy table discovered via live
--    schema introspection during this audit. Same shape as `trip_invites`
--    (trip_id, email, token, invited_by, status) but NOT referenced by any
--    migration or app code — a pre-migration-system leftover. Anonymous
--    reads already return 401 (no grant), but since its origin can't be
--    verified from code, lock it down explicitly with RLS instead of
--    leaving its authenticated-role posture unknown. Not dropped: the
--    data (if any) isn't ours to delete without the operator's say-so.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trip_invitations') THEN
    EXECUTE 'ALTER TABLE public.trip_invitations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.trip_invitations FROM anon, authenticated';
    EXECUTE 'DROP POLICY IF EXISTS "deny all trip_invitations" ON public.trip_invitations';
    EXECUTE 'CREATE POLICY "deny all trip_invitations" ON public.trip_invitations FOR ALL USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- ============================================================
-- 2) Trip rating abuse: increment_trip_rating had no per-user tracking, so
--    a single authenticated account could call rateTrip in a loop and
--    arbitrarily inflate or tank any public trip's rating_avg — including
--    trips they don't own. Track one rating per (trip, user); changing
--    your mind updates it instead of adding another vote. Same function
--    signature as before, so the TS caller (explore.functions.ts) is
--    unchanged.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trip_ratings (
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

GRANT ALL ON public.trip_ratings TO service_role;
ALTER TABLE public.trip_ratings ENABLE ROW LEVEL SECURITY;
-- No direct client policies: all access goes through the SECURITY DEFINER
-- RPC below (matches the existing increment_trip_rating pattern).

CREATE OR REPLACE FUNCTION public.increment_trip_rating(p_slug TEXT, p_rating INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip_id UUID;
  v_old_rating SMALLINT;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'rating out of range';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT id INTO v_trip_id FROM public.trips WHERE share_slug = p_slug AND is_public = true;
  IF v_trip_id IS NULL THEN
    RETURN; -- unknown/unpublished slug: silent no-op, same as before
  END IF;

  SELECT rating INTO v_old_rating
    FROM public.trip_ratings WHERE trip_id = v_trip_id AND user_id = auth.uid();

  INSERT INTO public.trip_ratings (trip_id, user_id, rating)
    VALUES (v_trip_id, auth.uid(), p_rating)
    ON CONFLICT (trip_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = now();

  IF v_old_rating IS NULL THEN
    UPDATE public.trips
      SET rating_sum = COALESCE(rating_sum, 0) + p_rating,
          rating_count = COALESCE(rating_count, 0) + 1
      WHERE id = v_trip_id;
  ELSE
    -- Same voter changing their rating: adjust the running sum, count stays put.
    UPDATE public.trips
      SET rating_sum = COALESCE(rating_sum, 0) - v_old_rating + p_rating
      WHERE id = v_trip_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_trip_rating(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_trip_rating(TEXT, INT) TO authenticated, service_role;

-- ============================================================
-- 3) Durable rate limiting. The previous demo-generation limiter lived in
--    an in-memory Map inside the server function — on Vercel's serverless
--    runtime each concurrent lambda instance gets its own memory, so the
--    "6/day per IP" cap was really "6/day per IP per lambda instance",
--    trivially multiplied by however many instances auto-scale under load.
--    This table + RPC gives every rate-limited endpoint (demo generation,
--    inspire suggestions, assistant edits) a real, atomic, cross-instance
--    counter. One UPSERT with `count = count + 1` under Postgres's row lock
--    avoids the read-then-write race the old per-plan itinerary counters had.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, key, day)
);

GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
-- service_role only — this table is never touched directly by client code,
-- only via the admin client inside server functions.

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(p_scope TEXT, p_key TEXT, p_limit INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO public.rate_limit_counters (scope, key, day, count)
    VALUES (p_scope, p_key, CURRENT_DATE, 1)
    ON CONFLICT (scope, key, day) DO UPDATE SET count = rate_limit_counters.count + 1
    RETURNING count INTO v_count;
  RETURN v_count <= p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, TEXT, INT) TO service_role;

-- Cheap cleanup: old counter rows are worthless after their day passes.
-- Not scheduled automatically (no existing cron helper does per-table
-- cleanup); safe to run manually or wire into the existing pg_cron setup:
--   DELETE FROM public.rate_limit_counters WHERE day < CURRENT_DATE - INTERVAL '7 days';
