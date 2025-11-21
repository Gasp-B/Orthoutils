-- Ensure the taxonomy tags table matches the Drizzle schema (name-based) and keeps RLS disabled for catalog access.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color_label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- If an old "label" column exists, align it with the expected "name" column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'label'
  ) THEN
    EXECUTE 'ALTER TABLE public.tags RENAME COLUMN label TO name';
  END IF;
END
$$;

-- Enforce non-null name values and keep a single unique constraint on the normalized column.
ALTER TABLE public.tags
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT timezone('utc', now());

-- Keep the tags table readable/writable by disabling RLS (policies are not required for public taxonomy data).
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
