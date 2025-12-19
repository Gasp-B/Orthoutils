import type { Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domainsTranslations,
  tagsTranslations,
  resourceDomains,
  resourceTags,
  resourceThemes,
  resources,
  resourcesTranslations,
  testDomains,
  testTags,
  testThemes,
  tests,
  testsTranslations,
  themeTranslations,
} from '@/lib/db/schema';
import type { SearchGroup, SearchHubProps, SearchQueryInput, SearchResult } from '@/lib/search/types';
import { searchLocaleSchema, searchPaginationSchema, searchQuerySchema } from '@/lib/validation/search';
import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

export async function searchAll(query: string, locale: Locale) {
  const db = await getDb();
  const normalizedQuery = searchQuerySchema.parse(query.trim());
  
  // Recherche dans les Tests (Anciennement Tools)
  const testsResults = await db
    .select({
      id: tests.id,
      name: testsTranslations.name,
      slug: testsTranslations.slug,
      description: testsTranslations.shortDescription,
    })
    .from(tests)
    .innerJoin(testsTranslations, eq(tests.id, testsTranslations.testId))
    .where(
      and(
        eq(testsTranslations.locale, locale),
        eq(tests.status, 'published'),
        or(
          ilike(testsTranslations.name, `%${normalizedQuery}%`),
          ilike(testsTranslations.shortDescription, `%${normalizedQuery}%`),
          // Utilisation du vecteur FTS pour la performance
          sql`${tests.ftsVector} @@ to_tsquery('french', ${normalizedQuery})`
        )
      )
    )
    .limit(10);

  return { tests: testsResults };
}

const emptyResults: string[] = [];

function collectGroupedValues(rows: Array<{ id: string; value: string }>) {
  const grouped = new Map<string, string[]>();

  for (const row of rows) {
    const list = grouped.get(row.id);
    if (list) {
      list.push(row.value);
    } else {
      grouped.set(row.id, [row.value]);
    }
  }

  return grouped;
}

function buildSearchGroup(category: SearchGroup['category'], results: SearchResult[]): SearchGroup {
  return {
    category,
    results,
  };
}

export async function getSearchHubData(input: SearchQueryInput): Promise<SearchHubProps> {
  const locale = searchLocaleSchema.parse(input.locale);
  const { limit, page } = searchPaginationSchema.parse({ limit: input.limit, page: input.page });
  const normalizedQuery = input.query?.trim()
    ? searchQuerySchema.parse(input.query.trim())
    : undefined;
  const db = await getDb();
  const offset = (page - 1) * limit;

  const testFilters = [
    eq(testsTranslations.locale, locale),
    eq(tests.status, 'published'),
  ];

  if (normalizedQuery) {
    testFilters.push(sql`${tests.ftsVector} @@ plainto_tsquery('french', ${normalizedQuery})`);
  }

  const testsRows = await db
    .select({
      id: tests.id,
      title: testsTranslations.name,
      slug: testsTranslations.slug,
      description: testsTranslations.shortDescription,
      objective: testsTranslations.objective,
      population: testsTranslations.population,
      materials: testsTranslations.materials,
      durationMinutes: tests.durationMinutes,
      isStandardized: tests.isStandardized,
    })
    .from(tests)
    .innerJoin(testsTranslations, eq(tests.id, testsTranslations.testId))
    .where(and(...testFilters))
    .orderBy(asc(testsTranslations.name))
    .limit(limit)
    .offset(offset);

  const testIds = testsRows.map((row) => row.id);

  const [testDomainRows, testTagRows, testThemeRows] = await Promise.all([
    testIds.length > 0
      ? db
          .select({
            id: testDomains.testId,
            value: domainsTranslations.label,
          })
          .from(testDomains)
          .innerJoin(domainsTranslations, eq(testDomains.domainId, domainsTranslations.domainId))
          .where(and(inArray(testDomains.testId, testIds), eq(domainsTranslations.locale, locale)))
      : [],
    testIds.length > 0
      ? db
          .select({
            id: testTags.testId,
            value: tagsTranslations.label,
          })
          .from(testTags)
          .innerJoin(tagsTranslations, eq(testTags.tagId, tagsTranslations.tagId))
          .where(and(inArray(testTags.testId, testIds), eq(tagsTranslations.locale, locale)))
      : [],
    testIds.length > 0
      ? db
          .select({
            id: testThemes.testId,
            value: themeTranslations.label,
          })
          .from(testThemes)
          .innerJoin(themeTranslations, eq(testThemes.themeId, themeTranslations.themeId))
          .where(and(inArray(testThemes.testId, testIds), eq(themeTranslations.locale, locale)))
      : [],
  ]);

  const testDomainsById = collectGroupedValues(testDomainRows);
  const testTagsById = collectGroupedValues(testTagRows);
  const testThemesById = collectGroupedValues(testThemeRows);

  const testResults: SearchResult[] = testsRows.map((row) => ({
    id: row.id,
    kind: 'test',
    category: row.isStandardized ? 'assessments' : 'selfReports',
    title: row.title,
    description: row.description,
    tags: testTagsById.get(row.id) ?? emptyResults,
    domains: testDomainsById.get(row.id) ?? emptyResults,
    themes: testThemesById.get(row.id) ?? emptyResults,
    slug: row.slug,
    population: row.population,
    materials: row.materials,
    durationMinutes: row.durationMinutes,
    isStandardized: row.isStandardized ?? false,
    objective: row.objective,
  }));

  const resourceFilters = [eq(resourcesTranslations.locale, locale)];
  if (normalizedQuery) {
    resourceFilters.push(
      or(
        ilike(resourcesTranslations.title, `%${normalizedQuery}%`),
        ilike(resourcesTranslations.description, `%${normalizedQuery}%`),
        ilike(resources.type, `%${normalizedQuery}%`),
      ),
    );
  }

  const resourcesRows = await db
    .select({
      id: resources.id,
      title: resourcesTranslations.title,
      description: resourcesTranslations.description,
      type: resources.type,
      url: resources.url,
    })
    .from(resources)
    .innerJoin(resourcesTranslations, eq(resources.id, resourcesTranslations.resourceId))
    .where(and(...resourceFilters))
    .orderBy(asc(resourcesTranslations.title))
    .limit(limit)
    .offset(offset);

  const resourceIds = resourcesRows.map((row) => row.id);

  const [resourceDomainRows, resourceTagRows, resourceThemeRows] = await Promise.all([
    resourceIds.length > 0
      ? db
          .select({
            id: resourceDomains.resourceId,
            value: domainsTranslations.label,
          })
          .from(resourceDomains)
          .innerJoin(domainsTranslations, eq(resourceDomains.domainId, domainsTranslations.domainId))
          .where(and(inArray(resourceDomains.resourceId, resourceIds), eq(domainsTranslations.locale, locale)))
      : [],
    resourceIds.length > 0
      ? db
          .select({
            id: resourceTags.resourceId,
            value: tagsTranslations.label,
          })
          .from(resourceTags)
          .innerJoin(tagsTranslations, eq(resourceTags.tagId, tagsTranslations.tagId))
          .where(and(inArray(resourceTags.resourceId, resourceIds), eq(tagsTranslations.locale, locale)))
      : [],
    resourceIds.length > 0
      ? db
          .select({
            id: resourceThemes.resourceId,
            value: themeTranslations.label,
          })
          .from(resourceThemes)
          .innerJoin(themeTranslations, eq(resourceThemes.themeId, themeTranslations.themeId))
          .where(and(inArray(resourceThemes.resourceId, resourceIds), eq(themeTranslations.locale, locale)))
      : [],
  ]);

  const resourceDomainsById = collectGroupedValues(resourceDomainRows);
  const resourceTagsById = collectGroupedValues(resourceTagRows);
  const resourceThemesById = collectGroupedValues(resourceThemeRows);

  const resourceResults: SearchResult[] = resourcesRows.map((row) => ({
    id: row.id,
    kind: 'resource',
    category: 'resources',
    title: row.title,
    description: row.description,
    tags: resourceTagsById.get(row.id) ?? emptyResults,
    domains: resourceDomainsById.get(row.id) ?? emptyResults,
    themes: resourceThemesById.get(row.id) ?? emptyResults,
    resourceType: row.type,
    url: row.url,
  }));

  const [domainRows, tagRows] = await Promise.all([
    db
      .select({ label: domainsTranslations.label })
      .from(domainsTranslations)
      .where(eq(domainsTranslations.locale, locale))
      .orderBy(asc(domainsTranslations.label)),
    db
      .select({ label: tagsTranslations.label })
      .from(tagsTranslations)
      .where(eq(tagsTranslations.locale, locale))
      .orderBy(asc(tagsTranslations.label)),
  ]);

  const groups = [
    buildSearchGroup(
      'assessments',
      testResults.filter((result) => result.category === 'assessments'),
    ),
    buildSearchGroup(
      'selfReports',
      testResults.filter((result) => result.category === 'selfReports'),
    ),
    buildSearchGroup('resources', resourceResults),
  ];

  return {
    groups,
    domains: domainRows.map((row) => row.label),
    tags: tagRows.map((row) => row.label),
  };
}
