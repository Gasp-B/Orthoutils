import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { domains, tags, testDomains, testTags, tests } from '@/lib/db/schema';
import { testInputSchema, testSchema, updateTestInputSchema, type TestDto } from '@/lib/validation/tests';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { getTestWithMetadata } from './queries';

type DbClient = ReturnType<typeof getDb>;

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function upsertDomains(db: DbClient, domainNames: string[]) {
  const normalized = normalizeList(domainNames);

  if (normalized.length === 0) {
    return [] as { id: string; name: string }[];
  }

  const reservedSlugs = new Set<string>();
  const values = [] as { name: string; slug: string }[];

  for (const name of normalized) {
    const slug = await generateUniqueSlug({
      db,
      name,
      table: domains,
      slugColumn: domains.slug,
      idColumn: domains.id,
      reserved: reservedSlugs,
    });

    values.push({ name, slug });
  }

  await db
    .insert(domains)
    .values(values)
    .onConflictDoNothing();

  return db
    .select({ id: domains.id, name: domains.name })
    .from(domains)
    .where(inArray(domains.name, normalized));
}

async function upsertTags(db: DbClient, tagLabels: string[]) {
  const normalized = normalizeList(tagLabels);

  if (normalized.length === 0) {
    return [] as { id: string; label: string }[];
  }

  await db
    .insert(tags)
    .values(normalized.map((label) => ({ label })))
    .onConflictDoNothing();

  return db
    .select({ id: tags.id, label: tags.label })
    .from(tags)
    .where(inArray(tags.label, normalized));
}

async function syncDomains(db: DbClient, testId: string, domainIds: string[]) {
  await db.delete(testDomains).where(eq(testDomains.testId, testId));

  if (domainIds.length === 0) {
    return;
  }

  await db
    .insert(testDomains)
    .values(domainIds.map((domainId) => ({ testId, domainId })))
    .onConflictDoNothing();
}

async function syncTags(db: DbClient, testId: string, tagIds: string[]) {
  await db.delete(testTags).where(eq(testTags.testId, testId));

  if (tagIds.length === 0) {
    return;
  }

  await db
    .insert(testTags)
    .values(tagIds.map((tagId) => ({ testId, tagId })))
    .onConflictDoNothing();
}

export async function createTestWithRelations(input: unknown): Promise<TestDto> {
  const payload = testInputSchema.parse(input);
  const createdId = await getDb().transaction(async (tx) => {
    const slug = await generateUniqueSlug({
      db: tx,
      name: payload.name,
      table: tests,
      slugColumn: tests.slug,
      idColumn: tests.id,
    });

    const [domainRecords, tagRecords] = await Promise.all([
      upsertDomains(tx, payload.domains ?? []),
      upsertTags(tx, payload.tags ?? []),
    ]);

    const [created] = await tx
      .insert(tests)
      .values({
        name: payload.name,
        slug,
        shortDescription: payload.shortDescription ?? null,
        objective: payload.objective ?? null,
        ageMinMonths: payload.ageMinMonths ?? null,
        ageMaxMonths: payload.ageMaxMonths ?? null,
        population: payload.population ?? null,
        durationMinutes: payload.durationMinutes ?? null,
        materials: payload.materials ?? null,
        isStandardized: payload.isStandardized ?? false,
        publisher: payload.publisher ?? null,
        priceRange: payload.priceRange ?? null,
        buyLink: payload.buyLink ?? null,
        notes: payload.notes ?? null,
      })
      .returning({ id: tests.id });

    await syncDomains(tx, created.id, domainRecords.map((domain) => domain.id));
    await syncTags(tx, created.id, tagRecords.map((tag) => tag.id));

    return created.id;
  });

  const test = await getTestWithMetadata(createdId);

  if (!test) {
    throw new Error('Le test créé n\'a pas pu être relu.');
  }

  return testSchema.parse(test);
}

export async function updateTestWithRelations(input: unknown): Promise<TestDto> {
  const payload = updateTestInputSchema.parse(input);
  await getDb().transaction(async (tx) => {
    const slug = await generateUniqueSlug({
      db: tx,
      name: payload.name,
      table: tests,
      slugColumn: tests.slug,
      idColumn: tests.id,
      excludeId: payload.id,
    });

    const [domainRecords, tagRecords] = await Promise.all([
      upsertDomains(tx, payload.domains ?? []),
      upsertTags(tx, payload.tags ?? []),
    ]);

    await tx
      .update(tests)
      .set({
        name: payload.name,
        slug,
        shortDescription: payload.shortDescription ?? null,
        objective: payload.objective ?? null,
        ageMinMonths: payload.ageMinMonths ?? null,
        ageMaxMonths: payload.ageMaxMonths ?? null,
        population: payload.population ?? null,
        durationMinutes: payload.durationMinutes ?? null,
        materials: payload.materials ?? null,
        isStandardized: payload.isStandardized ?? false,
        publisher: payload.publisher ?? null,
        priceRange: payload.priceRange ?? null,
        buyLink: payload.buyLink ?? null,
        notes: payload.notes ?? null,
      })
      .where(eq(tests.id, payload.id));

    await syncDomains(tx, payload.id, domainRecords.map((domain) => domain.id));
    await syncTags(tx, payload.id, tagRecords.map((tag) => tag.id));
  });

  const test = await getTestWithMetadata(payload.id);

  if (!test) {
    throw new Error('Le test mis à jour n\'a pas pu être relu.');
  }

  return testSchema.parse(test);
}
