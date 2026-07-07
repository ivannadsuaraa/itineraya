-- Caché de noticias de destino (NewsAPI) para la sección "Antes de viajar".
-- Compartida entre viajes al mismo destino, refrescada cada 24h desde el
-- server function (nunca desde el cliente: NewsAPI bloquea CORS en free tier).
CREATE TABLE IF NOT EXISTS public.destination_news_cache (
  destination TEXT PRIMARY KEY,
  articles JSONB NOT NULL DEFAULT '[]',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no concede acceso al esquema public a service_role por defecto;
-- se otorga explícitamente para que el server function llegue vía PostgREST.
GRANT ALL ON public.destination_news_cache TO service_role;

ALTER TABLE public.destination_news_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage destination news cache"
    ON public.destination_news_cache FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
