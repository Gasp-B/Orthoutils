CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.clinical_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.clinical_profile_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_profile_id uuid NOT NULL REFERENCES public.clinical_profiles(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  UNIQUE (clinical_profile_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS clinical_profile_translations_label_locale_key
  ON public.clinical_profile_translations (label, locale);

CREATE TABLE IF NOT EXISTS public.test_clinical_profiles (
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  clinical_profile_id uuid NOT NULL REFERENCES public.clinical_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, clinical_profile_id)
);

WITH raw_labels AS (
  SELECT locale, unnest(population_characteristic) AS label
  FROM public.population_translations
  WHERE population_characteristic IS NOT NULL
  UNION ALL
  SELECT locale, unnest(population_characteristics) AS label
  FROM public.tests_translations
  WHERE population_characteristics IS NOT NULL
),
normalized AS (
  SELECT DISTINCT locale, trim(label) AS label
  FROM raw_labels
  WHERE label IS NOT NULL AND trim(label) <> ''
),
profile_seed AS (
  SELECT DISTINCT label, gen_random_uuid() AS id
  FROM normalized
),
insert_profiles AS (
  INSERT INTO public.clinical_profiles (id, created_at)
  SELECT id, timezone('utc', now()) FROM profile_seed
  ON CONFLICT DO NOTHING
),
insert_translations AS (
  INSERT INTO public.clinical_profile_translations (id, clinical_profile_id, locale, label)
  SELECT gen_random_uuid(), profile_seed.id, normalized.locale, normalized.label
  FROM normalized
  JOIN profile_seed ON profile_seed.label = normalized.label
  ON CONFLICT (label, locale) DO NOTHING
)
SELECT 1;

INSERT INTO public.test_clinical_profiles (test_id, clinical_profile_id)
SELECT DISTINCT tt.test_id, cpt.clinical_profile_id
FROM public.tests_translations tt
JOIN LATERAL unnest(tt.population_characteristics) AS raw_label ON true
JOIN public.clinical_profile_translations cpt
  ON cpt.label = trim(raw_label) AND cpt.locale = tt.locale
ON CONFLICT DO NOTHING;

ALTER TABLE IF EXISTS public.tests_translations
  DROP COLUMN IF EXISTS population_characteristics;

ALTER TABLE IF EXISTS public.population_translations
  DROP COLUMN IF EXISTS population_characteristic;

WITH population_seed AS (
  SELECT gen_random_uuid() AS id, 'child'::text AS audience, 'Enfant'::text AS fr_label, 'Child'::text AS en_label
  UNION ALL
  SELECT gen_random_uuid(), 'adult', 'Adulte', 'Adult'
),
insert_population AS (
  INSERT INTO public.population (id, created_at)
  SELECT id, timezone('utc', now()) FROM population_seed
  ON CONFLICT DO NOTHING
),
update_tests AS (
  UPDATE public.tests t
  SET population_id = population_seed.id
  FROM population_seed
  WHERE t.target_audience::text = population_seed.audience
),
delete_old AS (
  DELETE FROM public.population p
  WHERE p.id NOT IN (SELECT id FROM population_seed)
)
INSERT INTO public.population_translations (population_id, locale, label)
SELECT id, 'fr', fr_label FROM population_seed
UNION ALL
SELECT id, 'en', en_label FROM population_seed
ON CONFLICT (population_id, locale) DO UPDATE SET label = EXCLUDED.label;

CREATE OR REPLACE FUNCTION public.build_tests_fts_vector(p_test_id uuid)
RETURNS tsvector
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fr_names text;
  en_names text;
  fr_descriptions text;
  en_descriptions text;
  fr_tag_labels text;
  en_tag_labels text;
  fr_tag_synonyms text;
  en_tag_synonyms text;
  fr_theme_synonyms text;
  en_theme_synonyms text;
  fr_population_labels text;
  en_population_labels text;
  fr_clinical_profiles text;
  en_clinical_profiles text;
BEGIN
  SELECT
    string_agg(tt.name, ' ') FILTER (WHERE tt.locale = 'fr'),
    string_agg(tt.name, ' ') FILTER (WHERE tt.locale = 'en'),
    string_agg(coalesce(tt.short_description, '') || ' ' || coalesce(tt.objective, ''), ' ')
      FILTER (WHERE tt.locale = 'fr'),
    string_agg(coalesce(tt.short_description, '') || ' ' || coalesce(tt.objective, ''), ' ')
      FILTER (WHERE tt.locale = 'en')
  INTO fr_names, en_names, fr_descriptions, en_descriptions
  FROM public.tests_translations tt
  WHERE tt.test_id = p_test_id;

  SELECT
    string_agg(tt.label, ' ') FILTER (WHERE tt.locale = 'fr'),
    string_agg(tt.label, ' ') FILTER (WHERE tt.locale = 'en'),
    string_agg(array_to_string(tt.synonyms, ' '), ' ') FILTER (WHERE tt.locale = 'fr'),
    string_agg(array_to_string(tt.synonyms, ' '), ' ') FILTER (WHERE tt.locale = 'en')
  INTO fr_tag_labels, en_tag_labels, fr_tag_synonyms, en_tag_synonyms
  FROM public.test_tags jt
  JOIN public.tags_translations tt ON jt.tag_id = tt.tag_id
  WHERE jt.test_id = p_test_id;

  SELECT
    string_agg(array_to_string(tht.synonyms, ' '), ' ') FILTER (WHERE tht.locale = 'fr'),
    string_agg(array_to_string(tht.synonyms, ' '), ' ') FILTER (WHERE tht.locale = 'en')
  INTO fr_theme_synonyms, en_theme_synonyms
  FROM public.test_themes tth
  JOIN public.theme_translations tht ON tth.theme_id = tht.theme_id
  WHERE tth.test_id = p_test_id;

  SELECT
    string_agg(pt.label, ' ') FILTER (WHERE pt.locale = 'fr'),
    string_agg(pt.label, ' ') FILTER (WHERE pt.locale = 'en')
  INTO fr_population_labels, en_population_labels
  FROM public.tests t
  JOIN public.population_translations pt ON t.population_id = pt.population_id
  WHERE t.id = p_test_id;

  SELECT
    string_agg(cpt.label, ' ') FILTER (WHERE cpt.locale = 'fr'),
    string_agg(cpt.label, ' ') FILTER (WHERE cpt.locale = 'en')
  INTO fr_clinical_profiles, en_clinical_profiles
  FROM public.test_clinical_profiles tcp
  JOIN public.clinical_profile_translations cpt
    ON tcp.clinical_profile_id = cpt.clinical_profile_id
  WHERE tcp.test_id = p_test_id;

  RETURN
    setweight(to_tsvector('french', coalesce(fr_names, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(en_names, '')), 'A') ||
    setweight(
      to_tsvector(
        'french',
        concat_ws(
          ' ',
          fr_tag_labels,
          fr_tag_synonyms,
          fr_theme_synonyms,
          fr_population_labels,
          fr_clinical_profiles
        )
      ),
      'B'
    ) ||
    setweight(
      to_tsvector(
        'english',
        concat_ws(
          ' ',
          en_tag_labels,
          en_tag_synonyms,
          en_theme_synonyms,
          en_population_labels,
          en_clinical_profiles
        )
      ),
      'B'
    ) ||
    setweight(to_tsvector('french', coalesce(fr_descriptions, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(en_descriptions, '')), 'C');
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_clinical_profile_translation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  FOR target_id IN
    SELECT tcp.test_id
    FROM public.test_clinical_profiles tcp
    WHERE tcp.clinical_profile_id = coalesce(NEW.clinical_profile_id, OLD.clinical_profile_id)
  LOOP
    PERFORM public.refresh_tests_fts_vector(target_id);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_test_clinical_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_tests_fts_vector(coalesce(NEW.test_id, OLD.test_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS clinical_profile_translations_tests_fts_vector_refresh ON public.clinical_profile_translations;
CREATE TRIGGER clinical_profile_translations_tests_fts_vector_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.clinical_profile_translations
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_clinical_profile_translation();

DROP TRIGGER IF EXISTS test_clinical_profiles_tests_fts_vector_refresh ON public.test_clinical_profiles;
CREATE TRIGGER test_clinical_profiles_tests_fts_vector_refresh
AFTER INSERT OR DELETE ON public.test_clinical_profiles
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_test_clinical_profile();

ALTER TABLE IF EXISTS public.clinical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clinical_profile_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_clinical_profiles ENABLE ROW LEVEL SECURITY;

UPDATE public.tests SET fts_vector = public.build_tests_fts_vector(id);
