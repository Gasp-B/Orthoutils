-- Add localized synonyms to domains to simplify search
ALTER TABLE domains_translations
  ADD COLUMN IF NOT EXISTS synonyms text[] NOT NULL DEFAULT '{}'::text[];
