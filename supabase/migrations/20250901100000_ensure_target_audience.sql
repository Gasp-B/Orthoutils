DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'target_audience'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.target_audience AS ENUM ('child', 'adult');
  END IF;
END
$$;

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS target_audience public.target_audience NOT NULL DEFAULT 'child';
