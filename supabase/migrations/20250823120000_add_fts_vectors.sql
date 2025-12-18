-- Add FTS vector columns for catalog and tests to keep parity with Drizzle schema.
BEGIN;

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS fts_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_tests_fts_vector ON public.tests USING gin (fts_vector);

ALTER TABLE public.tools_catalog
  ADD COLUMN IF NOT EXISTS fts_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_tools_catalog_fts_vector ON public.tools_catalog USING gin (fts_vector);

COMMIT;
