import { db } from '@/lib/db/client';
import { tests, testsTranslations, testThemes, themes, themeTranslations } from '@/lib/db/schema';
import { eq, and, sql, or, ilike } from 'drizzle-orm';

export async function searchTests(query: string, locale: string) {
  const searchTerm = query.trim();

  return await db
    .select({
      id: tests.id,
      name: testsTranslations.name,
      slug: testsTranslations.slug,
      shortDescription: testsTranslations.shortDescription,
      status: tests.status,
    })
    .from(tests)
    .innerJoin(testsTranslations, eq(tests.id, testsTranslations.testId))
    .where(
      and(
        eq(testsTranslations.locale, locale),
        eq(tests.status, 'published'), // On ne cherche que dans le validé
        searchTerm !== '' 
          ? or(
              // Utilisation du FTS vectorisé si disponible
              sql`${tests.ftsVector} @@ to_tsquery('french', ${searchTerm})`,
              ilike(testsTranslations.name, `%${searchTerm}%`),
              ilike(testsTranslations.shortDescription, `%${searchTerm}%`)
            )
          : undefined
      )
    )
    .limit(20);
}
