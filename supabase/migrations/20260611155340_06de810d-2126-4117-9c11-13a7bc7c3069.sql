
DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free', 'viajero', 'explorador');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan public.subscription_plan NOT NULL DEFAULT 'free';
