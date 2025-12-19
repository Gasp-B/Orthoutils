import { and, eq, inArray } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  tags,
  tagsTranslations,
  testDomains,
  testTags,
  tests,
  testsTranslations,
  testThemes,
  themeTranslations,
  themes,
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
      // Correction: Ajout explicite de synonyms: []
      .values({ domainId: targetDomainId, label, slug, locale, synonyms: [] })
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
      (await db.insert(tags).values({ label }).returning({ id: tags.id }))[0]?.id;

    if (!targetTagId) {
      throw new Error('Impossible de créer ou retrouver le tag.');
    }

    await db
      .insert(tagsTranslations)
      // Correction: Ajout explicite de synonyms: [] pour éviter l'erreur de valeur par défaut
      .values({ tagId: targetTagId, label, locale, synonyms: [] })
      .onConflictDoUpdate({
        target: [tagsTranslations.tagId, tagsTranslations.locale],
        set: { label },
      });

    results.push({ id: targetTagId, label });
  }

  return results;
}

async function upsertThemes(db: DbClient, themeLabels: string[], locale: Locale) {
  const normalized = normalizeList(themeLabels);

  if (normalized.length === 0) {
    return [] as { id: string; label: string }[];
  }

  const existingTranslations = await db
    .select({
      themeId: themeTranslations.themeId,
      label: themeTranslations.label,
      locale: themeTranslations.locale,
    })
    .from(themeTranslations)
    .where(inArray(themeTranslations.label, normalized));

  const reservedSlugs = new Set<string>();
  const results: { id: string; label: string }[] = [];

  for (const label of normalized) {
    const translationForLocale = existingTranslations.find(
      (entry) => entry.label === label && entry.locale === locale,
    );
    const translationAnyLocale = existingTranslations.find((entry) => entry.label === label);

    let targetThemeId = translationForLocale?.themeId ?? translationAnyLocale?.themeId;

    if (!targetThemeId) {
      const slug = await generateUniqueSlug({
        db,
        name: label,
        table: themes,
        slugColumn: themes.slug,
        reserved: reservedSlugs,
      });

      const [created] = await db
