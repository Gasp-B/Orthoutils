BEGIN;

-- Create validation_status enum used across catalog tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'validation_status'
  ) THEN
    CREATE TYPE validation_status AS ENUM ('draft', 'in_review', 'published', 'archived');
  END IF;
END $$;

-- tools_catalog: normalize status values and convert to enum.
-- Drop policies that depend on the status column type to avoid ALTER TYPE errors.
DROP POLICY IF EXISTS tools_catalog_select_by_role ON public.tools_catalog;
DROP POLICY IF EXISTS tools_catalog_manage_by_moderators ON public.tools_catalog;
DROP POLICY IF EXISTS tools_catalog_translations_select_by_role ON public.tools_catalog_translations;
DROP POLICY IF EXISTS tools_catalog_translations_manage_by_moderators ON public.tools_catalog_translations;

ALTER TABLE public.tools_catalog DROP CONSTRAINT IF EXISTS tools_catalog_status_check;
ALTER TABLE public.tools_catalog
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Remove the existing text default before switching to the enum to avoid cast failures.
ALTER TABLE public.tools_catalog
  ALTER COLUMN status DROP DEFAULT;

UPDATE public.tools_catalog
SET status = CASE lower(trim(status))
  WHEN 'validé' THEN 'published'
  WHEN 'validée' THEN 'published'
  WHEN 'en cours de revue' THEN 'in_review'
  WHEN 'in_review' THEN 'in_review'
  WHEN 'communauté' THEN 'in_review'
  WHEN 'community' THEN 'in_review'
  WHEN 'archived' THEN 'archived'
  WHEN 'published' THEN 'published'
  WHEN 'draft' THEN 'draft'
  ELSE 'draft'
END;

ALTER TABLE public.tools_catalog
  ALTER COLUMN status TYPE validation_status USING status::validation_status,
  ALTER COLUMN status SET DEFAULT 'draft'::validation_status,
  ALTER COLUMN status SET NOT NULL;

-- Recreate policies after altering the column type.
CREATE POLICY tools_catalog_select_by_role
ON public.tools_catalog
FOR SELECT
USING (public.can_view_status(status));

CREATE POLICY tools_catalog_manage_by_moderators
ON public.tools_catalog
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

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

-- tools: convert status to enum and backfill to published for existing rows.
-- Drop policies that depend on the status column type to avoid ALTER TYPE errors.
DROP POLICY IF EXISTS tools_select_by_role ON public.tools;
DROP POLICY IF EXISTS tools_manage_by_moderators ON public.tools;
DROP POLICY IF EXISTS tools_translations_select_by_role ON public.tools_translations;
DROP POLICY IF EXISTS tools_translations_manage_by_moderators ON public.tools_translations;

ALTER TABLE public.tools DROP CONSTRAINT IF EXISTS tools_status_check;
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Remove the existing text default before switching to the enum to avoid cast failures.
ALTER TABLE public.tools
  ALTER COLUMN status DROP DEFAULT;

UPDATE public.tools
SET status = 'published';

ALTER TABLE public.tools
  ALTER COLUMN status TYPE validation_status USING status::validation_status,
  ALTER COLUMN status SET DEFAULT 'draft'::validation_status,
  ALTER COLUMN status SET NOT NULL;

-- Recreate policies after altering the column type.
CREATE POLICY tools_select_by_role
ON public.tools
FOR SELECT
USING (public.can_view_status(status));

CREATE POLICY tools_manage_by_moderators
ON public.tools
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

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

-- tests: convert status to enum and backfill to published for existing rows.
-- Drop policies that depend on the status column type to avoid ALTER TYPE errors.
DROP POLICY IF EXISTS tests_select_by_role ON public.tests;
DROP POLICY IF EXISTS tests_manage_by_moderators ON public.tests;
DROP POLICY IF EXISTS tests_translations_select_by_role ON public.tests_translations;
DROP POLICY IF EXISTS tests_translations_manage_by_moderators ON public.tests_translations;

ALTER TABLE public.tests DROP CONSTRAINT IF EXISTS tests_status_check;
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Remove the existing text default before switching to the enum to avoid cast failures.
ALTER TABLE public.tests
  ALTER COLUMN status DROP DEFAULT;

UPDATE public.tests
SET status = 'published';

ALTER TABLE public.tests
  ALTER COLUMN status TYPE validation_status USING status::validation_status,
  ALTER COLUMN status SET DEFAULT 'draft'::validation_status,
  ALTER COLUMN status SET NOT NULL;

-- Recreate policies after altering the column type.
CREATE POLICY tests_select_by_role
ON public.tests
FOR SELECT
USING (public.can_view_status(status));

CREATE POLICY tests_manage_by_moderators
ON public.tests
FOR ALL
USING (public.has_moderation_access())
WITH CHECK (public.has_moderation_access());

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

COMMIT;
