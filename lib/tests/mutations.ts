import { and, eq, inArray } from 'drizzle-orm';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domainsTranslations,
  tagsTranslations,
  testDomains,
  testTags,
  testThemes,
  tests,
  themeTranslations,
  testsTranslations,
} from '@/lib/db/schema';
import { getTestWithMetadata } from '@/lib/tests/queries';
import { testAdminCreateSchema, testAdminUpdateSchema } from '@/lib/validation/tests';
import { generateUniqueSlug } from '@/lib/utils/slug';

type DbClient = ReturnType<typeof getDb>;
type DbTransaction = Parameters<DbClient['transaction']>[0] extends (tx: infer Tx) => Promise<unknown> ? Tx : never;
type DbExecutor = DbClient | DbTransaction;

function normalizeLabels(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function resolveDomainIdsByLabels(db: DbExecutor, labels: string[], locale: Locale) {
  const normalized = normalizeLabels(labels);
  if (normalized.length === 0) return [] as string[];

  const rows = await db
    .select({ id: domainsTranslations.domainId, label: domainsTranslations.label, locale: domainsTranslations.locale })
    .from(domainsTranslations)
    .where(
      and(
        inArray(domainsTranslations.label, normalized),
        inArray(domainsTranslations.locale, [locale, defaultLocale]),
      ),
    );

  return normalized.map((label) => {
    const preferred = rows.find((row) => row.label === label && row.locale === locale);
    const fallback = preferred ?? rows.find((row) => row.label === label);
    if (!fallback) {
      throw new Error('Certains domaines sélectionnés sont introuvables.');
    }
    return fallback.id;
  });
}

async function resolveTagIdsByLabels(db: DbExecutor, labels: string[], locale: Locale) {
  const normalized = normalizeLabels(labels);
  if (normalized.length === 0) return [] as string[];

  const rows = await db
    .select({ id: tagsTranslations.tagId, label: tagsTranslations.label, locale: tagsTranslations.locale })
    .from(tagsTranslations)
    .where(
      and(
        inArray(tagsTranslations.label, normalized),
        inArray(tagsTranslations.locale, [locale, defaultLocale]),
      ),
    );

  return normalized.map((label) => {
    const preferred = rows.find((row) => row.label === label && row.locale === locale);
    const fallback = preferred ?? rows.find((row) => row.label === label);
    if (!fallback) {
      throw new Error('Certains tags sélectionnés sont introuvables.');
    }
    return fallback.id;
  });
}

async function resolveThemeIdsByLabels(db: DbExecutor, labels: string[], locale: Locale) {
  const normalized = normalizeLabels(labels);
  if (normalized.length === 0) return [] as string[];

  const rows = await db
    .select({ id: themeTranslations.themeId, label: themeTranslations.label, locale: themeTranslations.locale })
    .from(themeTranslations)
    .where(
      and(
        inArray(themeTranslations.label, normalized),
        inArray(themeTranslations.locale, [locale, defaultLocale]),
      ),
    );

  return normalized.map((label) => {
    const preferred = rows.find((row) => row.label === label && row.locale === locale);
    const fallback = preferred ?? rows.find((row) => row.label === label);
    if (!fallback) {
      throw new Error('Certains thèmes sélectionnés sont introuvables.');
    }
    return fallback.id;
  });
}

export async function updateTestAdminFields(input: unknown) {
  const payload = testAdminUpdateSchema.parse(input);
  const locale = payload.locale ?? defaultLocale;

  await getDb().transaction(async (tx) => {
    const shouldTouchTest =
      payload.status !== undefined ||
      payload.targetAudience !== undefined ||
      payload.domains !== undefined ||
      payload.tags !== undefined ||
      payload.themes !== undefined ||
      payload.name !== undefined ||
      payload.slug !== undefined ||
      payload.shortDescription !== undefined ||
      payload.objective !== undefined;

    if (shouldTouchTest) {
      const updates: Partial<typeof tests.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (payload.status !== undefined) updates.status = payload.status;
      if (payload.targetAudience !== undefined) updates.targetAudience = payload.targetAudience;

      await tx.update(tests).set(updates).where(eq(tests.id, payload.id));
    }

    const shouldTouchTranslation =
      payload.name !== undefined ||
      payload.slug !== undefined ||
      payload.shortDescription !== undefined ||
      payload.objective !== undefined;

    if (shouldTouchTranslation) {
      const existingTranslation = await tx
        .select({
          name: testsTranslations.name,
          slug: testsTranslations.slug,
          shortDescription: testsTranslations.shortDescription,
          objective: testsTranslations.objective,
        })
        .from(testsTranslations)
        .where(and(eq(testsTranslations.testId, payload.id), eq(testsTranslations.locale, locale)))
        .limit(1);

      const current = existingTranslation[0];
      const name = payload.name?.trim() || current?.name;

      if (!name) {
        throw new Error('Le nom du test est requis.');
      }

      const slugSeed = payload.slug?.trim() || name;
      const slug =
        payload.slug !== undefined
          ? await generateUniqueSlug({
              db: tx,
              name: slugSeed,
              table: testsTranslations,
              slugColumn: testsTranslations.slug,
              idColumn: testsTranslations.testId,
              excludeId: payload.id,
              localeColumn: testsTranslations.locale,
              locale,
            })
          : current?.slug || slugSeed;

      const shortDescription =
        payload.shortDescription !== undefined ? payload.shortDescription : current?.shortDescription ?? null;
      const objective = payload.objective !== undefined ? payload.objective : current?.objective ?? null;

      await tx
        .insert(testsTranslations)
        .values({
          testId: payload.id,
          locale,
          name,
          slug,
          shortDescription,
          objective,
        })
        .onConflictDoUpdate({
          target: [testsTranslations.testId, testsTranslations.locale],
          set: {
            name,
            slug,
            shortDescription,
            objective,
          },
        });
    }

    if (payload.domains !== undefined) {
      const domainIds = await resolveDomainIdsByLabels(tx, payload.domains, locale);
      await tx.delete(testDomains).where(eq(testDomains.testId, payload.id));
      if (domainIds.length) {
        await tx.insert(testDomains).values(domainIds.map((id) => ({ testId: payload.id, domainId: id })));
      }
    }

    if (payload.tags !== undefined) {
      const tagIds = await resolveTagIdsByLabels(tx, payload.tags, locale);
      await tx.delete(testTags).where(eq(testTags.testId, payload.id));
      if (tagIds.length) {
        await tx.insert(testTags).values(tagIds.map((id) => ({ testId: payload.id, tagId: id })));
      }
    }

    if (payload.themes !== undefined) {
      const themeIds = await resolveThemeIdsByLabels(tx, payload.themes, locale);
      await tx.delete(testThemes).where(eq(testThemes.testId, payload.id));
      if (themeIds.length) {
        await tx.insert(testThemes).values(themeIds.map((id) => ({ testId: payload.id, themeId: id })));
      }
    }
  });

  const updated = await getTestWithMetadata(payload.id, locale);
  if (!updated) {
    throw new Error('Impossible de recharger le test.');
  }

  return updated;
}

export async function createTestAdminFields(input: unknown) {
  const payload = testAdminCreateSchema.parse(input);
  const locale = payload.locale ?? defaultLocale;

  const createdId = await getDb().transaction(async (tx) => {
    const slugSeed = payload.slug.trim() || payload.name.trim();
    const slug = await generateUniqueSlug({
      db: tx,
      name: slugSeed,
      table: testsTranslations,
      slugColumn: testsTranslations.slug,
      localeColumn: testsTranslations.locale,
      locale,
    });

    const [createdTest] = await tx
      .insert(tests)
      .values({
        status: payload.status ?? 'draft',
        targetAudience: payload.targetAudience ?? 'child',
        updatedAt: new Date(),
      })
      .returning({ id: tests.id });

    await tx.insert(testsTranslations).values({
      testId: createdTest.id,
      locale,
      name: payload.name.trim(),
      slug,
      shortDescription: payload.shortDescription?.trim() || null,
      objective: payload.objective?.trim() || null,
    });

    const domainIds = await resolveDomainIdsByLabels(tx, payload.domains ?? [], locale);
    const tagIds = await resolveTagIdsByLabels(tx, payload.tags ?? [], locale);
    const themeIds = await resolveThemeIdsByLabels(tx, payload.themes ?? [], locale);

    if (domainIds.length) {
      await tx.insert(testDomains).values(domainIds.map((id) => ({ testId: createdTest.id, domainId: id })));
    }
    if (tagIds.length) {
      await tx.insert(testTags).values(tagIds.map((id) => ({ testId: createdTest.id, tagId: id })));
    }
    if (themeIds.length) {
      await tx.insert(testThemes).values(themeIds.map((id) => ({ testId: createdTest.id, themeId: id })));
    }

    return createdTest.id;
  });

  const created = await getTestWithMetadata(createdId, locale);
  if (!created) {
    throw new Error('Impossible de recharger le test.');
  }

  return created;
}
