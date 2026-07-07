-- Monetización: Pase de Viaje único (pago único, +1 viaje) y recompensa de
-- referidos (3 amigos → 1 mes de Viajero gratis).

-- ============================================================
-- 1) Columnas nuevas en profiles.
--    Igual que `plan`, ninguna de las dos se añade al GRANT UPDATE
--    column-level de `authenticated` (security_hardening migration):
--    solo el webhook de Stripe (bonus_trips) y la RPC SECURITY DEFINER
--    attribute_acquisition (referral_count) pueden escribirlas.
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_trips INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- 2) Registro de compras del Pase de Viaje — da idempotencia al webhook
--    (un checkout.session.completed puede reentregarse) antes de sumar
--    bonus_trips.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trip_pass_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stripe_checkout_session_id, environment)
);

GRANT ALL ON public.trip_pass_purchases TO service_role;

ALTER TABLE public.trip_pass_purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role manages trip pass purchases"
    ON public.trip_pass_purchases FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own trip pass purchases"
    ON public.trip_pass_purchases FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3) Incremento atómico de bonus_trips — usado por el webhook (service_role)
--    tras insertar en trip_pass_purchases con éxito (la unique constraint
--    de arriba hace de candado anti-doble-entrega).
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_bonus_trips(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET bonus_trips = bonus_trips + 1 WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_bonus_trips(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_bonus_trips(UUID) TO service_role;

-- ============================================================
-- 4) attribute_acquisition ahora también cuenta el referido para quien
--    invitó y activa la recompensa a los 3. Cambia el tipo de retorno
--    (void → TABLE), así que hay que borrar la función antes de recrearla;
--    CREATE OR REPLACE no permite cambiar RETURNS.
-- ============================================================
DROP FUNCTION IF EXISTS public.attribute_acquisition(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.attribute_acquisition(p_referred_by UUID, p_utm_source TEXT)
RETURNS TABLE(referrer_id UUID, referrer_referral_count INT, milestone_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_by UUID := p_referred_by;
  v_current_referred UUID;
  v_new_count INT;
  v_milestone BOOLEAN := false;
BEGIN
  IF v_referred_by IS NOT NULL AND v_referred_by = auth.uid() THEN
    v_referred_by := NULL;
  END IF;

  IF v_referred_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_referred_by
  ) THEN
    v_referred_by := NULL;
  END IF;

  SELECT p.referred_by INTO v_current_referred FROM public.profiles p WHERE p.id = auth.uid();

  UPDATE public.profiles
    SET referred_by = COALESCE(referred_by, v_referred_by),
        acquisition_source = COALESCE(acquisition_source, p_utm_source)
    WHERE id = auth.uid()
      AND (referred_by IS NULL OR acquisition_source IS NULL);

  -- Solo se acredita al referidor la primera vez que referred_by queda fijado
  -- de verdad (write-once) — evita sumar en cada llamada repetida/best-effort.
  IF v_current_referred IS NULL AND v_referred_by IS NOT NULL THEN
    UPDATE public.profiles
      SET referral_count = referral_count + 1
      WHERE id = v_referred_by
      RETURNING referral_count INTO v_new_count;

    IF v_new_count = 3 THEN
      -- Solo se concede si el referidor sigue en el plan gratuito: no
      -- degradar a alguien que ya paga Explorador a Viajero.
      UPDATE public.profiles
        SET plan = 'viajero',
            trial_ends_at = now() + interval '30 days'
        WHERE id = v_referred_by AND plan = 'free';
      IF FOUND THEN
        v_milestone := true;
      END IF;
    END IF;
  END IF;

  RETURN QUERY SELECT v_referred_by, v_new_count, v_milestone;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.attribute_acquisition(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attribute_acquisition(UUID, TEXT) TO authenticated, service_role;
