-- Schema snapshot for taxonomy storage and test catalog.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE sections_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  description text,
  UNIQUE (section_id, locale)
);

CREATE TABLE subsections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  format_label text,
  color_label text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE subsections_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id uuid NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  format_label text,
  color_label text,
  notes text,
  UNIQUE (subsection_id, locale)
);

CREATE TABLE section_subsections (
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subsection_id uuid NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (section_id, subsection_id)
);

-- Catalog of clinical tools and resources.
CREATE TABLE tools_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  category text NOT NULL,
  color_label text,
  tags text[] NOT NULL DEFAULT '{}',
  description text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  target_population text,
  status text NOT NULL DEFAULT 'Validé',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE tools_catalog_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_catalog_id uuid NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  notes text,
  target_population text,
  UNIQUE (tool_catalog_id, locale)
);

ALTER TABLE tools_catalog ENABLE ROW LEVEL SECURITY;

-- Community-submitted tools.
CREATE TABLE tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE tools_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  UNIQUE (tool_id, locale)
);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_catalog_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_translations ENABLE ROW LEVEL SECURITY;

-- Test catalog domain.
CREATE TABLE tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age_min_months int,
  age_max_months int,
  duration_minutes int,
  is_standardized boolean DEFAULT false,
  buy_link text,
  bibliography jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE tests_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  short_description text,
  objective text,
  population text,
  materials text,
  publisher text,
  price_range text,
  notes text,
  UNIQUE (test_id, locale),
  UNIQUE (slug, locale)
);

CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE domains_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  slug text NOT NULL,
  UNIQUE (domain_id, locale),
  UNIQUE (slug, locale)
);

CREATE TABLE test_domains (
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, domain_id)
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color_label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE tags_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  UNIQUE (tag_id, locale)
);

CREATE TABLE test_tags (
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, tag_id)
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_tags ENABLE ROW LEVEL SECURITY;
