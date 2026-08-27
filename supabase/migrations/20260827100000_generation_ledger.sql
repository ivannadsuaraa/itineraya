-- Registro monótono de generaciones de itinerario.
--
-- El problema
-- ───────────
-- El tope de plan (free = 2 de por vida, viajero = 5 al mes) se calculaba
-- contando filas de `trips` con status = 'ready'. Esa cuenta la controla el
-- propio usuario: `authenticated` tiene DELETE sobre sus viajes —y el
-- dashboard incluso pone un botón de borrar—, así que borrar un itinerario
-- devolvía una generación. Un usuario gratuito podía repetirlo
-- indefinidamente; lo único que seguía acotando era el tope diario de 20.
--
-- La solución
-- ───────────
-- Una fila por generación real, en una tabla que el cliente no puede tocar.
-- Borrar el viaje ya no borra el hecho de haberlo generado.
--
-- Compatibilidad con lo que ya existe: el código toma el MÁXIMO entre esta
-- cuenta y la cuenta de `trips` de siempre. Así nadie recibe generaciones de
-- regalo al desplegar (los usuarios actuales siguen contando por sus viajes,
-- que es lo que refleja su uso real) y, a partir de ahora, borrar no
-- descuenta. La tabla arranca vacía a propósito.

CREATE TABLE IF NOT EXISTS public.generation_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_ledger_user_created_idx
  ON public.generation_ledger (user_id, created_at DESC);

-- Sin ningún permiso para el cliente: solo la escribe y la lee el servidor
-- con la service_role, desde generateItinerary.
REVOKE ALL ON public.generation_ledger FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.generation_ledger TO service_role;

ALTER TABLE public.generation_ledger ENABLE ROW LEVEL SECURITY;
-- RLS activo y sin políticas para roles de cliente: aunque alguien
-- reintrodujera un GRANT por error, `authenticated` no vería ni escribiría
-- nada. service_role no pasa por RLS.
