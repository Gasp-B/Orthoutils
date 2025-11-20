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
