BEGIN;

CREATE TABLE IF NOT EXISTS public.population (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.population_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  population_id uuid NOT NULL REFERENCES public.population(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  population_characteristic text[] NOT NULL DEFAULT '{}'::text[],
  UNIQUE (population_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS population_translations_label_locale_key
  ON public.population_translations (label, locale);

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS population_id uuid REFERENCES public.population(id);

CREATE INDEX IF NOT EXISTS idx_tests_population_id
  ON public.tests (population_id);

WITH distinct_population AS (
  SELECT DISTINCT population AS label, locale
  FROM public.tests_translations
  WHERE population IS NOT NULL AND population <> ''
),
population_seed AS (
  SELECT gen_random_uuid() AS id, label, locale
  FROM distinct_population
),
inserted_populations AS (
  INSERT INTO public.population (id, created_at)
  SELECT id, timezone('utc', now())
  FROM population_seed
  ON CONFLICT (id) DO NOTHING
)
INSERT INTO public.population_translations (population_id, locale, label, population_characteristic)
SELECT id, locale, label, '{}'::text[]
FROM population_seed
ON CONFLICT (population_id, locale) DO NOTHING;

WITH population_map AS (
  SELECT DISTINCT ON (tt.test_id)
    tt.test_id,
    pt.population_id
  FROM public.tests_translations tt
  JOIN public.population_translations pt
    ON pt.locale = tt.locale
   AND pt.label = tt.population
  WHERE tt.population IS NOT NULL
    AND tt.population <> ''
  ORDER BY tt.test_id, CASE WHEN tt.locale = 'fr' THEN 0 ELSE 1 END
)
UPDATE public.tests t
SET population_id = pm.population_id
FROM population_map pm
WHERE t.id = pm.test_id;

ALTER TABLE public.tests_translations
  DROP COLUMN IF EXISTS population;

ALTER TABLE IF EXISTS public.population ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.population_translations ENABLE ROW LEVEL SECURITY;

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
  fr_population_characteristics text;
  en_population_characteristics text;
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
    string_agg(pt.label, ' ') FILTER (WHERE pt.locale = 'en'),
    string_agg(array_to_string(pt.population_characteristic, ' '), ' ') FILTER (WHERE pt.locale = 'fr'),
    string_agg(array_to_string(pt.population_characteristic, ' '), ' ') FILTER (WHERE pt.locale = 'en')
  INTO fr_population_labels, en_population_labels, fr_population_characteristics, en_population_characteristics
  FROM public.tests t
  JOIN public.population_translations pt ON t.population_id = pt.population_id
  WHERE t.id = p_test_id;

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
          fr_population_characteristics
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
          en_population_characteristics
        )
      ),
      'B'
    ) ||
    setweight(to_tsvector('french', coalesce(fr_descriptions, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(en_descriptions, '')), 'C');
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_population_translation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  FOR target_id IN
    SELECT t.id
    FROM public.tests t
    WHERE t.population_id = coalesce(NEW.population_id, OLD.population_id)
  LOOP
    PERFORM public.refresh_tests_fts_vector(target_id);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS population_translations_tests_fts_vector_refresh ON public.population_translations;
CREATE TRIGGER population_translations_tests_fts_vector_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.population_translations
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_population_translation();

UPDATE public.tests SET fts_vector = public.build_tests_fts_vector(id);

COMMIT;
