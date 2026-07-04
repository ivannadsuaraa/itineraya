-- Referral/acquisition attribution (SOCIAL_STRATEGY.md, Cambio 1).
-- ShareDialog has emitted ?ref=<userId>&utm_source=<canal> on every shared
-- link since it was built, but nothing ever read them: no columns existed
-- and no code captured the params. This closes the loop so K-factor per
-- channel and referral rewards become measurable.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- SECURITY DEFINER RPC (same pattern as increment_trip_rating /
-- increment_trip_view_count): the authenticated client only ever gets an
-- RLS-scoped anon-key session (see auth-middleware.ts), and referred_by
-- must NOT be a plain column grant — a user could otherwise back-date
-- fake referrals for themselves via the REST API. Self-referral and
-- double-attribution are rejected here, server-side, and each field is
-- write-once (first attribution wins).
CREATE OR REPLACE FUNCTION public.attribute_acquisition(p_referred_by UUID, p_utm_source TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_referred_by IS NOT NULL AND p_referred_by = auth.uid() THEN
    p_referred_by := NULL;
  END IF;

  IF p_referred_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_referred_by
  ) THEN
    p_referred_by := NULL;
  END IF;

  UPDATE public.profiles
    SET referred_by = COALESCE(referred_by, p_referred_by),
        acquisition_source = COALESCE(acquisition_source, p_utm_source)
    WHERE id = auth.uid()
      AND (referred_by IS NULL OR acquisition_source IS NULL);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.attribute_acquisition(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attribute_acquisition(UUID, TEXT) TO authenticated, service_role;
