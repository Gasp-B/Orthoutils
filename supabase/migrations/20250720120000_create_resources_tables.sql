-- Create resources and translations with RLS and role-based policies.
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resources_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  description text,
  CONSTRAINT resources_translations_resource_locale_key UNIQUE (resource_id, locale)
);

-- Enable row level security.
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources_translations ENABLE ROW LEVEL SECURITY;

-- Public read access.
CREATE POLICY resources_public_select
ON public.resources
FOR SELECT
TO public
USING (true);

CREATE POLICY resources_translations_public_select
ON public.resources_translations
FOR SELECT
TO public
USING (true);

-- Service role write access.
CREATE POLICY resources_service_role_write
ON public.resources
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY resources_translations_service_role_write
ON public.resources_translations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
