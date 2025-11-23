-- Add status column to tests ahead of RLS policies that expect it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tests'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.tests
      ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;
END$$;
