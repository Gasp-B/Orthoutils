-- 01_create_pathologies_full_idempotent.sql

----------------------------------------------------------------------
-- TABLE : pathologies
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pathologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

----------------------------------------------------------------------
-- TABLE : pathology_translations
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pathology_translations (
  pathology_id uuid NOT NULL REFERENCES pathologies(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  description text,
  synonyms text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (pathology_id, locale)
);

----------------------------------------------------------------------
-- TABLE : test_pathologies (relation n-n entre tests et pathologies)
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS test_pathologies (
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  pathology_id uuid NOT NULL REFERENCES pathologies(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, pathology_id)
);

----------------------------------------------------------------------
-- Activer RLS (idempotent)
----------------------------------------------------------------------

ALTER TABLE pathologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathology_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_pathologies ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------------------
-- RLS POLICIES
-- (Alignées sur celles de tests / domains / tags)
----------------------------------------------------------------------

-- Lecture publique (catalogue accessible)
CREATE POLICY "Public read pathologies"
  ON pathologies
  FOR SELECT
  USING (true);

CREATE POLICY "Public read pathology_translations"
  ON pathology_translations
  FOR SELECT
  USING (true);

CREATE POLICY "Public read test_pathologies"
  ON test_pathologies
  FOR SELECT
  USING (true);

-- Gestion complète pour les utilisateurs authentifiés
CREATE POLICY "Authenticated modify pathologies"
  ON pathologies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated modify pathology_translations"
  ON pathology_translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated modify test_pathologies"
  ON test_pathologies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
