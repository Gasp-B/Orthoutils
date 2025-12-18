-- Add FTS vector columns for catalog and tests to keep parity with Drizzle schema.
BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'tests'
    ) THEN
        ALTER TABLE public.tests
          ADD COLUMN IF NOT EXISTS fts_vector tsvector;

        CREATE INDEX IF NOT EXISTS idx_tests_fts_vector ON public.tests USING gin (fts_vector);
    ELSE
        RAISE NOTICE 'Skipping FTS vector addition: table public.tests does not exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'tools_catalog'
    ) THEN
        ALTER TABLE public.tools_catalog
          ADD COLUMN IF NOT EXISTS fts_vector tsvector;

        CREATE INDEX IF NOT EXISTS idx_tools_catalog_fts_vector ON public.tools_catalog USING gin (fts_vector);
    ELSE
        RAISE NOTICE 'Skipping FTS vector addition: table public.tools_catalog does not exist';
    END IF;
END;
$$;

COMMIT;
