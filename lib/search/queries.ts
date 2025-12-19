import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  tags,
  tagsTranslations,
  testDomains,
  testTags,
  testThemes,
  tests,
  testsTranslations,
  themeTranslations,
  themes,
  toolsCatalog,
  toolsCatalogTranslations,
} from '@/lib/db/schema';
import { searchLocaleSchema, searchPaginationSchema, searchQuerySchema } from '@/lib/validation/search';
import type {
  ResourceSearchResult,
  SearchGroup,
  SearchHubProps,
  SearchQueryInput,
  TestSearchResult,
} from './types';

const selfReportKeywords = ['self', 'auto', 'auto-évaluation'];

function normalizeArray(values: string[]) {
  return values.filter((value) => value && value.trim().length > 0);
}

function inferTestCategory(tags: string[]) {
  const lowerTags = tags.map((tag) => tag.toLowerCase());

  if (lowerTags.some((tag) => selfReportKeywords.some((keyword) => tag.includes(keyword)))) {
    return 'selfReports' as const;
  }

  return 'assessments' as const;
}

function mapTestToResult(test: TestSearchRow): TestSearchResult {
  const category = inferTestCategory(test.tags);

  return {
    id: test.id,
    title: test.name,
    description: test.shortDescription,
    tags: normalizeArray(test.tags),
    domains: normalizeArray(test.domains),
    themes: normalizeArray(test.themes),
    category,
    kind: 'test',
    slug: test.slug,
    population: test.population,
    materials: test.materials,
    durationMinutes: test.durationMinutes,
    isStandardized: test.isStandardized ?? false,
    objective: test.objective,
  };
}

type ToolCatalogLink = {
  label?: string;
  url?: string;
};

type ToolCatalogSearchRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  links: ToolCatalogLink[] | null;
};

function getFirstLinkUrl(links: ToolCatalogLink[] | null) {
  if (!links || links.length === 0) {
    return null;
  }

  return links[0]?.url ?? null;
}

function mapResourceToResult(resource: ToolCatalogSearchRow): ResourceSearchResult {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    tags: normalizeArray(resource.tags),
    domains: [],
    themes: [],
    category: 'resources',
    kind: 'resource',
    resourceType: resource.category,
    url: getFirstLinkUrl(resource.links),
  };
}

type TestSearchRow = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  objective: string | null;
  population: string | null;
  durationMinutes: number | null;
  materials: string | null;
  isStandardized: boolean | null;
  domains: string[];
  themes: string[];
  tags: string[];
};

async function getAvailableDomains(locale: Locale = defaultLocale) {
  const localizedDomain = alias(domainsTranslations, 'localized_domain');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
  const domainLabelExpression = sql<string>`COALESCE(MAX(${localizedDomain.label}), MAX(${fallbackDomain.label}), '')`;

  const rows = await getDb()
    .select({ label: domainLabelExpression })
    .from(domains)
    .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
    .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
    .groupBy(domains.id)
    .orderBy(domainLabelExpression);

  return rows.map((row) => row.label).filter((label) => label && label.trim().length > 0);
}

async function getAvailableTags(locale: Locale = defaultLocale) {
  const localizedTag = alias(tagsTranslations, 'localized_tag');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag');
  const labelExpression = sql<string>`COALESCE(MAX(${localizedTag.label}), MAX(${fallbackTag.label}), '')`;

  const rows = await getDb()
    .select({ label: labelExpression })
    .from(tags)
    .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
    .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
    .groupBy(tags.id)
    .orderBy(labelExpression);

  return rows.map((row) => row.label).filter((label) => label && label.trim().length > 0);
}

export async function getSearchHubData({
  locale = defaultLocale,
  query,
  limit,
  page,
}: SearchQueryInput = {}): Promise<SearchHubProps> {
  const parsedLocale = searchLocaleSchema.parse(locale);
  const pagination = searchPaginationSchema.parse({ limit, page });
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  const parsedQuery = searchQuerySchema.safeParse(normalizedQuery);

  const [availableDomains, availableTags] = await Promise.all([
    getAvailableDomains(parsedLocale),
    getAvailableTags(parsedLocale),
  ]);

  if (!parsedQuery.success) {
    return {
      groups: [],
      domains: availableDomains,
      tags: availableTags,
    };
  }

  const language = parsedLocale === 'fr' ? 'french' : 'english';
  const tsQuery = sql`websearch_to_tsquery(${language}, ${parsedQuery.data})`;
  const offset = (pagination.page - 1) * pagination.limit;

  const localizedTest = alias(testsTranslations, 'localized_test');
  const fallbackTest = alias(testsTranslations, 'fallback_test');
  const localizedDomain = alias(domainsTranslations, 'localized_domain');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
  const localizedTheme = alias(themeTranslations, 'localized_theme');
  const fallbackTheme = alias(themeTranslations, 'fallback_theme');
  const localizedTag = alias(tagsTranslations, 'localized_tag');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag');

  const nameExpression = sql<string>`COALESCE(MAX(${localizedTest.name}), MAX(${fallbackTest.name}), '')`;
  const slugExpression = sql<string>`COALESCE(MAX(${localizedTest.slug}), MAX(${fallbackTest.slug}), '')`;
  const shortDescriptionExpression = sql<string | null>`COALESCE(MAX(${localizedTest.shortDescription}), MAX(${fallbackTest.shortDescription}))`;
  const objectiveExpression = sql<string | null>`COALESCE(MAX(${localizedTest.objective}), MAX(${fallbackTest.objective}))`;
  const populationExpression = sql<string | null>`COALESCE(MAX(${localizedTest.population}), MAX(${fallbackTest.population}))`;
  const materialsExpression = sql<string | null>`COALESCE(MAX(${localizedTest.materials}), MAX(${fallbackTest.materials}))`;
  const domainLabelExpression = sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label}, '')`;
  const themeLabelExpression = sql<string>`COALESCE(${localizedTheme.label}, ${fallbackTheme.label}, '')`;
  const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label}, '')`;
  const testRankExpression = sql<number>`ts_rank(${tests.ftsVector}, ${tsQuery})`;

  const testRows = await getDb()
    .select({
      id: tests.id,
      name: nameExpression,
      slug: slugExpression,
      shortDescription: shortDescriptionExpression,
      objective: objectiveExpression,
      population: populationExpression,
      durationMinutes: tests.durationMinutes,
      materials: materialsExpression,
      isStandardized: tests.isStandardized,
      domains: sql<string[]>`COALESCE(array_agg(DISTINCT ${domainLabelExpression}) FILTER (WHERE ${domainLabelExpression} IS NOT NULL), '{}')`,
      themes: sql<string[]>`COALESCE(array_agg(DISTINCT ${themeLabelExpression}) FILTER (WHERE ${themeLabelExpression} IS NOT NULL), '{}')`,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tagLabelExpression}) FILTER (WHERE ${tagLabelExpression} IS NOT NULL), '{}')`,
    })
    .from(tests)
    .leftJoin(localizedTest, and(eq(localizedTest.testId, tests.id), eq(localizedTest.locale, parsedLocale)))
    .leftJoin(fallbackTest, and(eq(fallbackTest.testId, tests.id), eq(fallbackTest.locale, defaultLocale)))
    .leftJoin(testDomains, eq(tests.id, testDomains.testId))
    .leftJoin(domains, eq(testDomains.domainId, domains.id))
    .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, parsedLocale)))
    .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
    .leftJoin(testThemes, eq(tests.id, testThemes.testId))
    .leftJoin(themes, eq(testThemes.themeId, themes.id))
    .leftJoin(
      localizedTheme,
      and(eq(localizedTheme.themeId, themes.id), eq(localizedTheme.locale, parsedLocale)),
    )
    .leftJoin(
      fallbackTheme,
      and(eq(fallbackTheme.themeId, themes.id), eq(fallbackTheme.locale, defaultLocale)),
    )
    .leftJoin(testTags, eq(tests.id, testTags.testId))
    .leftJoin(tags, eq(testTags.tagId, tags.id))
    .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, parsedLocale)))
    .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
    .where(and(eq(tests.status, 'published'), sql`${tests.ftsVector} @@ ${tsQuery}`))
    .groupBy(
      tests.id,
      tests.durationMinutes,
      tests.isStandardized,
    )
    .orderBy(desc(testRankExpression), nameExpression)
    .limit(pagination.limit)
    .offset(offset);

  const localizedTool = alias(toolsCatalogTranslations, 'localized_tool');
  const fallbackTool = alias(toolsCatalogTranslations, 'fallback_tool');
  const toolTitleExpression = sql<string>`COALESCE(MAX(${localizedTool.title}), MAX(${fallbackTool.title}), '')`;
  const toolDescriptionExpression = sql<string | null>`COALESCE(MAX(${localizedTool.description}), MAX(${fallbackTool.description}))`;
  const toolCategoryExpression = sql<string>`COALESCE(MAX(${localizedTool.category}), MAX(${fallbackTool.category}), '')`;
  const toolRankExpression = sql<number>`ts_rank(${toolsCatalog.ftsVector}, ${tsQuery})`;

  const toolRows = await getDb()
    .select({
      id: toolsCatalog.id,
      title: toolTitleExpression,
      description: toolDescriptionExpression,
      category: toolCategoryExpression,
      tags: toolsCatalog.tags,
      links: toolsCatalog.links,
    })
    .from(toolsCatalog)
    .leftJoin(
      localizedTool,
      and(eq(localizedTool.toolCatalogId, toolsCatalog.id), eq(localizedTool.locale, parsedLocale)),
    )
    .leftJoin(
      fallbackTool,
      and(eq(fallbackTool.toolCatalogId, toolsCatalog.id), eq(fallbackTool.locale, defaultLocale)),
    )
    .where(and(eq(toolsCatalog.status, 'published'), sql`${toolsCatalog.ftsVector} @@ ${tsQuery}`))
    .groupBy(toolsCatalog.id, toolsCatalog.tags, toolsCatalog.links)
    .orderBy(desc(toolRankExpression), toolTitleExpression)
    .limit(pagination.limit)
    .offset(offset);

  const testResults = testRows.map(mapTestToResult);
  const resourceResults = toolRows.map(mapResourceToResult);

  const assessments = testResults.filter((result) => result.category === 'assessments');
  const selfReports = testResults.filter((result) => result.category === 'selfReports');

  const groups: SearchGroup[] = [
    { category: 'assessments', results: assessments },
    { category: 'selfReports', results: selfReports },
    { category: 'resources', results: resourceResults },
  ];

  return {
    groups,
    domains: availableDomains,
    tags: availableTags,
  };
}
