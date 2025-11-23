BEGIN;

-- Update tools_catalog status semantics and metadata.
ALTER TABLE tools_catalog DROP CONSTRAINT IF EXISTS tools_catalog_status_check;

ALTER TABLE tools_catalog
  ALTER COLUMN status SET DEFAULT 'draft';

UPDATE tools_catalog
SET status = CASE lower(trim(status))
  WHEN 'validé' THEN 'published'
  WHEN 'validée' THEN 'published'
  WHEN 'en cours de revue' THEN 'draft'
  WHEN 'communauté' THEN 'draft'
  WHEN 'draft' THEN 'draft'
  WHEN 'published' THEN 'published'
  WHEN 'archived' THEN 'archived'
  ELSE 'draft'
END;

ALTER TABLE tools_catalog
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE tools_catalog
  ADD CONSTRAINT tools_catalog_status_check CHECK (status IN ('draft', 'published', 'archived'));

-- Add status and validation metadata to tests.
ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE tests
  ADD CONSTRAINT IF NOT EXISTS tests_status_check CHECK (status IN ('draft', 'published', 'archived'));

-- Add status and validation metadata to tools.
ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE tools
  ADD CONSTRAINT IF NOT EXISTS tools_status_check CHECK (status IN ('draft', 'published', 'archived'));

COMMIT;
