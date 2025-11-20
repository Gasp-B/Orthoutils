-- Allow subsections to belong to multiple categories and introduce the shared "Nom" subsection.
CREATE TABLE IF NOT EXISTS section_subsections (
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subsection_id uuid NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (section_id, subsection_id)
);

-- Migrate existing one-to-many links into the join table before dropping the column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subsections' AND column_name = 'section_id'
  ) THEN
    INSERT INTO section_subsections (section_id, subsection_id)
    SELECT section_id, id FROM subsections
    ON CONFLICT (section_id, subsection_id) DO NOTHING;
  END IF;
END $$;

-- Remove the old uniqueness constraint tied to section_id.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'subsections'::regclass AND conname = 'subsections_section_id_name_key'
  ) THEN
    ALTER TABLE subsections DROP CONSTRAINT subsections_section_id_name_key;
  END IF;
END $$;

-- Drop the single-category foreign key to enable many-to-many relationships.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subsections' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE subsections DROP COLUMN section_id;
  END IF;
END $$;

-- Ensure subsection names remain unique globally.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'subsections'::regclass AND conname = 'subsections_name_key'
  ) THEN
    ALTER TABLE subsections ADD CONSTRAINT subsections_name_key UNIQUE (name);
  END IF;
END $$;

-- Seed the transversal "Nom" subsection that can attach to multiple categories.
INSERT INTO subsections (name, format_label, color_label, notes)
VALUES ('Nom', NULL, NULL, 'Sous-catégorie transversale pour nommer l''outil quel que soit le domaine.')
ON CONFLICT (name) DO NOTHING;

-- Attach "Nom" to every existing section to illustrate multi-category membership.
INSERT INTO section_subsections (section_id, subsection_id)
SELECT s.id, sub.id
FROM sections s
CROSS JOIN (SELECT id FROM subsections WHERE name = 'Nom') AS sub
ON CONFLICT (section_id, subsection_id) DO NOTHING;
