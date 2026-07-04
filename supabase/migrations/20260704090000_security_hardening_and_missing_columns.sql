-- Security hardening + columns referenced by app code but never migrated.
-- Found during the 2026-07-04 audit (see AUDIT_REPORT.md).

-- ============================================================
-- 1) Missing columns the app already reads/writes
--    (dashboard.tsx selects trial_ends_at/geo_lat/geo_lng,
--     welcome.tsx writes trial_ends_at, explore.functions.ts
--     documents rating_sum/rating_count as "run once manually")
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS geo_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geo_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rating_sum INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- Rating RPC (was only documented in a code comment, never created)
CREATE OR REPLACE FUNCTION public.increment_trip_rating(p_slug TEXT, p_rating INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'rating out of range';
  END IF;
  UPDATE public.trips
    SET rating_sum   = COALESCE(rating_sum, 0) + p_rating,
        rating_count = COALESCE(rating_count, 0) + 1
    WHERE share_slug = p_slug AND is_public = true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_trip_rating(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_trip_rating(TEXT, INT) TO authenticated, service_role;

-- ============================================================
-- 2) CRITICAL: block self-service plan escalation.
--    profiles had a blanket UPDATE grant + RLS "own row" policy,
--    so any user could set plan='explorador' via the REST API.
--    Column-level grant excludes `plan` (only service_role /
--    Stripe webhook may change it).
-- ============================================================
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name,
  avatar_url,
  travel_style,
  preferred_destinations,
  budget_range,
  language,
  welcome_completed,
  age,
  traveler_type,
  travel_mode,
  trial_ends_at
) ON public.profiles TO authenticated;

-- ============================================================
-- 3) CRITICAL: trip_members INSERT allowed `user_id = auth.uid()`
--    for ANY trip_id, so any user could add themselves as a
--    collaborator of any trip and read it via "members can view
--    trip". Restrict INSERT to the trip owner; invite acceptance
--    goes through service_role (acceptInvite) and is unaffected.
-- ============================================================
DROP POLICY IF EXISTS "trip owner manages members" ON public.trip_members;
CREATE POLICY "trip owner manages members"
  ON public.trip_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

-- ============================================================
-- 4) Limit what anonymous visitors can read from public trips.
--    The old policy (anon + authenticated) exposed every column
--    of a published trip — user_id, hotel_name/address/lat/lng,
--    arrival/departure times, avoid — to anyone with the
--    publishable key. Public reads all go through server
--    functions that use the anon key, so scope the policy to
--    anon and grant only the columns the public pages need.
-- ============================================================
DROP POLICY IF EXISTS "Public can view published trips" ON public.trips;
CREATE POLICY "Public can view published trips"
  ON public.trips FOR SELECT TO anon
  USING (is_public = true AND share_slug IS NOT NULL);

REVOKE SELECT ON public.trips FROM anon;
GRANT SELECT (
  id,
  destination,
  hero_image_url,
  itinerary,
  start_date,
  end_date,
  share_slug,
  is_public,
  trip_style,
  trip_types,
  budget,
  published_at,
  view_count,
  rating_sum,
  rating_count,
  created_at
) ON public.trips TO anon;
