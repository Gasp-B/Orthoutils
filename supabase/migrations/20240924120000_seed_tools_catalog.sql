-- Tools catalog for orthophonie resources
CREATE TABLE IF NOT EXISTS tools (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Questionnaire',
  population text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Communauté',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tools_set_updated_at ON tools;
CREATE TRIGGER tools_set_updated_at
BEFORE UPDATE ON tools
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE IF EXISTS tools ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tools' AND polname = 'Allow tools read access'
  ) THEN
    CREATE POLICY "Allow tools read access" ON tools
      FOR SELECT
      USING (true);
  END IF;
END
$$;

INSERT INTO tools (id, name, description, category, population, tags, status)
VALUES
  (
    'bdae',
    'Boston Diagnostic Aphasia Examination',
    'Évalue les troubles du langage chez les adultes avec modules d''expression, compréhension et lecture.',
    'Test standardisé',
    'Adultes',
    ARRAY['aphasie', 'langage', 'diagnostic'],
    'Validé'
  ),
  (
    'edo',
    'ELO - Évaluation du Langage Oral',
    'Questionnaire modulable pour le dépistage rapide chez l''enfant en cabinet ou à l''école.',
    'Questionnaire',
    'Enfants 3-10 ans',
    ARRAY['dépistage', 'langage oral'],
    'En cours de revue'
  ),
  (
    'logico',
    'LOGICO-Suivi',
    'Tableau de bord collaboratif pour suivre les plans de soins, notes de séances et exercices assignés.',
    'Suivi patient',
    'Tous publics',
    ARRAY['suivi', 'collaboration', 'progression'],
    'Communauté'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  population = EXCLUDED.population,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status;
