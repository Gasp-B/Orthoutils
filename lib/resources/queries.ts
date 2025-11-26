import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  pathologies,
  pathologyTranslations,
  resources,
  resourcesTranslations,
  resourceDomains,
  resourcePathologies,
  resourceTags,
  tags,
  tagsTranslations,
} from '@/lib/db/schema';
import { resourceSchema, type ResourceDto } from '@/lib/validation/resources';

function toIsoString(value: Date | string | null) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

export async function getResourceWithMetadata(
  id: string,
  locale: Locale = defaultLocale,
): Promise<ResourceDto | null> {
  const localizedResource = alias(resourcesTranslations, 'localized_resource');
  const fallbackResource = alias(resourcesTranslations, 'fallback_resource');
  
  const localizedDomain = alias(domainsTranslations, 'localized_domain');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
  
  const localizedTag = alias(tagsTranslations, 'localized_tag');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag');
  
  const localizedPathology = alias(pathologyTranslations, 'localized_pathology');
  const fallbackPathology = alias(pathologyTranslations, 'fallback_pathology');

  const titleExpression = sql<string>`COALESCE(MAX(${localizedResource.title}), MAX(${fallbackResource.title}), '')`;
  const descriptionExpression = sql<string | null>`COALESCE(MAX(${localizedResource.description}), MAX(${fallbackResource.description}))`;
  
  const domainLabelExpression = sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label}, '')`;
  const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label}, '')`;
  const pathologyLabelExpression = sql<string>`COALESCE(${localizedPathology.label}, ${fallbackPathology.label}, '')`;

  const rows = await getDb()
    .select({
      id: resources.id,
      type: resources.type,
      url: resources.url,
      createdAt: resources.createdAt,
      title: titleExpression,
      description: descriptionExpression,
      domains: sql<string[]>`COALESCE(array_agg(DISTINCT ${domainLabelExpression}) FILTER (WHERE ${domainLabelExpression} IS NOT NULL), '{}')`,
      tags: sql<string[]>`COALESCE(array_agg(DISTINCT ${tagLabelExpression}) FILTER (WHERE ${tagLabelExpression} IS NOT NULL), '{}')`,
      pathologies: sql<string[]>`COALESCE(array_agg(DISTINCT ${pathologyLabelExpression}) FILTER (WHERE ${pathologyLabelExpression} IS NOT NULL), '{}')`,
    })
    .from(resources)
    .leftJoin(localizedResource, and(eq(localizedResource.resourceId, resources.id), eq(localizedResource.locale, locale)))
    .leftJoin(fallbackResource, and(eq(fallbackResource.resourceId, resources.id), eq(fallbackResource.locale, defaultLocale)))
    .leftJoin(resourceDomains, eq(resources.id, resourceDomains.resourceId))
    .leftJoin(domains, eq(resourceDomains.domainId, domains.id))
    .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
    .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
    .leftJoin(resourceTags, eq(resources.id, resourceTags.resourceId))
    .leftJoin(tags, eq(resourceTags.tagId, tags.id))
    .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
    .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
    .leftJoin(resourcePathologies, eq(resources.id, resourcePathologies.resourceId))
    .leftJoin(pathologies, eq(resourcePathologies.pathologyId, pathologies.id))
    .leftJoin(localizedPathology, and(eq(localizedPathology.pathologyId, pathologies.id), eq(localizedPathology.locale, locale)))
    .leftJoin(fallbackPathology, and(eq(fallbackPathology.pathologyId, pathologies.id), eq(fallbackPathology.locale, defaultLocale)))
    .where(eq(resources.id, id))
    .groupBy(resources.id, resources.type, resources.url, resources.createdAt)
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return resourceSchema.parse({
    ...row,
    createdAt: toIsoString(row.createdAt),
    domains: row.domains ?? [],
    tags: row.tags ?? [],
    pathologies: row.pathologies ?? [],
  });
}