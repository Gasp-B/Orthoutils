-- Harmonise le catalogue d'outils avec l'interface Next.js et applique les règles RLS.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE IF EXISTS tools_catalog
  ADD COLUMN IF NOT EXISTS target_population text;

ALTER TABLE IF EXISTS tools_catalog
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Validé';

UPDATE tools_catalog
SET target_population = COALESCE(target_population, 'Tous publics');

UPDATE tools_catalog
SET status = COALESCE(status, 'Validé');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tools_catalog_status_check'
  ) THEN
    ALTER TABLE tools_catalog
    ADD CONSTRAINT tools_catalog_status_check CHECK (status IN ('Validé', 'En cours de revue', 'Communauté'));
  END IF;
END $$;

ALTER TABLE tools_catalog ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'tools_catalog_public_read'
  ) THEN
    CREATE POLICY tools_catalog_public_read
    ON tools_catalog FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'tools_catalog_service_manage'
  ) THEN
    CREATE POLICY tools_catalog_service_manage
    ON tools_catalog FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tools_catalog_created_at ON tools_catalog (created_at DESC);
