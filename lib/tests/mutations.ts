import { and, eq, inArray } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  pathologies,
  pathologyTranslations,
  tags,
  tagsTranslations,
  testDomains,
  testPathologies,
  testTags,
  tests,
  testsTranslations,
} from '@/lib/db/schema';
import { testInputSchema, testSchema, updateTestInputSchema, type TestDto } from '@/lib/validation/tests';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { getTestWithMetadata } from './queries';

type DbClient = ReturnType<typeof getDb> & PostgresJsDatabase<Record<string, AnyPgTable>>;

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function upsertDomains(db: DbClient, domainLabels: string[], locale: Locale) {
  const normalized = normalizeList(domainLabels);

  if (normalized.length === 0) {
    return [] as { id: string; label: string }[];
  }

  const reservedSlugs = new Set<string>();
  const results: { id: string; label: string }[] = [];

  const existingTranslations = await db
    .select({
      id: domainsTranslations.id,
      domainId: domainsTranslations.domainId,
      label: domainsTranslations.label,
      locale: domainsTranslations.locale,
    })
    .from(domainsTranslations)
    .where(inArray(domainsTranslations.label, normalized));

  for (const label of normalized) {
    const translationForLocale = existingTranslations.find(
      (entry) => entry.label === label && entry.locale === locale,
    );
    const translationAnyLocale = existingTranslations.find((entry) => entry.label === label);

    const targetDomainId =
      translationForLocale?.domainId ?? translationAnyLocale?.domainId ??
      (await db.insert(domains).values({}).returning({ id: domains.id }))[0]?.id;

    if (!targetDomainId) {
      throw new Error('Impossible de créer ou retrouver le domaine.');
    }

    const [existingForLocale] = await db
      .select({ id: domainsTranslations.id })
      .from(domainsTranslations)
      .where(
        and(eq(domainsTranslations.domainId, targetDomainId), eq(domainsTranslations.locale, locale)),
      )
      .limit(1);

    const slug = await generateUniqueSlug({
      db,
      name: label,
      table: domainsTranslations,
      slugColumn: domainsTranslations.slug,
      idColumn: domainsTranslations.id,
      excludeId: existingForLocale?.id,
      localeColumn: domainsTranslations.locale,
      locale,
      reserved: reservedSlugs,
    });

    await db
      .insert(domainsTranslations)
      .values({ domainId: targetDomainId, label, slug, locale })
      .onConflictDoUpdate({
        target: [domainsTranslations.domainId, domainsTranslations.locale],
        set: { label, slug },
      });

    results.push({ id: targetDomainId, label });
  }

  return results;
}

async function upsertTags(db: DbClient, tagLabels: string[], locale: Locale) {
  const normalized = normalizeList(tagLabels);

  if (normalized.length === 0) {
    return [] as { id: string; label: string }[];
  }

  const existingTranslations = await db
    .select({
      id: tagsTranslations.id,
      tagId: tagsTranslations.tagId,
      label: tagsTranslations.label,
      locale: tagsTranslations.locale,
    })
    .from(tagsTranslations)
    .where(inArray(tagsTranslations.label, normalized));

  const results: { id: string; label: string }[] = [];

  for (const label of normalized) {
    const translationForLocale = existingTranslations.find(
      (entry) => entry.label === label && entry.locale === locale,
    );
    const translationAnyLocale = existingTranslations.find((entry) => entry.label === label);

    const targetTagId =
      translationForLocale?.tagId ?? translationAnyLocale?.tagId ??
      (await db.insert(tags).values({}).returning({ id: tags.id }))[0]?.id;

    if (!targetTagId) {
      throw new Error('Impossible de créer ou retrouver le tag.');
    }

    await db
      .insert(tagsTranslations)
      .values({ tagId: targetTagId, label, locale })
      .onConflictDoUpdate({
        target: [tagsTranslations.tagId, tagsTranslations.locale],
        set: { label },
      });

    results.push({ id: targetTagId, label });
  }

  return results;
}

async function upsertPathologies(db: DbClient, pathologyLabels: string[], locale: Locale) {
  const normalized = normalizeList(pathologyLabels);

  if (normalized.length === 0) {
    return [] as { id: string; label: string }[];
  }

  const existingTranslations = await db
    .select({
      id: pathologyTranslations.id,
      pathologyId: pathologyTranslations.pathologyId,
      label: pathologyTranslations.label,
      locale: pathologyTranslations.locale,
    })
    .from(pathologyTranslations)
    .where(inArray(pathologyTranslations.label, normalized));

  const reservedSlugs = new Set<string>();
  const results: { id: string; label: string }[] = [];

  for (const label of normalized) {
    const translationForLocale = existingTranslations.find(
      (entry) => entry.label === label && entry.locale === locale,
    );
    const translationAnyLocale = existingTranslations.find((entry) => entry.label === label);

    let targetPathologyId = translationForLocale?.pathologyId ?? translationAnyLocale?.pathologyId;

    if (!targetPathologyId) {
      const slug = await generateUniqueSlug({
        db,
        name: label,
        table: pathologies,
        slugColumn: pathologies.slug,
        reserved: reservedSlugs,
      });

      const [created] = await db
        .insert(pathologies)
        .values({ slug })
        .returning({ id: pathologies.id });

      targetPathologyId = created?.id;
    }

    if (!targetPathologyId) {
      throw new Error('Impossible de créer ou retrouver la pathologie.');
    }

    await db
      .insert(pathologyTranslations)
      .values({ pathologyId: targetPathologyId, label, locale })
      .onConflictDoUpdate({
        target: [pathologyTranslations.pathologyId, pathologyTranslations.locale],
        set: { label },
      });

    results.push({ id: targetPathologyId, label });
  }

  return results;
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

async function syncPathologies(db: DbClient, testId: string, pathologyIds: string[]) {
  await db.delete(testPathologies).where(eq(testPathologies.testId, testId));

  if (pathologyIds.length === 0) {
    return;
  }

  await db
    .insert(testPathologies)
    .values(pathologyIds.map((pathologyId) => ({ testId, pathologyId })))
    .onConflictDoNothing();
}

async function upsertTestTranslation(
  db: DbClient,
  params: {
    testId: string;
    locale: Locale;
    name: string;
    shortDescription: string | null;
    objective: string | null;
    population: string | null;
    materials: string | null;
    publisher: string | null;
    priceRange: string | null;
    notes: string | null;
  },
) {
  const [existingTranslation] = await db
    .select({ id: testsTranslations.id })
    .from(testsTranslations)
    .where(and(eq(testsTranslations.testId, params.testId), eq(testsTranslations.locale, params.locale)))
    .limit(1);

  const slug = await generateUniqueSlug({
    db,
    name: params.name,
    table: testsTranslations,
    slugColumn: testsTranslations.slug,
    idColumn: testsTranslations.id,
    excludeId: existingTranslation?.id,
    localeColumn: testsTranslations.locale,
    locale: params.locale,
  });

  await db
    .insert(testsTranslations)
    .values({
      testId: params.testId,
      locale: params.locale,
      name: params.name,
      slug,
      shortDescription: params.shortDescription,
      objective: params.objective,
      population: params.population,
      materials: params.materials,
      publisher: params.publisher,
      priceRange: params.priceRange,
      notes: params.notes,
    })
    .onConflictDoUpdate({
      target: [testsTranslations.testId, testsTranslations.locale],
      set: {
        name: params.name,
        slug,
        shortDescription: params.shortDescription,
        objective: params.objective,
        population: params.population,
        materials: params.materials,
        publisher: params.publisher,
        priceRange: params.priceRange,
        notes: params.notes,
      },
    });
}

export async function createTestWithRelations(input: unknown): Promise<TestDto> {
  const payload = testInputSchema.parse(input);
  const locale = payload.locale ?? defaultLocale;
  const createdId = await getDb().transaction(async (tx) => {
    const [domainRecords, tagRecords, pathologyRecords] = await Promise.all([
      upsertDomains(tx as unknown as DbClient, payload.domains ?? [], locale),
      upsertTags(tx as unknown as DbClient, payload.tags ?? [], locale),
      upsertPathologies(tx as unknown as DbClient, payload.pathologies ?? [], locale),
    ]);

    const [created] = await tx
      .insert(tests)
      .values({
        ageMinMonths: payload.ageMinMonths ?? null,
        ageMaxMonths: payload.ageMaxMonths ?? null,
        durationMinutes: payload.durationMinutes ?? null,
        isStandardized: payload.isStandardized ?? false,
        buyLink: payload.buyLink ?? null,
        bibliography: payload.bibliography ?? [],
      })
      .returning({ id: tests.id });

    await upsertTestTranslation(tx as unknown as DbClient, {
      testId: created.id,
      locale,
      name: payload.name,
      shortDescription: payload.shortDescription ?? null,
      objective: payload.objective ?? null,
      population: payload.population ?? null,
      materials: payload.materials ?? null,
      publisher: payload.publisher ?? null,
      priceRange: payload.priceRange ?? null,
      notes: payload.notes ?? null,
    });

    await syncDomains(tx as unknown as DbClient, created.id, domainRecords.map((domain) => domain.id));
    await syncTags(tx as unknown as DbClient, created.id, tagRecords.map((tag) => tag.id));
    await syncPathologies(
      tx as unknown as DbClient,
      created.id,
      pathologyRecords.map((pathology) => pathology.id),
    );

    return created.id;
  });

  const test = await getTestWithMetadata(createdId, locale);

  if (!test) {
    throw new Error("Le test créé n'a pas pu être relu.");
  }

  return testSchema.parse(test);
}

export async function updateTestWithRelations(input: unknown): Promise<TestDto> {
  const payload = updateTestInputSchema.parse(input);
  const locale = payload.locale ?? defaultLocale;
  await getDb().transaction(async (tx) => {
    const [domainRecords, tagRecords, pathologyRecords] = await Promise.all([
      upsertDomains(tx as unknown as DbClient, payload.domains ?? [], locale),
      upsertTags(tx as unknown as DbClient, payload.tags ?? [], locale),
      upsertPathologies(tx as unknown as DbClient, payload.pathologies ?? [], locale),
    ]);

    await tx
      .update(tests)
      .set({
        ageMinMonths: payload.ageMinMonths ?? null,
        ageMaxMonths: payload.ageMaxMonths ?? null,
        durationMinutes: payload.durationMinutes ?? null,
        isStandardized: payload.isStandardized ?? false,
        buyLink: payload.buyLink ?? null,
        bibliography: payload.bibliography ?? [],
      })
      .where(eq(tests.id, payload.id));

    await upsertTestTranslation(tx as unknown as DbClient, {
      testId: payload.id,
      locale,
      name: payload.name,
      shortDescription: payload.shortDescription ?? null,
      objective: payload.objective ?? null,
      population: payload.population ?? null,
      materials: payload.materials ?? null,
      publisher: payload.publisher ?? null,
      priceRange: payload.priceRange ?? null,
      notes: payload.notes ?? null,
    });

    await syncDomains(tx as unknown as DbClient, payload.id, domainRecords.map((domain) => domain.id));
    await syncTags(tx as unknown as DbClient, payload.id, tagRecords.map((tag) => tag.id));
    await syncPathologies(
      tx as unknown as DbClient,
      payload.id,
      pathologyRecords.map((pathology) => pathology.id),
    );
  });

  const test = await getTestWithMetadata(payload.id, locale);

  if (!test) {
    throw new Error("Le test mis à jour n'a pas pu être relu.");
  }

  return testSchema.parse(test);
}
