-- Schema snapshot for taxonomy storage (sections, subsections, tags).
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

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color_label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE subsection_tags (
  subsection_id uuid NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (subsection_id, tag_id)
);

-- Seeded data (see migrations for full inserts):
-- Sections: Scanner (IA); Diagnostic; Bilan; OMF; Communication et cognition.
-- Subsections include Snobio, MAP, État alimentaire, Repérée facile, BOLIS, Alivios, Autonomie,
-- Besoins, Langage oral (enfants), Langage écrit, AVQ, Dysarthrie, Lésions bulbares,
-- Cognition générale, Fonction exécutive / mémoire, et la sous-catégorie transverse "Nom" reliée à plusieurs sections.
-- Tags: Dysarthrie (oral); Accompagnement; Communication; Langage oral; Langage écrit; Cognition; Neurodégénérescence.

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
