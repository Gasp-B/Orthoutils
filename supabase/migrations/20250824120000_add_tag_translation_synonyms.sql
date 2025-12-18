-- Add localized synonyms to tag translations to align with Drizzle schema and API types.
BEGIN;

ALTER TABLE public.tags_translations
  ADD COLUMN IF NOT EXISTS synonyms text[] NOT NULL DEFAULT '{}'::text[];

COMMIT;
