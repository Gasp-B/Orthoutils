import { eq, inArray } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  resources,
  resourcesTranslations,
  resourceDomains,
  resourceTags,
  resourcePathologies,
  domains,
  domainsTranslations,
  tags,
  tagsTranslations,
  pathologies,
  pathologyTranslations,
} from '@/lib/db/schema';
import {
  resourceInputSchema,
  resourceSchema,
  updateResourceInputSchema,
  type ResourceDto,
} from '@/lib/validation/resources';
import { generateUniqueSlug } from '@/lib/utils/slug';
// Vous devrez peut-être créer ce fichier queries.ts ou adapter l'import
import { getResourceWithMetadata } from './queries'; 

type DbClient = ReturnType<typeof getDb> & PostgresJsDatabase<Record<string, AnyPgTable>>;

// --- Fonctions utilitaires (identiques à celles des tests) ---
// Note: Dans un projet réel, on pourrait factoriser ces helpers 'upsert' dans un fichier shared/taxonomy.ts

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function upsertDomains(db: DbClient, domainLabels: string[], locale: Locale) {
  const normalized = normalizeList(domainLabels);
  if (normalized.length === 0) return [] as { id: string }[];

  const existingTranslations = await db
    .select({ domainId: domainsTranslations.domainId, label: domainsTranslations.label, locale: domainsTranslations.locale })
    .from(domainsTranslations)
    .where(inArray(domainsTranslations.label, normalized));

  const results: { id: string }[] = [];
  const reservedSlugs = new Set<string>();

  for (const label of normalized) {
    const translation = existingTranslations.find(t => t.label === label);
    let domainId = translation?.domainId;

    if (!domainId) {
      const [newDomain] = await db.insert(domains).values({}).returning({ id: domains.id });
      domainId = newDomain.id;
    }

    // Gestion du slug et traduction
    const slug = await generateUniqueSlug({
      db,
      name: label,
      table: domainsTranslations,
      slugColumn: domainsTranslations.slug,
      localeColumn: domainsTranslations.locale,
      locale,
      reserved: reservedSlugs
    });

    await db.insert(domainsTranslations)
      .values({ domainId, label, slug, locale })
      .onConflictDoUpdate({ target: [domainsTranslations.domainId, domainsTranslations.locale], set: { label } }); // On garde le slug existant si update

    results.push({ id: domainId });
  }
  return results;
}

async function upsertTags(db: DbClient, tagLabels: string[], locale: Locale) {
  const normalized = normalizeList(tagLabels);
  if (normalized.length === 0) return [] as { id: string }[];

  const existing = await db.select().from(tagsTranslations).where(inArray(tagsTranslations.label, normalized));
  const results: { id: string }[] = [];

  for (const label of normalized) {
    const match = existing.find(t => t.label === label);
    let tagId = match?.tagId;

    if (!tagId) {
      const [newTag] = await db.insert(tags).values({}).returning({ id: tags.id });
      tagId = newTag.id;
    }

    await db.insert(tagsTranslations)
      .values({ tagId, label, locale })
      .onConflictDoUpdate({ target: [tagsTranslations.tagId, tagsTranslations.locale], set: { label } });

    results.push({ id: tagId });
  }
  return results;
}

async function upsertPathologies(db: DbClient, pathologyLabels: string[], locale: Locale) {
  const normalized = normalizeList(pathologyLabels);
  if (normalized.length === 0) return [] as { id: string }[];

  const existing = await db.select().from(pathologyTranslations).where(inArray(pathologyTranslations.label, normalized));
  const results: { id: string }[] = [];
  const reservedSlugs = new Set<string>();

  for (const label of normalized) {
    const match = existing.find(t => t.label === label);
    let pathologyId = match?.pathologyId;

    if (!pathologyId) {
      const slug = await generateUniqueSlug({ db, name: label, table: pathologies, slugColumn: pathologies.slug, reserved: reservedSlugs });
      const [newPatho] = await db.insert(pathologies).values({ slug }).returning({ id: pathologies.id });
      pathologyId = newPatho.id;
    }

    await db.insert(pathologyTranslations)
      .values({ pathologyId, label, locale })
      .onConflictDoUpdate({ target: [pathologyTranslations.pathologyId, pathologyTranslations.locale], set: { label } });

    results.push({ id: pathologyId });
  }
  return results;
}

// --- Mutations Principales ---

export async function createResourceWithRelations(input: unknown): Promise<ResourceDto> {
  const payload = resourceInputSchema.parse(input);
  const locale = payload.locale ?? defaultLocale;

  const createdId = await getDb().transaction(async (tx) => {
    // 1. Upsert Taxonomie
    const [domainRecords, tagRecords, pathologyRecords] = await Promise.all([
      upsertDomains(tx as unknown as DbClient, payload.domains, locale),
      upsertTags(tx as unknown as DbClient, payload.tags, locale),
      upsertPathologies(tx as unknown as DbClient, payload.pathologies, locale),
    ]);

    // 2. Création Resource
    const [resource] = await tx.insert(resources)
      .values({ type: payload.type, url: payload.url })
      .returning({ id: resources.id });

    // 3. Création Traduction
    await tx.insert(resourcesTranslations).values({
      resourceId: resource.id,
      locale,
      title: payload.title,
      description: payload.description,
    });

    // 4. Liaisons Many-to-Many
    if (domainRecords.length) {
      await tx.insert(resourceDomains).values(domainRecords.map(d => ({ resourceId: resource.id, domainId: d.id })));
    }
    if (tagRecords.length) {
      await tx.insert(resourceTags).values(tagRecords.map(t => ({ resourceId: resource.id, tagId: t.id })));
    }
    if (pathologyRecords.length) {
      await tx.insert(resourcePathologies).values(pathologyRecords.map(p => ({ resourceId: resource.id, pathologyId: p.id })));
    }

    return resource.id;
  });

  // Relecture (nécessite d'implémenter getResourceWithMetadata dans queries.ts)
  const resource = await getResourceWithMetadata(createdId, locale);
  if (!resource) throw new Error("Erreur lors de la relecture de la ressource créée");
  
  return resourceSchema.parse(resource);
}

export async function updateResourceWithRelations(input: unknown): Promise<ResourceDto> {
  const payload = updateResourceInputSchema.parse(input);
  const locale = payload.locale ?? defaultLocale;

  await getDb().transaction(async (tx) => {
    // 1. Upsert Taxonomie
    const [domainRecords, tagRecords, pathologyRecords] = await Promise.all([
      upsertDomains(tx as unknown as DbClient, payload.domains, locale),
      upsertTags(tx as unknown as DbClient, payload.tags, locale),
      upsertPathologies(tx as unknown as DbClient, payload.pathologies, locale),
    ]);

    // 2. Update Resource
    await tx.update(resources)
      .set({ type: payload.type, url: payload.url })
      .where(eq(resources.id, payload.id));

    // 3. Update Traduction
    await tx.insert(resourcesTranslations)
      .values({ resourceId: payload.id, locale, title: payload.title, description: payload.description })
      .onConflictDoUpdate({
        target: [resourcesTranslations.resourceId, resourcesTranslations.locale],
        set: { title: payload.title, description: payload.description }
      });

    // 4. Sync Relations (Delete + Insert)
    
    // Domains
    await tx.delete(resourceDomains).where(eq(resourceDomains.resourceId, payload.id));
    if (domainRecords.length) {
      await tx.insert(resourceDomains).values(domainRecords.map(d => ({ resourceId: payload.id, domainId: d.id })));
    }

    // Tags
    await tx.delete(resourceTags).where(eq(resourceTags.resourceId, payload.id));
    if (tagRecords.length) {
      await tx.insert(resourceTags).values(tagRecords.map(t => ({ resourceId: payload.id, tagId: t.id })));
    }

    // Pathologies
    await tx.delete(resourcePathologies).where(eq(resourcePathologies.resourceId, payload.id));
    if (pathologyRecords.length) {
      await tx.insert(resourcePathologies).values(pathologyRecords.map(p => ({ resourceId: payload.id, pathologyId: p.id })));
    }
  });

  const resource = await getResourceWithMetadata(payload.id, locale);
  if (!resource) throw new Error("Erreur lors de la relecture de la ressource");

  return resourceSchema.parse(resource);
}