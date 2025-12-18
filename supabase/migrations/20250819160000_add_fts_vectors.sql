
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tests'
  ) THEN
    ALTER TABLE public.tests
      ADD COLUMN IF NOT EXISTS fts_vector tsvector;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tools_catalog'
  ) THEN
    ALTER TABLE public.tools_catalog
      ADD COLUMN IF NOT EXISTS fts_vector tsvector;
  END IF;
END$$;

-- Build weighted, locale-aware FTS vectors for tests
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

  RETURN
    setweight(to_tsvector('french', coalesce(fr_names, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(en_names, '')), 'A') ||
    setweight(
      to_tsvector(
        'french',
        concat_ws(' ', fr_tag_labels, fr_tag_synonyms, fr_theme_synonyms)
      ),
      'B'
    ) ||
    setweight(
      to_tsvector(
        'english',
        concat_ws(' ', en_tag_labels, en_tag_synonyms, en_theme_synonyms)
      ),
      'B'
    ) ||
    setweight(to_tsvector('french', coalesce(fr_descriptions, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(en_descriptions, '')), 'C');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tests_fts_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.fts_vector := public.build_tests_fts_vector(coalesce(NEW.id, OLD.id));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_vector(p_test_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tests t
  SET fts_vector = public.build_tests_fts_vector(p_test_id)
  WHERE t.id = p_test_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_translation()
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

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_tags()
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

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_tag_translation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  FOR target_id IN
    SELECT DISTINCT tt.test_id
    FROM public.test_tags tt
    WHERE tt.tag_id = coalesce(NEW.tag_id, OLD.tag_id)
  LOOP
    PERFORM public.refresh_tests_fts_vector(target_id);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tests_fts_from_theme_translation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  FOR target_id IN
    SELECT DISTINCT tt.test_id
    FROM public.test_themes tt
    WHERE tt.theme_id = coalesce(NEW.theme_id, OLD.theme_id)
  LOOP
    PERFORM public.refresh_tests_fts_vector(target_id);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tests_fts_vector_refresh ON public.tests;
CREATE TRIGGER tests_fts_vector_refresh
BEFORE INSERT OR UPDATE ON public.tests
FOR EACH ROW
EXECUTE FUNCTION public.set_tests_fts_vector();

DROP TRIGGER IF EXISTS tests_translations_fts_vector_refresh ON public.tests_translations;
CREATE TRIGGER tests_translations_fts_vector_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.tests_translations
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_translation();

DROP TRIGGER IF EXISTS test_tags_fts_vector_refresh ON public.test_tags;
CREATE TRIGGER test_tags_fts_vector_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.test_tags
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_tags();

DROP TRIGGER IF EXISTS tags_translations_tests_fts_vector_refresh ON public.tags_translations;
CREATE TRIGGER tags_translations_tests_fts_vector_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.tags_translations
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_tag_translation();

DROP TRIGGER IF EXISTS theme_translations_tests_fts_vector_refresh ON public.theme_translations;
CREATE TRIGGER theme_translations_tests_fts_vector_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.theme_translations
FOR EACH ROW
EXECUTE FUNCTION public.refresh_tests_fts_from_theme_translation();

-- Build weighted, locale-aware FTS vectors for tools catalog
CREATE OR REPLACE FUNCTION public.build_tools_catalog_fts_vector(p_tool_catalog_id uuid)
RETURNS tsvector
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fr_titles text;
  en_titles text;
  fr_descriptions text;
  en_descriptions text;
  fr_tag_labels text;
  en_tag_labels text;
  fr_tag_synonyms text;
  en_tag_synonyms text;
  tag_list text[];
BEGIN
  SELECT tags INTO tag_list
  FROM public.tools_catalog
  WHERE id = p_tool_catalog_id;

  SELECT
    string_agg(tct.title, ' ') FILTER (WHERE tct.locale = 'fr'),
    string_agg(tct.title, ' ') FILTER (WHERE tct.locale = 'en'),
    string_agg(
      concat_ws(' ', coalesce(tct.description, ''), coalesce(tct.target_population, '')),
      ' '
    ) FILTER (WHERE tct.locale = 'fr'),
    string_agg(
      concat_ws(' ', coalesce(tct.description, ''), coalesce(tct.target_population, '')),
      ' '
    ) FILTER (WHERE tct.locale = 'en')
  INTO fr_titles, en_titles, fr_descriptions, en_descriptions
  FROM public.tools_catalog_translations tct
  WHERE tct.tool_catalog_id = p_tool_catalog_id;

  IF tag_list IS NOT NULL THEN
    SELECT
      string_agg(tt.label, ' ') FILTER (WHERE tt.locale = 'fr'),
      string_agg(tt.label, ' ') FILTER (WHERE tt.locale = 'en'),
      string_agg(array_to_string(tt.synonyms, ' '), ' ') FILTER (WHERE tt.locale = 'fr'),
      string_agg(array_to_string(tt.synonyms, ' '), ' ') FILTER (WHERE tt.locale = 'en')
    INTO fr_tag_labels, en_tag_labels, fr_tag_synonyms, en_tag_synonyms
    FROM public.tags_translations tt
    WHERE
      tt.label = ANY(tag_list)
      OR tt.tag_id::text = ANY(tag_list)
      OR EXISTS (
        SELECT 1
        FROM unnest(tag_list) AS t(tag_value)
        WHERE tag_value = ANY(tt.synonyms)
      );
  END IF;

  RETURN
    setweight(to_tsvector('french', coalesce(fr_titles, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(en_titles, '')), 'A') ||
    setweight(
      to_tsvector(
        'french',
        concat_ws(' ', coalesce(fr_tag_labels, ''), coalesce(fr_tag_synonyms, ''))
      ),
      'B'
    ) ||
    setweight(
      to_tsvector(
        'english',
        concat_ws(' ', coalesce(en_tag_labels, ''), coalesce(en_tag_synonyms, ''))
      ),
      'B'
    ) ||
    setweight(to_tsvector('french', coalesce(fr_descriptions, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(en_descriptions, '')), 'C');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_tools_catalog_fts_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.fts_vector := public.build_tools_catalog_fts_vector(coalesce(NEW.id, OLD.id));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tools_catalog_fts_vector(p_tool_catalog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tools_catalog tc
  SET fts_vector = public.build_tools_catalog_fts_vector(p_tool_catalog_id)
  WHERE tc.id = p_tool_catalog_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tools_catalog_fts_from_translation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_tools_catalog_fts_vector(coalesce(NEW.tool_catalog_id, OLD.tool_catalog_id));
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_tools_catalog_fts_from_tag_translation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate_label text := coalesce(NEW.label, OLD.label);
  candidate_synonyms text[] := coalesce(NEW.synonyms, OLD.synonyms, '{}'::text[]);
  candidate_tag_id text := coalesce((NEW.tag_id)::text, (OLD.tag_id)::text);
BEGIN
  UPDATE public.tools_catalog tc
  SET fts_vector = public.build_tools_catalog_fts_vector(tc.id)
  WHERE
    (candidate_label IS NOT NULL AND candidate_label = ANY(tc.tags))
    OR (candidate_tag_id IS NOT NULL AND candidate_tag_id = ANY(tc.tags))
    OR EXISTS (
      SELECT 1
      FROM unnest(tc.tags) AS t(tag_value)
      WHERE tag_value = ANY(candidate_synonyms)
    );

  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tools_catalog'
  ) THEN
    DROP TRIGGER IF EXISTS tools_catalog_fts_vector_refresh ON public.tools_catalog;
    CREATE TRIGGER tools_catalog_fts_vector_refresh
    BEFORE INSERT OR UPDATE ON public.tools_catalog
    FOR EACH ROW
    EXECUTE FUNCTION public.set_tools_catalog_fts_vector();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tools_catalog_translations'
  ) THEN
    DROP TRIGGER IF EXISTS tools_catalog_translations_fts_vector_refresh ON public.tools_catalog_translations;
    CREATE TRIGGER tools_catalog_translations_fts_vector_refresh
    AFTER INSERT OR UPDATE OR DELETE ON public.tools_catalog_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.refresh_tools_catalog_fts_from_translation();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tags_translations'
  ) THEN
    DROP TRIGGER IF EXISTS tags_translations_tools_catalog_fts_vector_refresh ON public.tags_translations;
    CREATE TRIGGER tags_translations_tools_catalog_fts_vector_refresh
    AFTER INSERT OR UPDATE OR DELETE ON public.tags_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.refresh_tools_catalog_fts_from_tag_translation();
  END IF;
END$$;

-- Backfill existing rows
UPDATE public.tests SET fts_vector = public.build_tests_fts_vector(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tools_catalog'
  ) THEN
    UPDATE public.tools_catalog SET fts_vector = public.build_tools_catalog_fts_vector(id);
  END IF;
END$$;

-- Indexes for efficient search
CREATE INDEX IF NOT EXISTS idx_tests_fts_vector ON public.tests USING GIN (fts_vector);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tools_catalog'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tools_catalog_fts_vector ON public.tools_catalog USING GIN (fts_vector);
  END IF;
END$$;
