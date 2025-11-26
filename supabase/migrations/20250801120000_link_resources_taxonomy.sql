-- Création des tables de jointure pour les ressources (Domaines, Tags, Pathologies)

-- 1. Resource Domains
CREATE TABLE IF NOT EXISTS public.resource_domains (
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, domain_id)
);

-- 2. Resource Tags
CREATE TABLE IF NOT EXISTS public.resource_tags (
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- 3. Resource Pathologies
CREATE TABLE IF NOT EXISTS public.resource_pathologies (
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  pathology_id uuid NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, pathology_id)
);

-- Activation RLS (Row Level Security)
ALTER TABLE public.resource_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_pathologies ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- (Alignées sur la table resources : lecture publique pour tous, écriture réservée au rôle de service)

-- Domains
CREATE POLICY resource_domains_public_select ON public.resource_domains
  FOR SELECT TO public USING (true);

CREATE POLICY resource_domains_service_write ON public.resource_domains
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tags
CREATE POLICY resource_tags_public_select ON public.resource_tags
  FOR SELECT TO public USING (true);

CREATE POLICY resource_tags_service_write ON public.resource_tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Pathologies
CREATE POLICY resource_pathologies_public_select ON public.resource_pathologies
  FOR SELECT TO public USING (true);

CREATE POLICY resource_pathologies_service_write ON public.resource_pathologies
  FOR ALL TO service_role USING (true) WITH CHECK (true);