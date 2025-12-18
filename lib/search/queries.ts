import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { domains, domainsTranslations, tags, tagsTranslations } from '@/lib/db/schema';
import { getResourcesWithMetadata } from '@/lib/resources/queries';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import { searchLocaleSchema } from '@/lib/validation/search';
import type { ResourceSearchResult, SearchGroup, SearchHubProps, TestSearchResult } from './types';

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

function mapTestToResult(test: Awaited<ReturnType<typeof getTestsWithMetadata>>[number]): TestSearchResult {
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
    isStandardized: test.isStandardized,
    objective: test.objective,
  };
}

function mapResourceToResult(resource: Awaited<ReturnType<typeof getResourcesWithMetadata>>[number]): ResourceSearchResult {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    tags: normalizeArray(resource.tags),
    domains: normalizeArray(resource.domains),
    themes: normalizeArray(resource.themes),
    category: 'resources',
    kind: 'resource',
    resourceType: resource.type,
    url: resource.url,
  };
}

function sortByTitle<T extends { title: string }>(a: T, b: T) {
  return a.title.localeCompare(b.title);
}

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

export async function getSearchHubData(locale: Locale = defaultLocale): Promise<SearchHubProps> {
  const parsedLocale = searchLocaleSchema.parse(locale);

  const [tests, resources, availableDomains, availableTags] = await Promise.all([
    getTestsWithMetadata(parsedLocale),
    getResourcesWithMetadata(parsedLocale),
    getAvailableDomains(parsedLocale),
    getAvailableTags(parsedLocale),
  ]);

  const testResults = tests.map(mapTestToResult).sort(sortByTitle);
  const resourceResults = resources.map(mapResourceToResult).sort(sortByTitle);

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
