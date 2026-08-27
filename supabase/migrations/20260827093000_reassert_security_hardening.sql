-- Vuelve a afirmar el endurecimiento de seguridad de
-- 20260704090000_security_hardening_and_missing_columns.sql.
--
-- Por qué hace falta
-- ──────────────────
-- Aquella migración listaba `travel_mode` en un
-- `GRANT UPDATE (...) ON public.profiles`, pero `travel_mode` es una columna
-- de `trips`, no de `profiles` (confirmado contra el esquema real en
-- src/integrations/supabase/types.ts, y reproducido replicando las 35
-- migraciones sobre un Postgres 16 limpio:
--   ERROR: column "travel_mode" of relation "profiles" does not exist).
--
-- Postgres rechaza el GRANT completo si una sola columna no existe, así que
-- ese fichero no se podía aplicar entero. Según cómo se ejecutara quedan dos
-- estados posibles, y ninguno es el que se pretendía:
--
--   a) Aplicado dentro de una transacción → todo el fichero revierte, y los
--      bloques 2, 3 y 4 (escalada de plan, trip_members, columnas de `anon`)
--      nunca llegaron a existir.
--   b) Aplicado sentencia a sentencia → el `REVOKE UPDATE ON profiles` sí
--      pasó y el `GRANT` siguiente falló, dejando a `authenticated` SIN
--      permiso de escritura sobre su propio perfil; y los bloques 3 y 4 no
--      llegaron a ejecutarse.
--
-- Esta migración es idempotente y segura en cualquiera de los dos casos: deja
-- el estado final que buscaba la original. No toca datos.

-- ============================================================
-- 0) Ayudantes SECURITY DEFINER para romper la recursión entre políticas.
--    `trips` y `trip_members` se referencian mutuamente en sus políticas
--    RLS, y Postgres aborta con "infinite recursion detected in policy".
--    Un SECURITY DEFINER lee la tabla del otro lado sin volver a activar
--    RLS, que es lo que corta el ciclo. Ver 20260827094000, que reescribe
--    las políticas preexistentes que lo provocan.
--
--    Ninguna de las dos filtra información: contestan sí/no sobre el
--    usuario que llama (auth.uid()), nunca sobre un tercero.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips t WHERE t.id = p_trip_id AND t.user_id = auth.uid()
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_trip_owner(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trip_owner(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members m WHERE m.trip_id = p_trip_id AND m.user_id = auth.uid()
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_trip_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_trip_member(UUID) TO authenticated, service_role;

-- ============================================================
-- 2) Escalada de plan: `plan` fuera del GRANT por columnas, para que solo el
--    webhook de Stripe (service_role) pueda cambiarlo.
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
  trial_ends_at
) ON public.profiles TO authenticated;

-- ============================================================
-- 3) trip_members: sin esto, cualquier usuario podía insertarse como
--    colaborador de CUALQUIER viaje (user_id = auth.uid() y trip_id libre) y
--    leerlo después vía la política "members can view trip".
-- ============================================================
DROP POLICY IF EXISTS "trip owner manages members" ON public.trip_members;
CREATE POLICY "trip owner manages members"
  ON public.trip_members FOR INSERT TO authenticated
  WITH CHECK (public.is_trip_owner(trip_id));

-- ============================================================
-- 4) Lectura anónima de viajes publicados, acotada por columnas: sin esto,
--    cualquiera con la clave publicable lee TODAS las columnas de un viaje
--    público — user_id, hotel_name/address/lat/lng, horas de llegada y
--    salida, y las notas de "evitar".
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
