BEGIN;

-- Helpers for role-based access control.
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

CREATE OR REPLACE FUNCTION public.can_view_status(target_status validation_status)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_moderation_access() OR target_status = 'published';
$$;

-- Ensure RLS stays enabled.
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

-- Shared validation check for moderation writes on status-bearing tables.
CREATE OR REPLACE FUNCTION public.can_write_status_row(new_status validation_status, new_validated_by uuid, new_validated_at timestamptz)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    public.has_moderation_access()
    AND (
      (new_status = 'published' AND new_validated_by IS NOT NULL AND new_validated_at IS NOT NULL)
      OR (new_status <> 'published' AND new_validated_by IS NULL AND new_validated_at IS NULL)
    );
$$;

-- Tools
CREATE POLICY tools_select_published
ON public.tools
FOR SELECT
USING (status = 'published');

CREATE POLICY tools_select_moderators
ON public.tools
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tools_manage_moderators
ON public.tools
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.can_write_status_row(status, validated_by, validated_at));

-- Tools translations
CREATE POLICY tools_translations_select_published
ON public.tools_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tools t
    WHERE t.id = tools_translations.tool_id
      AND t.status = 'published'
  )
);

CREATE POLICY tools_translations_select_moderators
ON public.tools_translations
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tools_translations_manage_moderators
ON public.tools_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tools catalog
CREATE POLICY tools_catalog_select_published
ON public.tools_catalog
FOR SELECT
USING (status = 'published');

CREATE POLICY tools_catalog_select_moderators
ON public.tools_catalog
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tools_catalog_manage_moderators
ON public.tools_catalog
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.can_write_status_row(status, validated_by, validated_at));

-- Tools catalog translations
CREATE POLICY tools_catalog_translations_select_published
ON public.tools_catalog_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tools_catalog tc
    WHERE tc.id = tools_catalog_translations.tool_catalog_id
      AND tc.status = 'published'
  )
);

CREATE POLICY tools_catalog_translations_select_moderators
ON public.tools_catalog_translations
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tools_catalog_translations_manage_moderators
ON public.tools_catalog_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tests
CREATE POLICY tests_select_published
ON public.tests
FOR SELECT
USING (status = 'published');

CREATE POLICY tests_select_moderators
ON public.tests
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tests_manage_moderators
ON public.tests
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.can_write_status_row(status, validated_by, validated_at));

-- Tests translations
CREATE POLICY tests_translations_select_published
ON public.tests_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tests t
    WHERE t.id = tests_translations.test_id
      AND t.status = 'published'
  )
);

CREATE POLICY tests_translations_select_moderators
ON public.tests_translations
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tests_translations_manage_moderators
ON public.tests_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Domains
CREATE POLICY domains_select_published
ON public.domains
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.test_domains td
    JOIN public.tests t ON t.id = td.test_id
    WHERE td.domain_id = domains.id
      AND t.status = 'published'
  )
);

CREATE POLICY domains_select_moderators
ON public.domains
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY domains_manage_moderators
ON public.domains
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Domains translations
CREATE POLICY domains_translations_select_published
ON public.domains_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.test_domains td
    JOIN public.tests t ON t.id = td.test_id
    WHERE td.domain_id = domains_translations.domain_id
      AND t.status = 'published'
  )
);

CREATE POLICY domains_translations_select_moderators
ON public.domains_translations
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY domains_translations_manage_moderators
ON public.domains_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Test domains
CREATE POLICY test_domains_select_published
ON public.test_domains
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tests t
    WHERE t.id = test_domains.test_id
      AND t.status = 'published'
  )
);

CREATE POLICY test_domains_select_moderators
ON public.test_domains
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY test_domains_manage_moderators
ON public.test_domains
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tags
CREATE POLICY tags_select_published
ON public.tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.test_tags tt
    JOIN public.tests t ON t.id = tt.test_id
    WHERE tt.tag_id = tags.id
      AND t.status = 'published'
  )
);

CREATE POLICY tags_select_moderators
ON public.tags
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tags_manage_moderators
ON public.tags
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Tags translations
CREATE POLICY tags_translations_select_published
ON public.tags_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.test_tags tt
    JOIN public.tests t ON t.id = tt.test_id
    WHERE tt.tag_id = tags_translations.tag_id
      AND t.status = 'published'
  )
);

CREATE POLICY tags_translations_select_moderators
ON public.tags_translations
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY tags_translations_manage_moderators
ON public.tags_translations
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

-- Test tags
CREATE POLICY test_tags_select_published
ON public.test_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tests t
    WHERE t.id = test_tags.test_id
      AND t.status = 'published'
  )
);

CREATE POLICY test_tags_select_moderators
ON public.test_tags
FOR SELECT
USING (public.has_moderation_access());

CREATE POLICY test_tags_manage_moderators
ON public.test_tags
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

COMMIT;
