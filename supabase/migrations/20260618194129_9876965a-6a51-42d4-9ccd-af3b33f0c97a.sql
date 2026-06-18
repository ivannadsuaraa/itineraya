
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS trips_public_feed_idx
  ON public.trips (published_at DESC)
  WHERE is_public = true AND share_slug IS NOT NULL;

DROP POLICY IF EXISTS "Public can view published trips" ON public.trips;
CREATE POLICY "Public can view published trips"
  ON public.trips
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_slug IS NOT NULL);
