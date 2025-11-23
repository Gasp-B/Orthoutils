-- Enforce RLS policies for catalog data with role-based visibility and moderation.
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') IN ('admin', 'editor');
$$;

CREATE OR REPLACE FUNCTION public.has_moderation_access()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.role() = 'service_role' OR public.is_admin_or_editor();
$$;

-- Ensure RLS stays enabled on all target tables.
ALTER TABLE IF EXISTS public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tools_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tools_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tools_catalog_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tests_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.domains_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_tags ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies to avoid conflicts.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, schemaname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'tools', 'tools_translations', 'tools_catalog', 'tools_catalog_translations',
        'tests', 'tests_translations', 'domains', 'domains_translations', 'test_domains',
        'tags', 'tags_translations', 'test_tags'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END$$;

-- Helper predicate for published visibility.
CREATE OR REPLACE FUNCTION public.can_view_status(target_status text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_moderation_access() OR target_status = 'published';
$$;

-- Tools
CREATE POLICY tools_select_by_role
ON public.tools
FOR SELECT
USING (public.can_view_status(status));

CREATE POLICY tools_manage_by_moderators
ON public.tools
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tools translations
CREATE POLICY tools_translations_select_by_role
ON public.tools_translations
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.tools t
    WHERE t.id = tools_translations.tool_id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY tools_translations_manage_by_moderators
ON public.tools_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tools catalog
CREATE POLICY tools_catalog_select_by_role
ON public.tools_catalog
FOR SELECT
USING (public.can_view_status(status));

CREATE POLICY tools_catalog_manage_by_moderators
ON public.tools_catalog
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tools catalog translations
CREATE POLICY tools_catalog_translations_select_by_role
ON public.tools_catalog_translations
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.tools_catalog tc
    WHERE tc.id = tools_catalog_translations.tool_catalog_id
      AND public.can_view_status(tc.status)
  )
);

CREATE POLICY tools_catalog_translations_manage_by_moderators
ON public.tools_catalog_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tests
CREATE POLICY tests_select_by_role
ON public.tests
FOR SELECT
USING (public.can_view_status(status));

CREATE POLICY tests_manage_by_moderators
ON public.tests
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tests translations
CREATE POLICY tests_translations_select_by_role
ON public.tests_translations
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.tests t
    WHERE t.id = tests_translations.test_id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY tests_translations_manage_by_moderators
ON public.tests_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Domains
CREATE POLICY domains_select_by_role
ON public.domains
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.test_domains td
    JOIN public.tests t ON t.id = td.test_id
    WHERE td.domain_id = domains.id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY domains_manage_by_moderators
ON public.domains
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Domains translations
CREATE POLICY domains_translations_select_by_role
ON public.domains_translations
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.test_domains td
    JOIN public.tests t ON t.id = td.test_id
    WHERE td.domain_id = domains_translations.domain_id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY domains_translations_manage_by_moderators
ON public.domains_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Test domains junction table
CREATE POLICY test_domains_select_by_role
ON public.test_domains
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.tests t
    WHERE t.id = test_domains.test_id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY test_domains_manage_by_moderators
ON public.test_domains
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tags
CREATE POLICY tags_select_by_role
ON public.tags
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.test_tags tt
    JOIN public.tests t ON t.id = tt.test_id
    WHERE tt.tag_id = tags.id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY tags_manage_by_moderators
ON public.tags
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tags translations
CREATE POLICY tags_translations_select_by_role
ON public.tags_translations
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.test_tags tt
    JOIN public.tests t ON t.id = tt.test_id
    WHERE tt.tag_id = tags_translations.tag_id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY tags_translations_manage_by_moderators
ON public.tags_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Test tags junction table
CREATE POLICY test_tags_select_by_role
ON public.test_tags
FOR SELECT
USING (
  public.has_moderation_access()
  OR EXISTS (
    SELECT 1
    FROM public.tests t
    WHERE t.id = test_tags.test_id
      AND public.can_view_status(t.status)
  )
);

CREATE POLICY test_tags_manage_by_moderators
ON public.test_tags
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());
