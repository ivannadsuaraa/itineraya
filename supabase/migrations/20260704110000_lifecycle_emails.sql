-- Emails de ciclo de vida (GROWTH_REPORT §6) + trial visible desde el registro
-- (GROWTH_REPORT §5.3).

-- ============================================================
-- 1) El trial de 7 días empieza al crear la cuenta, no al
--    completar /welcome (antes se activaba en silencio allí).
--    Solo afecta a perfiles nuevos; los existentes conservan
--    su trial_ends_at actual (o NULL).
-- ============================================================
ALTER TABLE public.profiles
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

-- ============================================================
-- 2) Registro de envíos de ciclo de vida: garantiza que cada
--    email de la secuencia se envía una sola vez por usuario
--    (o por viaje, en pre/post-viaje: la clave lleva el trip id).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lifecycle_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_key)
);

GRANT ALL ON public.lifecycle_email_log TO service_role;

ALTER TABLE public.lifecycle_email_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role manages lifecycle log"
    ON public.lifecycle_email_log FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_lifecycle_email_log_user ON public.lifecycle_email_log(user_id);

-- Índices que usan las consultas del scheduler
CREATE INDEX IF NOT EXISTS trips_start_date_idx ON public.trips (start_date) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS trips_end_date_idx ON public.trips (end_date) WHERE status = 'ready';

-- ============================================================
-- PASO MANUAL (no expresable como SQL estático — igual que el
-- cron de process-email-queue): programar el scheduler.
--
--   SELECT cron.schedule(
--     'lifecycle-emails',
--     '0 9 * * *',  -- diario a las 09:00 UTC
--     $$ SELECT net.http_post(
--          url := 'https://<TU-DOMINIO>/email/email/lifecycle/run',
--          headers := jsonb_build_object(
--            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'),
--            'Content-Type', 'application/json'
--          ),
--          body := '{}'::jsonb
--        ); $$
--   );
--
-- Para revertir: SELECT cron.unschedule('lifecycle-emails');
-- ============================================================
