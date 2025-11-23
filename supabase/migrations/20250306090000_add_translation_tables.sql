-- Add translation tables for catalog structures and community tools.
CREATE TABLE IF NOT EXISTS sections_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  description text,
  UNIQUE (section_id, locale)
);

CREATE TABLE IF NOT EXISTS subsections_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id uuid NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  format_label text,
  color_label text,
  notes text,
  UNIQUE (subsection_id, locale)
);

CREATE TABLE IF NOT EXISTS tools_catalog_translations (
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

CREATE TABLE IF NOT EXISTS tools_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  type text NOT NULL,
  UNIQUE (tool_id, locale)
);

INSERT INTO sections_translations (section_id, locale, label, description)
SELECT id, 'fr', name, description FROM sections
ON CONFLICT (section_id, locale) DO NOTHING;

INSERT INTO subsections_translations (subsection_id, locale, label, format_label, color_label, notes)
SELECT id, 'fr', name, format_label, color_label, notes FROM subsections
ON CONFLICT (subsection_id, locale) DO NOTHING;

INSERT INTO tools_catalog_translations (tool_catalog_id, locale, title, category, description, notes, target_population)
SELECT id, 'fr', title, category, description, notes, target_population FROM tools_catalog
ON CONFLICT (tool_catalog_id, locale) DO NOTHING;

INSERT INTO tools_translations (tool_id, locale, name, category, type)
SELECT id, 'fr', name, category, type FROM tools
ON CONFLICT (tool_id, locale) DO NOTHING;

ALTER TABLE sections_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_catalog_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_translations ENABLE ROW LEVEL SECURITY;
