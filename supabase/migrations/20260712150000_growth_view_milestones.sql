-- Growth: el contador de vistas devuelve el nuevo total para poder detectar
-- hitos (10/50/100 vistas) y notificar al autor — el loop de dopamina que
-- convierte a quien comparte una vez en alguien que comparte siempre.
--
-- Cambia el tipo de retorno (void → integer), así que hay que borrar la
-- función antes de recrearla; CREATE OR REPLACE no permite cambiar RETURNS.

DROP FUNCTION IF EXISTS public.increment_trip_view_count(text);

CREATE FUNCTION public.increment_trip_view_count(trip_slug text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.trips SET view_count = view_count + 1
  WHERE share_slug = trip_slug AND is_public = true
  RETURNING view_count;
$$;

GRANT EXECUTE ON FUNCTION public.increment_trip_view_count(text) TO anon, authenticated;
