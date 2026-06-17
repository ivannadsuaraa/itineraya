ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_accommodation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS travel_mode text NOT NULL DEFAULT 'planning';