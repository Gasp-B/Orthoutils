import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  clinicalProfileTranslations,
  clinicalProfiles,
  domains,
  domainsTranslations,
  populationTranslations,
  tags,
  tagsTranslations,
  testClinicalProfiles,
  testDomains,
  testTags,
  tests,
  testsTranslations,
  testThemes,
  themeTranslations,
  themes,
} from '@/lib/db/schema';
import { testsResponseSchema, type TestDto } from '@/lib/validation/tests';

function toIsoString(value: Date | string | null) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  return new Date().toISOString();
}

export async function getTestsWithMetadata(locale: Locale = defaultLocale): Promise<TestDto[]> {
  const localizedTest = alias(testsTranslations, 'localized_test');
  const fallbackTest = alias(testsTranslations, 'fallback_test');
  const localizedDomain = alias(domainsTranslations, 'localized_domain');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
  const localizedTheme = alias(themeTranslations, 'localized_theme');
  const fallbackTheme = alias(themeTranslations, 'fallback_theme');
  const localizedTag = alias(tagsTranslations, 'localized_tag');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag');
  const localizedClinicalProfile = alias(clinicalProfileTranslations, 'localized_clinical_profile');
  const fallbackClinicalProfile = alias(clinicalProfileTranslations, 'fallback_clinical_profile');
  const localizedPopulation = alias(populationTranslations, 'localized_population');
  const fallbackPopulation = alias(populationTranslations, 'fallback_population');

  const nameExpression = sql<string>`COALESCE(MAX(${localizedTest.name}), MAX(${fallbackTest.name}), '')`;
  const slugExpression = sql<string>`COALESCE(MAX(${localizedTest.slug}), MAX(${fallbackTest.slug}), '')`;
  const shortDescriptionExpression = sql<string | null>`COALESCE(MAX(${localizedTest.shortDescription}), MAX(${fallbackTest.shortDescription}))`;
  const objectiveExpression = sql<string | null>`COALESCE(MAX(${localizedTest.objective}), MAX(${fallbackTest.objective}))`;
  const populationExpression = sql<string | null>`COALESCE(MAX(${localizedPopulation.label}), MAX(${fallbackPopulation.label}))`;
  const materialsExpression = sql<string | null>`COALESCE(MAX(${localizedTest.materials}), MAX(${fallbackTest.materials}))`;
  const publisherExpression = sql<string | null>`COALESCE(MAX(${localizedTest.publisher}), MAX(${fallbackTest.publisher}))`;
  const priceRangeExpression = sql<string | null>`COALESCE(MAX(${localizedTest.priceRange}), MAX(${fallbackTest.priceRange}))`;
  const notesExpression = sql<string | null>`COALESCE(MAX(${localizedTest.notes}), MAX(${fallbackTest.notes}))`;
  const domainLabelExpression = sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label}, '')`;
  const themeLabelExpression = sql<string>`COALESCE(${localizedTheme.label}, ${fallbackTheme.label}, '')`;
  const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label}, '')`;
  const clinicalProfileLabelExpression = sql<string>`COALESCE(${localizedClinicalProfile.label}, ${fallbackClinicalProfile.label}, '')`;

  const rows = await getDb()
    .select({
      id: tests.id,
      name: nameExpression,
      slug: slugExpression,
      shortDescription: shortDescriptionExpression,
      objective: objectiveExpression,
      targetAudience: tests.targetAudience,
      status: tests.status,
      ageMinMonths: tests.ageMinMonths,
      ageMaxMonths: tests.ageMaxMonths,
      population: populationExpression,
      durationMinutes: tests.durationMinutes,
      materials: materialsExpression,
      isStandardized: tests.isStandardized,
      publisher: publisherExpression,
      priceRange: priceRangeExpression,
      buyLink: tests.buyLink,
      notes: notesExpression,
      bibliography: tests.bibliography,
      createdAt: tests.createdAt,
      updatedAt: tests.updatedAt,
      domains: sql<string[]>`COALESCE(array_agg(DISTINCT ${domainLabelExpression}) FILTER (WHERE ${domainLabelExpression} IS NOT NULL), '{}')`,
      themes: sql<string[]>`COALESCE(array_agg(DISTINCT ${themeLabelExpression}) FILTER (WHERE ${themeLabelExpression} IS NOT NULL), '{}')`,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tagLabelExpression}) FILTER (WHERE ${tagLabelExpression} IS NOT NULL), '{}')`,
      clinicalProfiles: sql<string[]>`COALESCE(array_agg(DISTINCT ${clinicalProfileLabelExpression}) FILTER (WHERE ${clinicalProfileLabelExpression} IS NOT NULL), '{}')`,
    })
    .from(tests)
    .leftJoin(localizedTest, and(eq(localizedTest.testId, tests.id), eq(localizedTest.locale, locale)))
    .leftJoin(fallbackTest, and(eq(fallbackTest.testId, tests.id), eq(fallbackTest.locale, defaultLocale)))
    .leftJoin(
      localizedPopulation,
      and(eq(localizedPopulation.populationId, tests.populationId), eq(localizedPopulation.locale, locale)),
    )
    .leftJoin(
      fallbackPopulation,
      and(
        eq(fallbackPopulation.populationId, tests.populationId),
        eq(fallbackPopulation.locale, defaultLocale),
      ),
    )
    .leftJoin(testDomains, eq(tests.id, testDomains.testId))
    .leftJoin(domains, eq(testDomains.domainId, domains.id))
    .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
    .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
    .leftJoin(testThemes, eq(tests.id, testThemes.testId))
    .leftJoin(themes, eq(testThemes.themeId, themes.id))
    .leftJoin(
      localizedTheme,
      and(eq(localizedTheme.themeId, themes.id), eq(localizedTheme.locale, locale)),
    )
    .leftJoin(
      fallbackTheme,
      and(eq(fallbackTheme.themeId, themes.id), eq(fallbackTheme.locale, defaultLocale)),
    )
    .leftJoin(testTags, eq(tests.id, testTags.testId))
    .leftJoin(tags, eq(testTags.tagId, tags.id))
    .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
    .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
    .leftJoin(testClinicalProfiles, eq(tests.id, testClinicalProfiles.testId))
    .leftJoin(clinicalProfiles, eq(testClinicalProfiles.clinicalProfileId, clinicalProfiles.id))
    .leftJoin(
      localizedClinicalProfile,
      and(eq(localizedClinicalProfile.clinicalProfileId, clinicalProfiles.id), eq(localizedClinicalProfile.locale, locale)),
    )
    .leftJoin(
      fallbackClinicalProfile,
      and(
        eq(fallbackClinicalProfile.clinicalProfileId, clinicalProfiles.id),
        eq(fallbackClinicalProfile.locale, defaultLocale),
      ),
    )
    .groupBy(
      tests.id,
      tests.targetAudience,
      tests.populationId,
      tests.status,
      tests.ageMinMonths,
      tests.ageMaxMonths,
      tests.durationMinutes,
      tests.isStandardized,
      tests.buyLink,
      tests.bibliography,
      tests.createdAt,
      tests.updatedAt,
    )
    .orderBy(nameExpression);

  const parsed = testsResponseSchema.parse({
    tests: rows.map((row) => ({
      ...row,
      targetAudience: row.targetAudience ?? 'child',
      status: row.status ?? 'draft',
      createdAt: toIsoString((row.createdAt as Date | string | null) ?? null),
      updatedAt: toIsoString((row.updatedAt as Date | string | null) ?? null),
      domains: row.domains ?? [],
      themes: row.themes ?? [],
      tags: row.tags ?? [],
      bibliography: row.bibliography ?? [],
      clinicalProfiles: row.clinicalProfiles ?? [],
    })),
  });

  return parsed.tests;
}

export async function getTestWithMetadata(
  id: string,
  locale: Locale = defaultLocale,
): Promise<TestDto | null> {
  const localizedTest = alias(testsTranslations, 'localized_test');
  const fallbackTest = alias(testsTranslations, 'fallback_test');
  const localizedDomain = alias(domainsTranslations, 'localized_domain');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
  const localizedTheme = alias(themeTranslations, 'localized_theme');
  const fallbackTheme = alias(themeTranslations, 'fallback_theme');
  const localizedTag = alias(tagsTranslations, 'localized_tag');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag');
  const localizedClinicalProfile = alias(clinicalProfileTranslations, 'localized_clinical_profile');
  const fallbackClinicalProfile = alias(clinicalProfileTranslations, 'fallback_clinical_profile');
  const localizedPopulation = alias(populationTranslations, 'localized_population');
  const fallbackPopulation = alias(populationTranslations, 'fallback_population');

  const nameExpression = sql<string>`COALESCE(MAX(${localizedTest.name}), MAX(${fallbackTest.name}), '')`;
  const slugExpression = sql<string>`COALESCE(MAX(${localizedTest.slug}), MAX(${fallbackTest.slug}), '')`;
  const shortDescriptionExpression = sql<string | null>`COALESCE(MAX(${localizedTest.shortDescription}), MAX(${fallbackTest.shortDescription}))`;
  const objectiveExpression = sql<string | null>`COALESCE(MAX(${localizedTest.objective}), MAX(${fallbackTest.objective}))`;
  const populationExpression = sql<string | null>`COALESCE(MAX(${localizedPopulation.label}), MAX(${fallbackPopulation.label}))`;
  const materialsExpression = sql<string | null>`COALESCE(MAX(${localizedTest.materials}), MAX(${fallbackTest.materials}))`;
  const publisherExpression = sql<string | null>`COALESCE(MAX(${localizedTest.publisher}), MAX(${fallbackTest.publisher}))`;
  const priceRangeExpression = sql<string | null>`COALESCE(MAX(${localizedTest.priceRange}), MAX(${fallbackTest.priceRange}))`;
  const notesExpression = sql<string | null>`COALESCE(MAX(${localizedTest.notes}), MAX(${fallbackTest.notes}))`;
  const domainLabelExpression = sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label}, '')`;
  const themeLabelExpression = sql<string>`COALESCE(${localizedTheme.label}, ${fallbackTheme.label}, '')`;
  const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label}, '')`;
  const clinicalProfileLabelExpression = sql<string>`COALESCE(${localizedClinicalProfile.label}, ${fallbackClinicalProfile.label}, '')`;

  const rows = await getDb()
    .select({
      id: tests.id,
      name: nameExpression,
      slug: slugExpression,
      shortDescription: shortDescriptionExpression,
      objective: objectiveExpression,
      targetAudience: tests.targetAudience,
      status: tests.status,
      ageMinMonths: tests.ageMinMonths,
      ageMaxMonths: tests.ageMaxMonths,
      population: populationExpression,
      durationMinutes: tests.durationMinutes,
      materials: materialsExpression,
      isStandardized: tests.isStandardized,
      publisher: publisherExpression,
      priceRange: priceRangeExpression,
      buyLink: tests.buyLink,
      notes: notesExpression,
      bibliography: tests.bibliography,
      createdAt: tests.createdAt,
      updatedAt: tests.updatedAt,
      domains: sql<string[]>`COALESCE(array_agg(DISTINCT ${domainLabelExpression}) FILTER (WHERE ${domainLabelExpression} IS NOT NULL), '{}')`,
      themes: sql<string[]>`COALESCE(array_agg(DISTINCT ${themeLabelExpression}) FILTER (WHERE ${themeLabelExpression} IS NOT NULL), '{}')`,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tagLabelExpression}) FILTER (WHERE ${tagLabelExpression} IS NOT NULL), '{}')`,
      clinicalProfiles: sql<string[]>`COALESCE(array_agg(DISTINCT ${clinicalProfileLabelExpression}) FILTER (WHERE ${clinicalProfileLabelExpression} IS NOT NULL), '{}')`,
    })
    .from(tests)
    .leftJoin(localizedTest, and(eq(localizedTest.testId, tests.id), eq(localizedTest.locale, locale)))
    .leftJoin(fallbackTest, and(eq(fallbackTest.testId, tests.id), eq(fallbackTest.locale, defaultLocale)))
    .leftJoin(
      localizedPopulation,
      and(eq(localizedPopulation.populationId, tests.populationId), eq(localizedPopulation.locale, locale)),
    )
    .leftJoin(
      fallbackPopulation,
      and(
        eq(fallbackPopulation.populationId, tests.populationId),
        eq(fallbackPopulation.locale, defaultLocale),
      ),
    )
    .leftJoin(testDomains, eq(tests.id, testDomains.testId))
    .leftJoin(domains, eq(testDomains.domainId, domains.id))
    .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
    .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
    .leftJoin(testThemes, eq(tests.id, testThemes.testId))
    .leftJoin(themes, eq(testThemes.themeId, themes.id))
    .leftJoin(
      localizedTheme,
      and(eq(localizedTheme.themeId, themes.id), eq(localizedTheme.locale, locale)),
    )
    .leftJoin(
      fallbackTheme,
      and(eq(fallbackTheme.themeId, themes.id), eq(fallbackTheme.locale, defaultLocale)),
    )
    .leftJoin(testTags, eq(tests.id, testTags.testId))
    .leftJoin(tags, eq(testTags.tagId, tags.id))
    .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
    .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
    .leftJoin(testClinicalProfiles, eq(tests.id, testClinicalProfiles.testId))
    .leftJoin(clinicalProfiles, eq(testClinicalProfiles.clinicalProfileId, clinicalProfiles.id))
    .leftJoin(
      localizedClinicalProfile,
      and(eq(localizedClinicalProfile.clinicalProfileId, clinicalProfiles.id), eq(localizedClinicalProfile.locale, locale)),
    )
    .leftJoin(
      fallbackClinicalProfile,
      and(
        eq(fallbackClinicalProfile.clinicalProfileId, clinicalProfiles.id),
        eq(fallbackClinicalProfile.locale, defaultLocale),
      ),
    )
    .where(eq(tests.id, id))
    .groupBy(
      tests.id,
      tests.targetAudience,
      tests.populationId,
      tests.status,
      tests.ageMinMonths,
      tests.ageMaxMonths,
      tests.durationMinutes,
      tests.isStandardized,
      tests.buyLink,
      tests.bibliography,
      tests.createdAt,
      tests.updatedAt,
    )
    .limit(1);

  const parsed = testsResponseSchema.parse({
    tests: rows.map((row) => ({
      ...row,
      targetAudience: row.targetAudience ?? 'child',
      status: row.status ?? 'draft',
      createdAt: toIsoString((row.createdAt as Date | string | null) ?? null),
      updatedAt: toIsoString((row.updatedAt as Date | string | null) ?? null),
      domains: row.domains ?? [],
      themes: row.themes ?? [],
      tags: row.tags ?? [],
      bibliography: row.bibliography ?? [],
      clinicalProfiles: row.clinicalProfiles ?? [],
    })),
  });

  return parsed.tests[0] ?? null;
}
