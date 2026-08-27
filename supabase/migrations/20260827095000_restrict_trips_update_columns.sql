-- `trips` tenía un GRANT UPDATE de tabla entera para `authenticated`, y su RLS
-- solo comprueba que la fila sea tuya. Sobre tu propio viaje podías, por tanto,
-- escribir cualquier columna desde el navegador con una sola llamada REST.
-- Tres consecuencias reales:
--
--   1. `status`: el tope de itinerarios del plan cuenta filas con
--      status = 'ready'. Un PATCH a "draft" sacaba el viaje de la cuenta sin
--      perderlo, y devolverlo a "ready" después lo recuperaba entero.
--   2. `hero_image_url`: /api/og la descarga en el servidor para componer la
--      tarjeta social. Apuntarla a una URL interna convertía ese endpoint en
--      un SSRF (ya mitigado también en el propio endpoint con una lista de
--      hosts permitidos; esto cierra el origen).
--   3. `view_count`, `rating_sum`, `rating_count`: son la prueba social que
--      se muestra en /explore, y se calculan en RPCs con sus propios límites
--      (un voto por usuario, un recuento por IP). Escribirlas a mano saltaba
--      ambos: cualquiera podía ponerle 5 estrellas y 999.999 visitas a su
--      propio viaje.
--
-- Se pasa a un GRANT por columnas con exactamente lo que el cliente y los
-- server functions escriben con la sesión del usuario:
--
--   itinerary     → notas y "hecho" del viajero (updateActivity en
--                   my-trip.$tripId.tsx) y la reescritura del asistente
--   is_public     → setTripPublic (explore.functions.ts)
--   share_slug    → enableTripShare / setTripPublic
--   published_at  → setTripPublic
--   geo_lat/lng   → geocodificación desde el cliente (onboarding, dashboard)
--
-- `status` y `hero_image_url` los escribe ahora service_role dentro de
-- generateItinerary y editItineraryWithAssistant, que ya comprueban la
-- propiedad del viaje antes de escribir.
--
-- INSERT y DELETE no cambian: siguen acotados por RLS a las filas propias.

REVOKE UPDATE ON public.trips FROM authenticated;
GRANT UPDATE (
  itinerary,
  is_public,
  share_slug,
  published_at,
  geo_lat,
  geo_lng
) ON public.trips TO authenticated;
