-- Add localized synonyms to tag translations
ALTER TABLE IF EXISTS tags_translations
  ADD COLUMN IF NOT EXISTS synonyms text[] NOT NULL DEFAULT '{}'::text[];
