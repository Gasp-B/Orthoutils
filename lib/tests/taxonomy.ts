import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { domains, tags, testDomains, testTags } from '@/lib/db/schema';
import { generateUniqueSlug } from '@/lib/utils/slug';

function normalizeValue(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('La valeur fournie est vide.');
  }

  return normalized;
}

export async function createDomain(name: string) {
  const normalized = normalizeValue(name);
  const db = getDb();

  const [existingDomain] = await db
    .select({ id: domains.id, name: domains.name })
    .from(domains)
    .where(eq(domains.name, normalized))
    .limit(1);

  if (existingDomain) {
    throw new Error('Ce domaine existe déjà.');
  }

  const slug = await generateUniqueSlug({
    db,
    name: normalized,
    table: domains,
    slugColumn: domains.slug,
    idColumn: domains.id,
  });

  const [created] = await db
    .insert(domains)
    .values({ name: normalized, slug })
    .onConflictDoNothing()
    .returning({ id: domains.id, name: domains.name });

  if (created) {
    return created;
  }

  const [existing] = await db
    .select({ id: domains.id, name: domains.name })
    .from(domains)
    .where(eq(domains.name, normalized))
    .limit(1);

  if (!existing) {
    throw new Error("Impossible de créer ou retrouver le domaine.");
  }

  return existing;
}

export async function createTag(name: string) {
  const normalized = normalizeValue(name);
  const db = getDb();

  const [existingTag] = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.name, normalized))
    .limit(1);

  if (existingTag) {
    throw new Error('Ce tag existe déjà.');
  }

  const [created] = await db
    .insert(tags)
    .values({ name: normalized })
    .onConflictDoNothing()
    .returning({ id: tags.id, name: tags.name });

  if (created) {
    return created;
  }

  const [existing] = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.name, normalized))
    .limit(1);

  if (!existing) {
    throw new Error("Impossible de créer ou retrouver le tag.");
  }

  return existing;
}

export async function deleteDomain(id: string) {
  const db = getDb();

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testDomains).where(eq(testDomains.domainId, id));

    const [removed] = await tx
      .delete(domains)
      .where(eq(domains.id, id))
      .returning({ id: domains.id, name: domains.name });

    return removed ?? null;
  });

  return deleted;
}

export async function deleteTag(id: string) {
  const db = getDb();

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testTags).where(eq(testTags.tagId, id));

    const [removed] = await tx
      .delete(tags)
      .where(eq(tags.id, id))
      .returning({ id: tags.id, name: tags.name });

    return removed ?? null;
  });

  return deleted;
}
