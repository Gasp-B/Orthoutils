-- Seed taxonomy for sections, subsections, and tags based on initial catalog grid.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS subsections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  format_label text,
  color_label text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (section_id, name)
);

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color_label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS subsection_tags (
  subsection_id uuid NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (subsection_id, tag_id)
);

-- Top-level sections inspired by the image structure.
INSERT INTO sections (name, description)
VALUES
  ('Scanner (IA)', 'Outils automatiques de pré-analyse en langage.'),
  ('Diagnostic', 'Supports pour orienter le diagnostic initial.'),
  ('Bilan', 'Batteries et protocoles de bilan.'),
  ('OMF', 'Outils dédiés à la sphère orofaciale.'),
  ('Communication et cognition', 'Repères transverses autour du langage, de la communication et de la cognition.')
ON CONFLICT (name) DO NOTHING;

-- Subsections derived from the grid; format_label/color_label keep the color codes visible in the mockup.
INSERT INTO subsections (section_id, name, format_label, color_label, notes)
VALUES
  ((SELECT id FROM sections WHERE name = 'Scanner (IA)'), 'Langage (scanner IA)', NULL, NULL, 'Repérage automatique des signaux linguistiques.'),
  ((SELECT id FROM sections WHERE name = 'Diagnostic'), 'Bilan étiologique', NULL, NULL, 'Grille pour situer l''origine des troubles.'),
  ((SELECT id FROM sections WHERE name = 'Bilan'), 'Snobio', 'Rouge', 'Rouge', 'Bilan ciblé dysarthrie (oral).'),
  ((SELECT id FROM sections WHERE name = 'Bilan'), 'MAP', 'Rouge', 'Rouge', 'Protocole de bilan associé.'),
  ((SELECT id FROM sections WHERE name = 'OMF'), 'État alimentaire', 'Orange', 'Orange', NULL),
  ((SELECT id FROM sections WHERE name = 'OMF'), 'Repérée facile', 'Orange', 'Orange', NULL),
  ((SELECT id FROM sections WHERE name = 'OMF'), 'BOLIS', 'Orange', 'Orange', NULL),
  ((SELECT id FROM sections WHERE name = 'OMF'), 'Alivios', 'Orange', 'Orange', NULL),
  ((SELECT id FROM sections WHERE name = 'OMF'), 'Autonomie', NULL, NULL, 'Suivi de l''autonomie en OMF.'),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Besoins', 'Bleu', 'Bleu', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Langage oral (enfants)', 'Vert', 'Vert', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Langage écrit', 'Vert', 'Vert', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'AVQ', 'Vert', 'Vert', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Dysarthrie', 'Vert', 'Vert', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Lésions bulbares', 'Rouge', 'Rouge', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Cognition générale', 'Jaune', 'Jaune', NULL),
  ((SELECT id FROM sections WHERE name = 'Communication et cognition'), 'Fonction exécutive / mémoire', 'Jaune', 'Jaune', NULL)
ON CONFLICT (section_id, name) DO NOTHING;

-- Tags present in the mockup grid.
INSERT INTO tags (name, color_label)
VALUES
  ('Dysarthrie (oral)', 'Rouge'),
  ('Accompagnement', 'Orange'),
  ('Communication', 'Vert'),
  ('Langage oral', 'Vert'),
  ('Langage écrit', 'Vert'),
  ('Cognition', 'Jaune'),
  ('Neurodégénérescence', 'Vert')
ON CONFLICT (name) DO NOTHING;

-- Attach tags to the subsections they belong to.
WITH links AS (
  SELECT s.id AS subsection_id, t.id AS tag_id
  FROM (VALUES
    ('Snobio', 'Dysarthrie (oral)'),
    ('Autonomie', 'Accompagnement'),
    ('Autonomie', 'Communication'),
    ('Besoins', 'Langage oral'),
    ('Besoins', 'Communication'),
    ('Langage oral (enfants)', 'Langage oral'),
    ('Langage oral (enfants)', 'Communication'),
    ('Langage écrit', 'Langage écrit'),
    ('Langage écrit', 'Communication'),
    ('AVQ', 'Cognition'),
    ('AVQ', 'Neurodégénérescence'),
    ('Dysarthrie', 'Communication'),
    ('Lésions bulbares', 'Cognition'),
    ('Lésions bulbares', 'Communication'),
    ('Cognition générale', 'Cognition'),
    ('Fonction exécutive / mémoire', 'Cognition')
  ) AS mapping(subsection_name, tag_name)
  JOIN subsections s ON s.name = mapping.subsection_name
  JOIN tags t ON t.name = mapping.tag_name
)
INSERT INTO subsection_tags (subsection_id, tag_id)
SELECT subsection_id, tag_id FROM links
ON CONFLICT DO NOTHING;
