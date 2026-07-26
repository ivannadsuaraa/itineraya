-- RLS_FIXES.sql
-- Auditoría de RLS de todas las tablas de Supabase definidas en
-- supabase/migrations/*.sql (33 ficheros, 16 tablas), 2026-07-26.
--
-- NO APLICADO TODAVÍA. Generado como borrador para revisión manual.
--
-- ============================================================
-- METODOLOGÍA
-- ============================================================
-- Se reconstruyó el estado final acumulado de cada tabla (RLS + políticas +
-- GRANTs) leyendo las 33 migraciones en orden cronológico, y se contrastó
-- contra el código cliente real (src/lib/*.functions.ts,
-- src/integrations/supabase/auth-middleware.ts) para saber qué rol de
-- Postgres ejecuta cada operación: el middleware `requireSupabaseAuth` crea
-- el cliente con la ANON/publishable key + el Bearer token del usuario, así
-- que toda "server function" que lo usa corre como `authenticated` bajo RLS
-- con auth.uid() = el usuario real — NO como service_role. Los pocos casos
-- que sí necesitan bypass (aceptar invitación, procesar el email queue,
-- webhook de Stripe) usan explícitamente supabaseAdmin/service_role.
--
-- RESULTADO GENERAL: las 16 tablas creadas tienen RLS habilitado (verificado
-- cruzando cada CREATE TABLE con su ENABLE ROW LEVEL SECURITY). El proyecto
-- ya pasó por tres rondas previas de hardening (20260704090000,
-- 20260712090000, y los REVOKE/GRANT de columnas en profiles) que corrigieron
-- problemas reales: auto-escalado de plan, miembros añadiéndose a viajes
-- ajenos, exposición de columnas privadas a anon en viajes públicos, tabla
-- legacy `trip_invitations` sin RLS. Todo eso sigue correcto y no se toca.
--
-- Tablas revisadas y SIN problemas encontrados (aislamiento correcto
-- usuario-a-usuario, o service_role-only donde corresponde):
--   profiles, subscriptions, saved_inspirations, chat_usage, trip_members,
--   trip_invites, trip_ratings, rate_limit_counters, email_send_log,
--   email_send_state, suppressed_emails, email_unsubscribe_tokens,
--   lifecycle_email_log, destination_news_cache, trip_invitations (legacy,
--   bloqueada por completo).
--
-- ============================================================
-- HALLAZGO 1 (el más relevante) — public.trips
-- ============================================================
-- `GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated`
-- (20260611102431, re-otorgado en 20260617132935) es un GRANT de tabla
-- completa sin restricción de columnas. La política RLS de UPDATE
-- ("Users update own trips": USING/WITH CHECK auth.uid() = user_id) solo
-- garantiza que cada usuario opera sobre SU PROPIA fila — pero dentro de esa
-- fila puede escribir CUALQUIER columna, incluidas `rating_sum`,
-- `rating_count` y `view_count`.
--
-- Esas tres columnas están diseñadas para escribirse EXCLUSIVAMENTE a través
-- de las funciones SECURITY DEFINER `increment_trip_rating` e
-- `increment_trip_view_count` (que validan rango de rating, cuentan un voto
-- por usuario vía trip_ratings, etc.). Con el GRANT actual, el propio dueño
-- de un viaje puede saltarse esa lógica con un PATCH directo a la REST API:
--
--   PATCH /rest/v1/trips?id=eq.<mi-viaje>
--   { "rating_sum": 500, "rating_count": 1, "view_count": 999999 }
--
-- Esto no es literalmente "leer/modificar el viaje de otro usuario", pero el
-- rating/vistas de un viaje público se muestran a TODOS los visitantes de
-- /explore — así que un usuario puede falsificar la señal de confianza que
-- ven otros usuarios sobre su propio contenido. Es la misma clase de bug que
-- ya se corrigió para `profiles.plan` (auto-escalado vía REST directo) en
-- 20260704090000 — aquí quedó sin aplicar el mismo patrón a `trips`.
--
-- Verificado contra el código: share.functions.ts, explore.functions.ts,
-- itinerary.functions.ts, itinerary-edit.functions.ts y geocode.ts escriben
-- legítimamente destination, start_date, end_date, companion, budget,
-- trip_style, avoid, itinerary, hero_image_url, status, arrival_time,
-- departure_time, share_slug, trip_types, has_accommodation, travel_mode,
-- is_public, published_at, hotel_name, hotel_address, hotel_lat, hotel_lng,
-- geo_lat, geo_lng, pace, first_visit, dietary — todas usando el cliente con
-- sesión del usuario (rol authenticated), así que deben seguir concedidas.
-- Ninguna ruta del cliente escribe rating_sum, rating_count ni view_count
-- directamente (solo vía las RPC ya existentes) — se excluyen del GRANT.
--
-- FIX: mismo patrón exacto que la migración de profiles (REVOKE + GRANT de
-- columnas explícitas). Reversible con un GRANT UPDATE sin lista de columnas.

REVOKE UPDATE ON public.trips FROM authenticated;
GRANT UPDATE (
  destination,
  start_date,
  end_date,
  companion,
  budget,
  trip_style,
  avoid,
  itinerary,
  hero_image_url,
  status,
  arrival_time,
  departure_time,
  share_slug,
  trip_types,
  has_accommodation,
  travel_mode,
  is_public,
  published_at,
  hotel_name,
  hotel_address,
  hotel_lat,
  hotel_lng,
  geo_lat,
  geo_lng,
  pace,
  first_visit,
  dietary
) ON public.trips TO authenticated;

-- Nota: `id`, `user_id`, `created_at`, `updated_at` quedan fuera a propósito
-- (PK/FK/timestamps de sistema; `user_id` ya está protegido además por el
-- WITH CHECK de la política, pero excluirlo del GRANT es defensa en
-- profundidad). `rating_sum`, `rating_count`, `view_count` quedan fuera:
-- solo escribibles por las RPC SECURITY DEFINER o por service_role.


-- ============================================================
-- HALLAZGO 2 — public.trip_pass_purchases
-- ============================================================
-- La política "Users can view own trip pass purchases" (creada en
-- 20260707130000_trip_pass_and_referral_rewards.sql) nunca tuvo su
-- `GRANT SELECT ... TO authenticated` correspondiente — la migración solo
-- otorgó `GRANT ALL ... TO service_role`. En Postgres el GRANT se evalúa
-- ANTES que las políticas RLS: sin el GRANT, cualquier SELECT del rol
-- `authenticated` es rechazado de raíz y la política nunca llega a
-- evaluarse. Falla en modo seguro (nadie ve nada, no hay fuga de datos entre
-- usuarios), pero la política está mal configurada — es papel mojado, y la
-- funcionalidad que pretendía habilitar (que el usuario vea su propio
-- historial de compras del Pase de Viaje) no funciona.
--
-- Verificado: el código cliente (src/**) no consulta esta tabla hoy — solo
-- aparece en el webhook de Stripe (service_role) — así que este fix no tiene
-- efecto en producción hasta que se añada esa pantalla, pero dado que se
-- pidió expresamente detectar políticas mal configuradas, se incluye.
--
-- FIX: conceder exactamente lo que la política ya asume, restringido a las
-- columnas que tiene sentido que el propio usuario vea (se excluye
-- `stripe_checkout_session_id`, un identificador interno de Stripe sin valor
-- para el usuario y que no debería quedar expuesto por la REST API).

GRANT SELECT (
  id,
  user_id,
  environment,
  created_at
) ON public.trip_pass_purchases TO authenticated;
