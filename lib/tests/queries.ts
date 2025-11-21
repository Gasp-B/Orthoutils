import { asc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { domains, testDomains, tests } from '@/lib/db/schema';
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

export async function getTestsWithMetadata(): Promise<TestDto[]> {
  const rows = await getDb()
    .select({
      id: tests.id,
      name: tests.name,
      slug: tests.slug,
      shortDescription: tests.shortDescription,
      objective: tests.objective,
      ageMinMonths: tests.ageMinMonths,
      ageMaxMonths: tests.ageMaxMonths,
      population: tests.population,
      durationMinutes: tests.durationMinutes,
      materials: tests.materials,
      isStandardized: tests.isStandardized,
      publisher: tests.publisher,
      priceRange: tests.priceRange,
      buyLink: tests.buyLink,
      notes: tests.notes,
      createdAt: tests.createdAt,
      updatedAt: tests.updatedAt,
      domains: sql<string[]>`COALESCE(array_agg(DISTINCT ${domains.name}) FILTER (WHERE ${domains.name} IS NOT NULL), '{}')`,
    })
    .from(tests)
    .leftJoin(testDomains, eq(tests.id, testDomains.testId))
    .leftJoin(domains, eq(testDomains.domainId, domains.id))
    .groupBy(tests.id)
    .orderBy(asc(tests.name));

  const parsed = testsResponseSchema.parse({
    tests: rows.map((row) => ({
      ...row,
      createdAt: toIsoString(row.createdAt ?? null),
      updatedAt: toIsoString(row.updatedAt ?? null),
      domains: row.domains ?? [],
      tags: [],
    })),
  });

  return parsed.tests;
}
