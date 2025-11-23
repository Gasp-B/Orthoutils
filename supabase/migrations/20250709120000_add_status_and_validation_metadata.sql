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

-- tools: convert status to enum and backfill to published for existing rows.
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

-- tests: convert status to enum and backfill to published for existing rows.
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

COMMIT;
