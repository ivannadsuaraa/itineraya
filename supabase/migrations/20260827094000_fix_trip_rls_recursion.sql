-- Rompe la recursión infinita entre las políticas RLS de `trips` y
-- `trip_members`.
--
-- El ciclo
-- ────────
-- 20260628222827 (compañeros de viaje) creó estas dos políticas:
--
--   trips."members can view trip"            → lee trip_members
--   trip_members."members can view own …"    → lee trips
--
-- Cualquier lectura de una de las dos tablas activa la política de la otra,
-- que a su vez activa la primera. Postgres lo detecta y aborta:
--
--   ERROR: infinite recursion detected in policy for relation "trips"
--
-- Reproducido sobre un Postgres 16 limpio con las 36 migraciones aplicadas en
-- orden: como rol `authenticated`, SELECT, UPDATE y DELETE sobre `trips`
-- fallan los tres (solo INSERT pasa, porque no necesita leer la fila). Es
-- decir, con este conjunto de migraciones el dashboard, la ficha del viaje y
-- guardar notas o marcar actividades no funcionan para nadie.
--
-- La solución
-- ───────────
-- Las mismas condiciones, pero consultadas a través de los ayudantes
-- SECURITY DEFINER definidos en 20260827093000: al ejecutarse como
-- propietario de la función, la lectura interna no vuelve a activar RLS y el
-- ciclo se corta. La regla de acceso no cambia — un miembro sigue viendo el
-- viaje, y solo el propietario gestiona los miembros.

-- ── trips: los miembros invitados pueden ver el viaje ──
DROP POLICY IF EXISTS "members can view trip" ON public.trips;
CREATE POLICY "members can view trip"
  ON public.trips FOR SELECT TO authenticated
  USING (public.is_trip_member(trips.id));

-- ── trip_members: tu propia fila, o cualquiera si el viaje es tuyo ──
DROP POLICY IF EXISTS "members can view own membership rows" ON public.trip_members;
CREATE POLICY "members can view own membership rows"
  ON public.trip_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_trip_owner(trip_id));

-- ── trip_members: el propietario retira miembros; un miembro puede salirse ──
DROP POLICY IF EXISTS "trip owner deletes members" ON public.trip_members;
CREATE POLICY "trip owner deletes members"
  ON public.trip_members FOR DELETE TO authenticated
  USING (public.is_trip_owner(trip_id) OR user_id = auth.uid());
