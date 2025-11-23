-- Ensure core catalog tables exist before translation and status migrations.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Base catalog of validated tools.
CREATE TABLE IF NOT EXISTS public.tools_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  color_label text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  description text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  target_population text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (title)
);

-- Community-submitted tools.
CREATE TABLE IF NOT EXISTS public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  source text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Ensure base indexes exist for ordering.
CREATE INDEX IF NOT EXISTS idx_tools_catalog_created_at ON public.tools_catalog (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON public.tools (created_at DESC);
