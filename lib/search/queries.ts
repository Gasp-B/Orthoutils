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
  resources,
  resourcesTranslations
} from '@/lib/db/schema';
import { searchQuerySchema } from '@/lib/validation/search';
import { and, eq, ilike, or, sql } from 'drizzle-orm';

export async function searchAll(query: string, locale: Locale) {
  const db = await getDb();
  
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
          ilike(testsTranslations.name, `%${query}%`),
          ilike(testsTranslations.shortDescription, `%${query}%`),
          // Utilisation du vecteur FTS pour la performance
          sql`${tests.ftsVector} @@ to_tsquery('french', ${query})`
        )
      )
    )
    .limit(10);

  return { tests: testsResults };
}
