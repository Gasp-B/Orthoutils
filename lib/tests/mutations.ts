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
} from '@/lib/db/schema';
import { getTestWithMetadata } from '@/lib/tests/queries';
import { testAdminUpdateSchema } from '@/lib/validation/tests';

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
      payload.themes !== undefined;

    if (shouldTouchTest) {
      const updates: Partial<typeof tests.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (payload.status !== undefined) updates.status = payload.status;
      if (payload.targetAudience !== undefined) updates.targetAudience = payload.targetAudience;

      await tx.update(tests).set(updates).where(eq(tests.id, payload.id));
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
