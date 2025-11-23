-- Align remote schema with theoretical taxonomy and tool catalog definitions.

-- Ensure validation_status enum exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'validation_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.validation_status AS ENUM ('draft', 'in_review', 'published', 'archived');
  END IF;
END $$;

-- Add missing lifecycle metadata to tests.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.tests
      ADD COLUMN status public.validation_status NOT NULL DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'validated_by'
  ) THEN
    ALTER TABLE public.tests
      ADD COLUMN validated_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'validated_at'
  ) THEN
    ALTER TABLE public.tests
      ADD COLUMN validated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.tests
      ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Translation table for sections.
CREATE TABLE IF NOT EXISTS public.sections_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  description text,
  UNIQUE (section_id, locale)
);

-- Translation table for subsections.
CREATE TABLE IF NOT EXISTS public.subsections_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id uuid NOT NULL REFERENCES public.subsections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  format_label text,
  color_label text,
  notes text,
  UNIQUE (subsection_id, locale)
);

-- Catalog of validated tools.
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
  status public.validation_status NOT NULL DEFAULT 'draft',
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (title)
);

-- Translations for tools_catalog entries.
CREATE TABLE IF NOT EXISTS public.tools_catalog_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_catalog_id uuid NOT NULL REFERENCES public.tools_catalog(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  notes text,
  target_population text,
  UNIQUE (tool_catalog_id, locale)
);

-- Community-submitted tools.
CREATE TABLE IF NOT EXISTS public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  source text NOT NULL,
  status public.validation_status NOT NULL DEFAULT 'draft',
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Translations for community tools.
CREATE TABLE IF NOT EXISTS public.tools_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  UNIQUE (tool_id, locale)
);

-- Ensure RLS is enabled where expected.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sections_translations') THEN
    ALTER TABLE public.sections_translations ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subsections_translations') THEN
    ALTER TABLE public.subsections_translations ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tools_catalog') THEN
    ALTER TABLE public.tools_catalog ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tools_catalog_translations') THEN
    ALTER TABLE public.tools_catalog_translations ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tools') THEN
    ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tools_translations') THEN
    ALTER TABLE public.tools_translations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
