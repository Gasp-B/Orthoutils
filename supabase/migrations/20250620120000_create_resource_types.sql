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
