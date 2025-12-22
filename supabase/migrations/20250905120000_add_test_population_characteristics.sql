ALTER TABLE IF EXISTS public.tests_translations
  ADD COLUMN IF NOT EXISTS population_characteristics text[] NOT NULL DEFAULT '{}'::text[];
