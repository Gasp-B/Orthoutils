-- Create resource type taxonomy tables to support localized labels
CREATE TABLE IF NOT EXISTS resource_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_type_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type_id uuid NOT NULL REFERENCES resource_types(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS resource_type_translations_resource_type_id_locale_key
  ON resource_type_translations (resource_type_id, locale);

----------------------------------------------------------------------
-- Enable RLS
----------------------------------------------------------------------

ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_type_translations ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------------------
-- RLS POLICIES (aligned with other taxonomy tables)
----------------------------------------------------------------------

-- Public read access for catalogue usage
CREATE POLICY "Public read resource_types"
  ON resource_types
  FOR SELECT
  USING (true);

CREATE POLICY "Public read resource_type_translations"
  ON resource_type_translations
  FOR SELECT
  USING (true);

-- Authenticated users can manage taxonomy
CREATE POLICY "Authenticated modify resource_types"
  ON resource_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated modify resource_type_translations"
  ON resource_type_translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
