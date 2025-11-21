-- Schema snapshot for taxonomy storage and test catalog.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE subsections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  format_label text,
  color_label text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
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

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Test catalog domain.
CREATE TABLE tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text,
  objective text,
  age_min_months int,
  age_max_months int,
  population text,
  duration_minutes int,
  materials text,
  is_standardized boolean DEFAULT false,
  publisher text,
  price_range text,
  buy_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE NOT NULL
);

CREATE TABLE test_domains (
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, domain_id)
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE
);

CREATE TABLE test_tags (
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, tag_id)
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_tags ENABLE ROW LEVEL SECURITY;
