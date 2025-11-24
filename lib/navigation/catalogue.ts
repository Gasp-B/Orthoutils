import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { slugify } from '@/lib/utils/slug';
import { defaultLocale, type Locale } from '@/i18n/routing';

// On récupère le type de retour de la fonction asynchrone pour typer correctement le client
type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>;

type DomainTranslationRow = { domain_id: string; locale: string; label: string; slug: string };
type TagTranslationRow = { tag_id: string; locale: string; label: string };
type TestDomainRow = { test_id: string; domain_id: string };
type TestTagRow = { test_id: string; tag_id: string };

export type CatalogueTag = { id: string; label: string; slug: string };
export type CatalogueDomain = { id: string; label: string; slug: string; tags: CatalogueTag[] };

export async function getCatalogueTaxonomy(
  locale: Locale = defaultLocale,
  client?: SupabaseClient,
): Promise<CatalogueDomain[]> {
  // IMPORTANT : on attend la création du client si celui-ci n'est pas fourni
  const supabase = client ?? (await createRouteHandlerSupabaseClient());

  const [testsResult] = await Promise.all([
    supabase.from('tests').select('id').eq('status', 'published').returns<{ id: string }[]>(),
  ]);

  if (testsResult.error) {
    throw testsResult.error;
  }

  const publishedTestIds = (testsResult.data ?? []).map((row) => row.id as string);

  if (publishedTestIds.length === 0) {
    return [];
  }

  const [testDomainsResult, testTagsResult] = await Promise.all([
    supabase.from('test_domains').select('test_id, domain_id').in('test_id', publishedTestIds),
    supabase.from('test_tags').select('test_id, tag_id').in('test_id', publishedTestIds),
  ]);

  if (testDomainsResult.error) {
    throw testDomainsResult.error;
  }

  if (testTagsResult.error) {
    throw testTagsResult.error;
  }

  const testDomainRows = (testDomainsResult.data ?? []) as TestDomainRow[];
  const testTagRows = (testTagsResult.data ?? []) as TestTagRow[];

  const domainIds = Array.from(new Set(testDomainRows.map((row) => row.domain_id)));
  const tagIds = Array.from(new Set(testTagRows.map((row) => row.tag_id)));

  if (domainIds.length === 0 || tagIds.length === 0) {
    return [];
  }

  const [domainTranslationsResult, tagTranslationsResult] = await Promise.all([
    supabase
      .from('domains_translations')
      .select('domain_id, locale, label, slug')
      .in('domain_id', domainIds)
      .in('locale', [locale, defaultLocale]),
    supabase
      .from('tags_translations')
      .select('tag_id, locale, label')
      .in('tag_id', tagIds)
      .in('locale', [locale, defaultLocale]),
  ]);

  if (domainTranslationsResult.error) {
    throw domainTranslationsResult.error;
  }

  if (tagTranslationsResult.error) {
    throw tagTranslationsResult.error;
  }

  const domainTranslations = (domainTranslationsResult.data ?? []) as DomainTranslationRow[];
  const tagTranslations = (tagTranslationsResult.data ?? []) as TagTranslationRow[];

  const domainsById = new Map<string, DomainTranslationRow[]>();
  for (const translation of domainTranslations) {
    const existing = domainsById.get(translation.domain_id) ?? [];
    existing.push(translation);
    domainsById.set(translation.domain_id, existing);
  }

  const tagsById = new Map<string, TagTranslationRow[]>();
  for (const translation of tagTranslations) {
    const existing = tagsById.get(translation.tag_id) ?? [];
    existing.push(translation);
    tagsById.set(translation.tag_id, existing);
  }

  const tagsByTest = new Map<string, string[]>();
  for (const relation of testTagRows) {
    const existing = tagsByTest.get(relation.test_id) ?? [];
    existing.push(relation.tag_id);
    tagsByTest.set(relation.test_id, existing);
  }

  const tagsByDomain = new Map<string, CatalogueTag[]>();
  for (const relation of testDomainRows) {
    const relatedTags = tagsByTest.get(relation.test_id) ?? [];

    for (const tagId of relatedTags) {
      const translations = tagsById.get(tagId) ?? [];
      const localized = translations.find((row) => row.locale === locale);
      const fallback = translations.find((row) => row.locale === defaultLocale);
      const label = localized?.label ?? fallback?.label;

      if (!label) {
        continue;
      }

      const tag: CatalogueTag = { id: tagId, label, slug: slugify(label) };
      const existing = tagsByDomain.get(relation.domain_id) ?? [];

      if (!existing.some((item) => item.id === tag.id)) {
        existing.push(tag);
        tagsByDomain.set(relation.domain_id, existing);
      }
    }
  }

  const uniqueDomains = Array.from(new Set(testDomainRows.map((row) => row.domain_id)));
  const domainItems: CatalogueDomain[] = uniqueDomains
    .map((id) => {
      const translations = domainsById.get(id) ?? [];
      const localized = translations.find((row) => row.locale === locale);
      const fallback = translations.find((row) => row.locale === defaultLocale);
      const label = localized?.label ?? fallback?.label;
      const slug = localized?.slug ?? fallback?.slug;

      if (!label || !slug) {
        return null;
      }

      return {
        id,
        label,
        slug,
        tags: tagsByDomain.get(id) ?? [],
      };
    })
    .filter((domain): domain is CatalogueDomain => Boolean(domain))
    .sort((a, b) => a.label.localeCompare(b.label));

  return domainItems;
}