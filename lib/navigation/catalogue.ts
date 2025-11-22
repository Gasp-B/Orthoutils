import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { domains, tags, testDomains, testTags } from '@/lib/db/schema';
import { slugify } from '@/lib/utils/slug';

export type CatalogueTag = { id: string; label: string; slug: string };
export type CatalogueDomain = { id: string; label: string; slug: string; tags: CatalogueTag[] };

export async function getCatalogueTaxonomy(): Promise<CatalogueDomain[]> {
  const db = getDb();

  const [domainRows, tagRows, domainTagRelations] = await Promise.all([
    db
      .select({ id: domains.id, label: domains.label, slug: domains.slug })
      .from(domains)
      .orderBy(asc(domains.label)),
    db
      .select({ id: tags.id, label: tags.label })
      .from(tags)
      .orderBy(asc(tags.label)),
    db
      .select({ domainId: testDomains.domainId, tagId: testTags.tagId })
      .from(testDomains)
      .innerJoin(testTags, eq(testDomains.testId, testTags.testId)),
  ]);

  // 🔧 bugfix: ...tag (pas .tag)
  const tagsById = new Map<string, CatalogueTag>(
    tagRows.map((tag) => [tag.id, { ...tag, slug: slugify(tag.label) }]),
  );

  const tagsByDomain = new Map<string, CatalogueTag[]>();

  for (const relation of domainTagRelations) {
    const tag = tagsById.get(relation.tagId);
    if (!tag) continue;

    const existing = tagsByDomain.get(relation.domainId) ?? [];

    if (!existing.some((item) => item.id === tag.id)) {
      existing.push(tag);
      tagsByDomain.set(relation.domainId, existing);
    }
  }

  // 🔧 pas de fallbackTags → domaine sans tests = aucun tag
  return domainRows.map((domain) => ({
    ...domain,
    tags: tagsByDomain.get(domain.id) ?? [],
  }));
}