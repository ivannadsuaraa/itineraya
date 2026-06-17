ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS trips_share_slug_idx ON public.trips (share_slug) WHERE share_slug IS NOT NULL;

GRANT SELECT ON public.trips TO anon;

CREATE POLICY "Public can view shared trips"
  ON public.trips
  FOR SELECT
  TO anon, authenticated
  USING (share_slug IS NOT NULL);