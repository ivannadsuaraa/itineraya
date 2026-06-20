-- Fix privacy leak: anyone could read any trip with a share_slug.
-- Drop the overly permissive policy and rely on:
--   * "Users view own trips" (auth.uid() = user_id) for the dashboard
--   * "Public can view published trips" (is_public = true AND share_slug IS NOT NULL) for /explore and shared links
DROP POLICY IF EXISTS "Public can view shared trips" ON public.trips;