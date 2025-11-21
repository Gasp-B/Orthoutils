-- Add slug support for domains and backfill existing rows.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE IF EXISTS domains ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS domains_slug_key ON domains (slug);

WITH generated AS (
  SELECT
    id,
    regexp_replace(regexp_replace(lower(unaccent(name)), '[^a-z0-9]+', '-', 'g'), '-+', '-', 'g') AS base_slug
  FROM domains
  WHERE slug IS NULL
),
ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
  FROM generated
),
deduped AS (
  SELECT
    id,
    CASE
      WHEN base_slug = '' THEN CONCAT('domaine-', encode(gen_random_bytes(4), 'hex'))
      WHEN rn = 1 THEN base_slug
      ELSE CONCAT(base_slug, '-', rn)
    END AS final_slug
  FROM ranked
)
UPDATE domains d
SET slug = deduped.final_slug
FROM deduped
WHERE d.id = deduped.id;

ALTER TABLE IF EXISTS domains ALTER COLUMN slug SET NOT NULL;
