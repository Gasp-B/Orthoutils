import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { createSupabaseAdminClient, createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createTestWithRelations, updateTestWithRelations } from '@/lib/tests/mutations';
import { testsResponseSchema, type TestDto } from '@/lib/validation/tests';

type TestsBaseRow = {
  id: string;
  target_audience: 'child' | 'adult' | null;
  status: 'draft' | 'in_review' | 'published' | 'archived' | null;
  age_min_months: number | null;
  age_max_months: number | null;
  duration_minutes: number | null;
  is_standardized: boolean | null;
  buy_link: string | null;
  bibliography: unknown[] | null;
  created_at: string | null;
  updated_at: string | null;
};

type TestTranslationRow = {
  test_id: string;
  locale: string;
  name: string;
  slug: string;
  short_description: string | null;
  objective: string | null;
  population: string | null;
  materials: string | null;
  publisher: string | null;
  price_range: string | null;
  notes: string | null;
};

type DomainTranslationRow = { domain_id: string; locale: string; label: string; slug: string };
type ThemeTranslationRow = { theme_id: string; locale: string; label: string };
type TagTranslationRow = { tag_id: string; locale: string; label: string };
type TestDomainRow = { test_id: string; domain_id: string };
type TestThemeRow = { test_id: string; theme_id: string };
type TestTagRow = { test_id: string; tag_id: string };

function toIsoString(value: string | null): string {
  if (!value) {
    return new Date().toISOString();
  }

  return value;
}

function selectTranslation<T extends { locale: string }>(
  rows: T[],
  match: { locale: Locale; defaultLocale: Locale },
): T | undefined {
  const localized = rows.find((row) => row.locale === match.locale);

  if (localized) {
    return localized;
  }

  return rows.find((row) => row.locale === match.defaultLocale);
}

async function getTestsWithClient(
  supabase: SupabaseClient<Record<string, unknown>>,
  locale: Locale = defaultLocale,
): Promise<TestDto[]> {
  const { data: testRows, error: testsError } = await supabase
    .from('tests')
    .select(
      'id, target_audience, status, age_min_months, age_max_months, duration_minutes, is_standardized, buy_link, bibliography, created_at, updated_at',
    );

  if (testsError) {
    throw testsError;
  }

  const tests = (testRows ?? []) as TestsBaseRow[];

  if (tests.length === 0) {
    return [];
  }

  const testIds = tests.map((row) => row.id);

  const [testDomainsResult, testTagsResult, testThemesResult] = await Promise.all([
    supabase.from('test_domains').select('test_id, domain_id').in('test_id', testIds),
    supabase.from('test_tags').select('test_id, tag_id').in('test_id', testIds),
    supabase.from('test_themes').select('test_id, theme_id').in('test_id', testIds),
  ]);

  if (testDomainsResult.error) {
    throw testDomainsResult.error;
  }

  if (testTagsResult.error) {
    throw testTagsResult.error;
  }

  if (testThemesResult.error) {
    throw testThemesResult.error;
  }

  const testDomains = (testDomainsResult.data ?? []) as TestDomainRow[];
  const testTags = (testTagsResult.data ?? []) as TestTagRow[];
  const testThemes = (testThemesResult.data ?? []) as TestThemeRow[];

  const domainIds = Array.from(new Set(testDomains.map((relation) => relation.domain_id)));
  const tagIds = Array.from(new Set(testTags.map((relation) => relation.tag_id)));
  const themeIds = Array.from(new Set(testThemes.map((relation) => relation.theme_id)));

  const [translationsResult, domainsResult, tagsResult, themesResult] = await Promise.all([
    supabase
      .from('tests_translations')
      .select(
        'test_id, locale, name, slug, short_description, objective, population, materials, publisher, price_range, notes',
      )
      .in('test_id', testIds)
      .in('locale', [locale, defaultLocale]),
    domainIds.length > 0
      ? supabase.from('domains_translations').select('domain_id, locale, label, slug').in('domain_id', domainIds)
      : { data: [], error: null },
    tagIds.length > 0
      ? supabase.from('tags_translations').select('tag_id, locale, label').in('tag_id', tagIds)
      : { data: [], error: null },
    themeIds.length > 0
      ? supabase
          .from('theme_translations')
          .select('theme_id, locale, label')
          .in('theme_id', themeIds)
      : { data: [], error: null },
  ]);

  if (translationsResult.error) {
    throw translationsResult.error;
  }

  if (domainsResult.error) {
    throw domainsResult.error;
  }

  if (tagsResult.error) {
    throw tagsResult.error;
  }

  if (themesResult.error) {
    throw themesResult.error;
  }

  const translations = (translationsResult.data ?? []) as TestTranslationRow[];
  const domainTranslations = (domainsResult.data ?? []) as DomainTranslationRow[];
  const tagTranslations = (tagsResult.data ?? []) as TagTranslationRow[];
  const themeTranslations = (themesResult.data ?? []) as ThemeTranslationRow[];

  const domainsById = new Map<string, DomainTranslationRow[]>();
  for (const domainTranslation of domainTranslations) {
    const existing = domainsById.get(domainTranslation.domain_id) ?? [];
    existing.push(domainTranslation);
    domainsById.set(domainTranslation.domain_id, existing);
  }

  const tagsById = new Map<string, TagTranslationRow[]>();
  for (const tagTranslation of tagTranslations) {
    const existing = tagsById.get(tagTranslation.tag_id) ?? [];
    existing.push(tagTranslation);
    tagsById.set(tagTranslation.tag_id, existing);
  }

  const themesById = new Map<string, ThemeTranslationRow[]>();
  for (const themeTranslation of themeTranslations) {
    const existing = themesById.get(themeTranslation.theme_id) ?? [];
    existing.push(themeTranslation);
    themesById.set(themeTranslation.theme_id, existing);
  }

  const translationsByTest = new Map<string, TestTranslationRow[]>();
  for (const translation of translations) {
    const existing = translationsByTest.get(translation.test_id) ?? [];
    existing.push(translation);
    translationsByTest.set(translation.test_id, existing);
  }

  const domainsByTest = new Map<string, string[]>();
  for (const relation of testDomains) {
    const existing = domainsByTest.get(relation.test_id) ?? [];
    existing.push(relation.domain_id);
    domainsByTest.set(relation.test_id, existing);
  }

  const tagsByTest = new Map<string, string[]>();
  for (const relation of testTags) {
    const existing = tagsByTest.get(relation.test_id) ?? [];
    existing.push(relation.tag_id);
    tagsByTest.set(relation.test_id, existing);
  }

  const themesByTest = new Map<string, string[]>();
  for (const relation of testThemes) {
    const existing = themesByTest.get(relation.test_id) ?? [];
    existing.push(relation.theme_id);
    themesByTest.set(relation.test_id, existing);
  }

  const parsed = testsResponseSchema.parse({
    tests: tests.map((test) => {
      const translationsForTest = translationsByTest.get(test.id) ?? [];
      const selectedTranslation = selectTranslation(translationsForTest, { locale, defaultLocale });

      return {
        id: test.id,
        name: selectedTranslation?.name ?? '',
        slug: selectedTranslation?.slug ?? '',
        targetAudience: test.target_audience ?? 'child',
        status: test.status ?? 'draft',
        shortDescription: selectedTranslation?.short_description ?? null,
        objective: selectedTranslation?.objective ?? null,
        ageMinMonths: test.age_min_months,
        ageMaxMonths: test.age_max_months,
        population: selectedTranslation?.population ?? null,
        durationMinutes: test.duration_minutes,
        materials: selectedTranslation?.materials ?? null,
        isStandardized: Boolean(test.is_standardized),
        publisher: selectedTranslation?.publisher ?? null,
        priceRange: selectedTranslation?.price_range ?? null,
        buyLink: test.buy_link,
        notes: selectedTranslation?.notes ?? null,
        bibliography: Array.isArray(test.bibliography)
          ? test.bibliography.filter(
              (entry): entry is { label: string; url: string } =>
                typeof entry === 'object' &&
                !!entry &&
                'label' in entry &&
                'url' in entry &&
                typeof (entry as { label?: unknown }).label === 'string' &&
                typeof (entry as { url?: unknown }).url === 'string',
            )
          : [],
        createdAt: toIsoString(test.created_at ?? null),
        updatedAt: toIsoString(test.updated_at ?? null),
        domains: (domainsByTest.get(test.id) ?? [])
          .map((domainId) => selectTranslation(domainsById.get(domainId) ?? [], { locale, defaultLocale })?.label)
          .filter((label): label is string => Boolean(label)),
        themes: (themesByTest.get(test.id) ?? [])
          .map((themeId) => selectTranslation(themesById.get(themeId) ?? [], { locale, defaultLocale })?.label)
          .filter((label): label is string => Boolean(label)),
        tags: (tagsByTest.get(test.id) ?? [])
          .map((tagId) => selectTranslation(tagsById.get(tagId) ?? [], { locale, defaultLocale })?.label)
          .filter((label): label is string => Boolean(label)),
      } satisfies TestDto;
    }),
  });

  return parsed.tests;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;
    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createSupabaseAdminClient();
    const tests = await getTestsWithClient(adminClient, locale);

    return NextResponse.json(
      { tests },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch tests', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les tests';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const test = await createTestWithRelations(payload);

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error('Failed to create test with relations', error);
    const message = error instanceof Error ? error.message : "Impossible de créer le test";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const test = await updateTestWithRelations(payload);

    return NextResponse.json({ test }, { status: 200 });
  } catch (error) {
    console.error('Failed to update test with relations', error);
    const message = error instanceof Error ? error.message : "Impossible de mettre à jour le test";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
