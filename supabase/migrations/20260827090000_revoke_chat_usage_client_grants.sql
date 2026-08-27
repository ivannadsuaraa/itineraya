-- El límite diario de mensajes del plan gratuito vivía en `chat_usage`, una
-- tabla con GRANT SELECT/INSERT/UPDATE a `authenticated` y una política RLS
-- que solo comprueba que la fila sea tuya (ver
-- 20260621091437_da7127cd-546e-4405-a9ec-bf13a101e1dd.sql). El contador de
-- cuota era, por tanto, escribible por el propio usuario: bastaba un
--
--   supabase.from('chat_usage').update({ message_count: 0 }).eq('user_id', me)
--
-- desde la consola del navegador para dejar el límite en nada y usar el
-- asistente sin tope en una cuenta gratuita.
--
-- El código ya no usa esta tabla: src/routes/api/chat.ts pasa por
-- check_and_increment_rate_limit (atómico, SECURITY DEFINER, solo
-- service_role), igual que la ruta de los planes de pago. Aquí se retira el
-- acceso del cliente para que la tabla no vuelva a ser una vía de escritura.
-- La tabla se conserva con sus datos históricos; solo deja de ser accesible
-- desde el navegador.

REVOKE ALL ON public.chat_usage FROM authenticated;
REVOKE ALL ON public.chat_usage FROM anon;

DROP POLICY IF EXISTS "Users manage own chat usage" ON public.chat_usage;

-- RLS sigue activo y ahora sin ninguna política para roles de cliente: sin
-- política, `authenticated` no ve ni escribe nada aunque alguien reintroduzca
-- un GRANT por error. service_role no pasa por RLS, así que el servidor sigue
-- pudiendo leer la tabla si hiciera falta.
