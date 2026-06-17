CREATE TABLE public.saved_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  destination text NOT NULL,
  hero_image_url text,
  summary text,
  n_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_inspirations TO authenticated;
GRANT ALL ON public.saved_inspirations TO service_role;

ALTER TABLE public.saved_inspirations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved inspirations"
  ON public.saved_inspirations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_saved_inspirations_updated_at
  BEFORE UPDATE ON public.saved_inspirations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX saved_inspirations_user_created_idx
  ON public.saved_inspirations (user_id, created_at DESC);