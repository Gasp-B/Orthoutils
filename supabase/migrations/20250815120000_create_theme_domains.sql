-- Create junction table between themes and domains to align with taxonomy management

CREATE TABLE IF NOT EXISTS public.theme_domains (
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (theme_id, domain_id)
);

ALTER TABLE public.theme_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read theme_domains"
  ON public.theme_domains
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated modify theme_domains"
  ON public.theme_domains
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
