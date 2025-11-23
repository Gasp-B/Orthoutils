CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(9);

SET LOCAL role = service_role;
SET LOCAL request.jwt.claim.role = 'service_role';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

INSERT INTO auth.users (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE fixture_ids AS
WITH published_test AS (
  INSERT INTO public.tests (status, validated_by, validated_at)
  VALUES ('published', '00000000-0000-0000-0000-000000000001', timezone('utc', now()))
  RETURNING id
),
 draft_test AS (
  INSERT INTO public.tests (status)
  VALUES ('draft')
  RETURNING id
),
 published_domain AS (
  INSERT INTO public.domains DEFAULT VALUES
  RETURNING id
),
 draft_domain AS (
  INSERT INTO public.domains DEFAULT VALUES
  RETURNING id
),
 published_tag AS (
  INSERT INTO public.tags DEFAULT VALUES
  RETURNING id
),
 draft_tag AS (
  INSERT INTO public.tags DEFAULT VALUES
  RETURNING id
),
 published_catalog AS (
  INSERT INTO public.tools_catalog (title, category, tags, status, validated_by, validated_at)
  VALUES ('Catalogue publié', 'screening', ARRAY['neuro'], 'published', '00000000-0000-0000-0000-000000000001', timezone('utc', now()))
  RETURNING id
),
 draft_catalog AS (
  INSERT INTO public.tools_catalog (title, category, tags, status)
  VALUES ('Catalogue brouillon', 'screening', ARRAY['langage'], 'draft')
  RETURNING id
),
 published_tool AS (
  INSERT INTO public.tools (name, category, type, tags, source, status, validated_by, validated_at)
  VALUES ('Outil publié', 'assessment', 'form', ARRAY['memory'], 'https://example.com', 'published', '00000000-0000-0000-0000-000000000001', timezone('utc', now()))
  RETURNING id
),
 draft_tool AS (
  INSERT INTO public.tools (name, category, type, tags, source, status)
  VALUES ('Outil brouillon', 'assessment', 'form', ARRAY['executive'], 'https://example.org', 'draft')
  RETURNING id
)
SELECT
  (SELECT id FROM published_test) AS published_test,
  (SELECT id FROM draft_test) AS draft_test,
  (SELECT id FROM published_domain) AS published_domain,
  (SELECT id FROM draft_domain) AS draft_domain,
  (SELECT id FROM published_tag) AS published_tag,
  (SELECT id FROM draft_tag) AS draft_tag,
  (SELECT id FROM published_catalog) AS published_catalog,
  (SELECT id FROM draft_catalog) AS draft_catalog,
  (SELECT id FROM published_tool) AS published_tool,
  (SELECT id FROM draft_tool) AS draft_tool;

INSERT INTO public.tests_translations (test_id, locale, name, slug)
SELECT published_test, 'fr', 'Test publié', 'test-publie' FROM fixture_ids
UNION ALL
SELECT draft_test, 'fr', 'Test brouillon', 'test-brouillon' FROM fixture_ids;

INSERT INTO public.domains_translations (domain_id, locale, label, slug)
SELECT published_domain, 'fr', 'Domaine publié', 'domaine-publie' FROM fixture_ids
UNION ALL
SELECT draft_domain, 'fr', 'Domaine brouillon', 'domaine-brouillon' FROM fixture_ids;

INSERT INTO public.tags_translations (tag_id, locale, label)
SELECT published_tag, 'fr', 'Tag publié' FROM fixture_ids
UNION ALL
SELECT draft_tag, 'fr', 'Tag brouillon' FROM fixture_ids;

INSERT INTO public.test_domains (test_id, domain_id)
SELECT published_test, published_domain FROM fixture_ids
UNION ALL
SELECT draft_test, draft_domain FROM fixture_ids;

INSERT INTO public.test_tags (test_id, tag_id)
SELECT published_test, published_tag FROM fixture_ids
UNION ALL
SELECT draft_test, draft_tag FROM fixture_ids;

INSERT INTO public.tools_catalog_translations (tool_catalog_id, locale, title, category)
SELECT published_catalog, 'fr', 'Outil catalogue publié', 'screening' FROM fixture_ids
UNION ALL
SELECT draft_catalog, 'fr', 'Outil catalogue brouillon', 'screening' FROM fixture_ids;

INSERT INTO public.tools_translations (tool_id, locale, name, category, type)
SELECT published_tool, 'fr', 'Traduction outil publié', 'assessment', 'form' FROM fixture_ids
UNION ALL
SELECT draft_tool, 'fr', 'Traduction outil brouillon', 'assessment', 'form' FROM fixture_ids;

SET LOCAL role = anon;
SET LOCAL request.jwt.claim.role = 'anon';

SELECT results_eq(
  $$ SELECT coalesce(array_agg(id ORDER BY id), '{}') FROM public.tests $$,
  $$ SELECT ARRAY[(SELECT published_test FROM fixture_ids)] $$,
  'Anon users only see published tests'
);

SELECT results_eq(
  $$ SELECT coalesce(array_agg(label ORDER BY label), '{}') FROM public.domains_translations $$,
  $$ SELECT ARRAY['Domaine publié'] $$,
  'Anon taxonomy results are limited to published tests'
);

SELECT results_eq(
  $$ SELECT coalesce(array_agg(id ORDER BY id), '{}') FROM public.tools_catalog $$,
  $$ SELECT ARRAY[(SELECT published_catalog FROM fixture_ids)] $$,
  'Anon users only see published catalog tools'
);

SELECT results_eq(
  $$ SELECT coalesce(array_agg(id ORDER BY id), '{}') FROM public.tools $$,
  $$ SELECT ARRAY[(SELECT published_tool FROM fixture_ids)] $$,
  'Anon users only see published community tools'
);

SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.role = 'authenticated';

SELECT results_eq(
  $$ SELECT coalesce(array_agg(id ORDER BY id), '{}') FROM public.tests $$,
  $$ SELECT ARRAY[(SELECT published_test FROM fixture_ids)] $$,
  'Authenticated users also see only published tests'
);

SET LOCAL request.jwt.claim.role = 'editor';

SELECT results_eq(
  $$ SELECT coalesce(array_agg(id ORDER BY id), '{}') FROM public.tests $$,
  $$ SELECT (SELECT ARRAY[published_test, draft_test] FROM fixture_ids) $$,
  'Editors can see draft and published tests'
);

SELECT results_eq(
  $$ SELECT coalesce(array_agg(label ORDER BY label), '{}') FROM public.tags_translations $$,
  $$ SELECT ARRAY['Tag brouillon', 'Tag publié'] $$,
  'Editors can view taxonomy linked to drafts'
);

SET LOCAL request.jwt.claim.role = 'admin';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

SELECT is(
  (UPDATE public.tests
    SET status = 'published', validated_by = '00000000-0000-0000-0000-000000000001', validated_at = timezone('utc', now())
    WHERE id = (SELECT draft_test FROM fixture_ids)
    RETURNING status)::text,
  'published',
  'Admins can publish draft tests with validation metadata'
);

SELECT is(
  (UPDATE public.tools_catalog
    SET status = 'archived', validated_by = NULL, validated_at = NULL
    WHERE id = (SELECT draft_catalog FROM fixture_ids)
    RETURNING status)::text,
  'archived',
  'Admins can archive catalog tools'
);

SELECT * FROM finish();

ROLLBACK;
