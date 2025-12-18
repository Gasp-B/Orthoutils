import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  tags,
  tagsTranslations,
  pathologies,
  pathologyTranslations,
  testDomains,
  testTags,
  testPathologies,
  resourceTypes,
  resourceTypesTranslations,
} from '@/lib/db/schema';
import { generateUniqueSlug } from '@/lib/utils/slug';

function normalizeValue(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('La valeur fournie est vide.');
  }
  return normalized;
}

function normalizeSynonyms(synonyms: string | undefined | null) {
  if (!synonyms) return [] as string[];
  return synonyms
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

// --- DOMAINS ---

export async function createDomain(label: string, locale: Locale = defaultLocale, synonymsStr?: string) {
  const normalized = normalizeValue(label);
  const synonyms = normalizeSynonyms(synonymsStr);
  const db = getDb();

  const [existingTranslation] = await db
    .select({ id: domainsTranslations.id, domainId: domainsTranslations.domainId })
    .from(domainsTranslations)
    .where(eq(domainsTranslations.label, normalized))
    .limit(1);

  const domainId =
    existingTranslation?.domainId ?? (await db.insert(domains).values({}).returning({ id: domains.id }))[0]?.id;

  if (!domainId) throw new Error("Impossible de créer ou retrouver le domaine.");

  const slug = await generateUniqueSlug({
    db,
    name: normalized,
    table: domainsTranslations,
    slugColumn: domainsTranslations.slug,
    idColumn: domainsTranslations.id,
    localeColumn: domainsTranslations.locale,
    locale,
  });

  const [created] = await db
    .insert(domainsTranslations)
    .values({ domainId, label: normalized, slug, locale, synonyms })
    .onConflictDoUpdate({
      target: [domainsTranslations.domainId, domainsTranslations.locale],
      set: { label: normalized, slug, synonyms }, // slug update is optional strictly speaking but keeps sync
    })
    .returning({ id: domainsTranslations.domainId, label: domainsTranslations.label, synonyms: domainsTranslations.synonyms });

  return created;
}

export async function deleteDomain(id: string, locale: Locale = defaultLocale) {
  const db = getDb();
  const localized = alias(domainsTranslations, 'localized_del');
  const fallback = alias(domainsTranslations, 'fallback_del');

  const [translation] = await db
    .select({ label: sql<string>`COALESCE(${localized.label}, ${fallback.label}, '')` })
    .from(domains)
    .leftJoin(localized, and(eq(localized.domainId, domains.id), eq(localized.locale, locale)))
    .leftJoin(fallback, and(eq(fallback.domainId, domains.id), eq(fallback.locale, defaultLocale)))
    .where(eq(domains.id, id))
    .limit(1);

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testDomains).where(eq(testDomains.domainId, id));
    const [removed] = await tx.delete(domains).where(eq(domains.id, id)).returning({ id: domains.id });
    return removed ? { id: removed.id, label: translation?.label ?? '' } : null;
  });

  return deleted;
}

// --- TAGS ---

export async function createTag(label: string, color: string | null | undefined, locale: Locale = defaultLocale) {
  const normalized = normalizeValue(label);
  const db = getDb();

  const [existingTranslation] = await db
    .select({ id: tagsTranslations.id, tagId: tagsTranslations.tagId })
    .from(tagsTranslations)
    .where(eq(tagsTranslations.label, normalized))
    .limit(1);

  let tagId = existingTranslation?.tagId;

  if (!tagId) {
    const [newTag] = await db.insert(tags).values({ colorLabel: color }).returning({ id: tags.id });
    tagId = newTag?.id;
  } else if (color) {
    // Mise à jour de la couleur si le tag existe et qu'une couleur est fournie
    await db.update(tags).set({ colorLabel: color }).where(eq(tags.id, tagId));
  }

  if (!tagId) throw new Error('Impossible de créer ou retrouver le tag.');

  const [created] = await db
    .insert(tagsTranslations)
    .values({ tagId, label: normalized, locale })
    .onConflictDoUpdate({
      target: [tagsTranslations.tagId, tagsTranslations.locale],
      set: { label: normalized },
    })
    .returning({ id: tagsTranslations.tagId, label: tagsTranslations.label });

  return created;
}

export async function deleteTag(id: string, locale: Locale = defaultLocale) {
  const db = getDb();
  const localized = alias(tagsTranslations, 'localized_tag_del');
  const fallback = alias(tagsTranslations, 'fallback_tag_del');

  const [translation] = await db
    .select({ label: sql<string>`COALESCE(${localized.label}, ${fallback.label}, '')` })
    .from(tags)
    .leftJoin(localized, and(eq(localized.tagId, tags.id), eq(localized.locale, locale)))
    .leftJoin(fallback, and(eq(fallback.tagId, tags.id), eq(fallback.locale, defaultLocale)))
    .where(eq(tags.id, id))
    .limit(1);

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testTags).where(eq(testTags.tagId, id));
    const [removed] = await tx.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id });
    return removed ? { id: removed.id, label: translation?.label ?? '' } : null;
  });

  return deleted;
}

// --- PATHOLOGIES ---

export async function createPathology(
  label: string,
  description: string | null | undefined,
  synonymsStr: string | undefined,
  locale: Locale = defaultLocale
) {
  const normalized = normalizeValue(label);
  const db = getDb();
  const synonymsArray = normalizeSynonyms(synonymsStr);

  const [existingTranslation] = await db
    .select({ id: pathologyTranslations.pathologyId, pathologyId: pathologyTranslations.pathologyId })
    .from(pathologyTranslations)
    .where(eq(pathologyTranslations.label, normalized))
    .limit(1);

  let pathologyId = existingTranslation?.pathologyId;

  if (!pathologyId) {
    // Génération slug sur la table parente `pathologies`
    const slug = await generateUniqueSlug({
      db,
      name: normalized,
      table: pathologies,
      slugColumn: pathologies.slug,
    });
    const [newPatho] = await db.insert(pathologies).values({ slug }).returning({ id: pathologies.id });
    pathologyId = newPatho?.id;
  }

  if (!pathologyId) throw new Error('Impossible de créer ou retrouver la pathologie.');

  const [created] = await db
    .insert(pathologyTranslations)
    .values({ 
      pathologyId, 
      label: normalized, 
      description: description ?? null, 
      synonyms: synonymsArray, 
      locale 
    })
    .onConflictDoUpdate({
      target: [pathologyTranslations.pathologyId, pathologyTranslations.locale],
      set: { 
        label: normalized, 
        description: description ?? null,
        synonyms: synonymsArray 
      },
    })
    .returning({ id: pathologyTranslations.pathologyId, label: pathologyTranslations.label });

  return created;
}

export async function deletePathology(id: string, locale: Locale = defaultLocale) {
  const db = getDb();
  const localized = alias(pathologyTranslations, 'localized_patho_del');
  const fallback = alias(pathologyTranslations, 'fallback_patho_del');

  const [translation] = await db
    .select({ label: sql<string>`COALESCE(${localized.label}, ${fallback.label}, '')` })
    .from(pathologies)
    .leftJoin(localized, and(eq(localized.pathologyId, pathologies.id), eq(localized.locale, locale)))
    .leftJoin(fallback, and(eq(fallback.pathologyId, pathologies.id), eq(fallback.locale, defaultLocale)))
    .where(eq(pathologies.id, id))
    .limit(1);

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testPathologies).where(eq(testPathologies.pathologyId, id));
    const [removed] = await tx.delete(pathologies).where(eq(pathologies.id, id)).returning({ id: pathologies.id });
    return removed ? { id: removed.id, label: translation?.label ?? '' } : null;
  });

  return deleted;
}

// --- RESOURCE TYPES ---

export async function createResourceType(label: string, locale: Locale = defaultLocale) {
  const normalized = normalizeValue(label);
  const db = getDb();

  const [existingTranslation] = await db
    .select({ id: resourceTypesTranslations.id, resourceTypeId: resourceTypesTranslations.resourceTypeId })
    .from(resourceTypesTranslations)
    .where(eq(resourceTypesTranslations.label, normalized))
    .limit(1);

  const resourceTypeId =
    existingTranslation?.resourceTypeId ??
    (await db.insert(resourceTypes).values({}).returning({ id: resourceTypes.id }))[0]?.id;

  if (!resourceTypeId) throw new Error('Impossible de créer ou retrouver le type de ressource.');

  const [created] = await db
    .insert(resourceTypesTranslations)
    .values({ resourceTypeId, label: normalized, locale })
    .onConflictDoUpdate({
      target: [resourceTypesTranslations.resourceTypeId, resourceTypesTranslations.locale],
      set: { label: normalized },
    })
    .returning({ id: resourceTypesTranslations.resourceTypeId, label: resourceTypesTranslations.label });

  return created;
}

export async function deleteResourceType(id: string, locale: Locale = defaultLocale) {
  const db = getDb();
  const localized = alias(resourceTypesTranslations, 'localized_res_type_del');
  const fallback = alias(resourceTypesTranslations, 'fallback_res_type_del');

  const [translation] = await db
    .select({ label: sql<string>`COALESCE(${localized.label}, ${fallback.label}, '')` })
    .from(resourceTypes)
    .leftJoin(localized, and(eq(localized.resourceTypeId, resourceTypes.id), eq(localized.locale, locale)))
    .leftJoin(fallback, and(eq(fallback.resourceTypeId, resourceTypes.id), eq(fallback.locale, defaultLocale)))
    .where(eq(resourceTypes.id, id))
    .limit(1);

  const deleted = await db.transaction(async (tx) => {
    const [removed] = await tx.delete(resourceTypes).where(eq(resourceTypes.id, id)).returning({ id: resourceTypes.id });
    return removed ? { id: removed.id, label: translation?.label ?? '' } : null;
  });

  return deleted;
}
