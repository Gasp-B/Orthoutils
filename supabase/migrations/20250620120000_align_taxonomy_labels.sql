-- Align taxonomy tables with label-based columns for domains and tags.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Domains: rename the legacy "name" column to "label" when needed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'domains'
      AND column_name = 'name'
  )
  THEN
    ALTER TABLE public.domains RENAME COLUMN name TO label;
  END IF;
END
$$;

-- Tags: rename the legacy "name" column to "label" when needed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'name'
  )
  THEN
    ALTER TABLE public.tags RENAME COLUMN name TO label;
  END IF;
END
$$;

-- Enforce non-null constraints on the label columns.
ALTER TABLE public.domains ALTER COLUMN label SET NOT NULL;
ALTER TABLE public.tags ALTER COLUMN label SET NOT NULL;
