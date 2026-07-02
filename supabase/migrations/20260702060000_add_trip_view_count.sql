-- Track how many times a publicly-shared trip has been viewed (Fase 7: compartir).
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Lets anonymous/authenticated visitors bump the counter on a published trip
-- via getPublicTrip, without granting broader UPDATE access to trips.
CREATE OR REPLACE FUNCTION public.increment_trip_view_count(trip_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.trips SET view_count = view_count + 1
  WHERE share_slug = trip_slug AND is_public = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_trip_view_count(text) TO anon, authenticated;
