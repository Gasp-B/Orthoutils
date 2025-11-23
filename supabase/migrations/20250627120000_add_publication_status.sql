-- Align publication status across catalog tables and add validation metadata.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publication_status') THEN
    CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END $$;

ALTER TABLE tools_catalog DROP CONSTRAINT IF EXISTS tools_catalog_status_check;

UPDATE tools_catalog
SET status = CASE
  WHEN status IS NULL THEN 'published'
  WHEN lower(trim(status)) IN ('validé', 'validated') THEN 'published'
  WHEN lower(trim(status)) IN ('en cours de revue', 'under review', 'review', 'draft') THEN 'draft'
  WHEN lower(trim(status)) IN ('communauté', 'community', 'published') THEN 'published'
  WHEN lower(trim(status)) = 'archived' THEN 'archived'
  ELSE 'published'
END;

ALTER TABLE tools_catalog
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE publication_status USING status::publication_status,
  ALTER COLUMN status SET DEFAULT 'published';

ALTER TABLE tools_catalog
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS status publication_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS status publication_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;
