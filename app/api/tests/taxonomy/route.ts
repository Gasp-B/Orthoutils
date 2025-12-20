import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { createRouteHandlerSupabaseClient, supabaseAdmin } from '@/lib/supabaseClient';
import {
  domainsTranslations,
  tags,
  tagsTranslations,
  // Ajout de l'import manquant ici
  resourceTypesTranslations, 
} from '@/lib/db/schema';
import {
  taxonomyDeletionSchema,
  taxonomyMutationSchema,
  taxonomyResponseSchema,
} from '@/lib/validation/tests';
import {
  createDomain,
  createTag,
  createTheme,
  updateTheme,
  deleteDomain,
  deleteTag,
  deleteTheme,
  createResourceType,
  deleteResourceType,
} from '@/lib/tests/taxonomy';

// Types helpers
type DomainTranslationRow = {
  domainId: string;
  locale: string;
  label: string;
  slug: string;
  synonyms: string[];
};

type TagTranslationRow = {
  tagId: string;
  locale: string;
  label: string;
  synonyms: string[];
};

type ThemeTranslationRow = {
  themeId: string;
  locale: string;
  label: string;
  description: string | null;
  synonyms: string[];
};

type ResourceTypeTranslationRow = {
  resourceTypeId: string;
  locale: string;
  label: string;
};

function resolveTranslation<T extends { locale: string }>(
  id: string,
  map: Map<string, T[]>,
  locale: string,
  defaultLoc: string,
): T | undefined {
  const list = map.get(id) ?? [];
  return list.find((x) => x.locale === locale) || list.find((x) => x.locale === defaultLoc);
}

function parseSynonyms(raw: string | null | undefined) {
  if (!raw) return [] as string[];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;

    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataClient = supabaseAdmin ?? supabase;

    const [
      domainRowsResult,
      tagRowsResult,
      themeRowsResult,
      resourceTypeRowsResult,
      themeDomainRowsResult,
      allTagsResult,
      allThemesResult,
      allResourceTypesResult,
      allDomainsResult,
    ] = await Promise.all([
      dataClient
        .from('domains_translations')
        .select('domain_id, locale, label, slug, synonyms')
        .in('locale', [locale, defaultLocale]),
      dataClient.from('tags_translations').select('tag_id, locale, label, synonyms').in('locale', [locale, defaultLocale]),
      dataClient
        .from('theme_translations')
        .select('theme_id, locale, label, description, synonyms')
        .in('locale', [locale, defaultLocale]),
      dataClient
        .from('resource_type_translations')
        .select('resource_type_id, locale, label')
        .in('locale', [locale, defaultLocale]),
      dataClient.from('theme_domains').select('theme_id, domain_id'),
      dataClient.from('tags').select('id, color_label'),
      dataClient.from('themes').select('id, slug'),
      dataClient.from('resource_types').select('id'),
      dataClient.from('domains').select('id'),
    ]);

    if (domainRowsResult.error) throw domainRowsResult.error;
    if (tagRowsResult.error) throw tagRowsResult.error;
    if (themeRowsResult.error) throw themeRowsResult.error;
    if (resourceTypeRowsResult.error) throw resourceTypeRowsResult.error;
    if (themeDomainRowsResult.error) throw themeDomainRowsResult.error;
    if (allTagsResult.error) throw allTagsResult.error;
    if (allThemesResult.error) throw allThemesResult.error;
    if (allResourceTypesResult.error) throw allResourceTypesResult.error;
    if (allDomainsResult.error) throw allDomainsResult.error;

    const domainRows = (domainRowsResult.data ?? []) as Array<{
      domain_id: string;
      locale: string;
      label: string;
      slug: string;
      synonyms: string[] | null;
    }>;
    const tagRows = (tagRowsResult.data ?? []) as Array<{
      tag_id: string;
      locale: string;
      label: string;
      synonyms: string[] | null;
    }>;
    const themeRows = (themeRowsResult.data ?? []) as Array<{
      theme_id: string;
      locale: string;
      label: string;
      description: string | null;
      synonyms: string[] | null;
    }>;
    const resourceTypeRows = (resourceTypeRowsResult.data ?? []) as Array<{
      resource_type_id: string;
      locale: string;
      label: string;
    }>;
    const themeDomainRows = (themeDomainRowsResult.data ?? []) as Array<{
      theme_id: string;
      domain_id: string;
    }>;
    const allTags = (allTagsResult.data ?? []) as Array<{ id: string; color_label: string | null }>;
    const allThemes = (allThemesResult.data ?? []) as Array<{ id: string; slug: string }>;
    const allResourceTypes = (allResourceTypesResult.data ?? []) as Array<{ id: string }>;
    const allDomains = (allDomainsResult.data ?? []) as Array<{ id: string }>;

    const domainsById = new Map<string, DomainTranslationRow[]>();
    for (const r of domainRows) {
      const list = domainsById.get(r.domain_id) ?? [];
      list.push({
        domainId: r.domain_id,
        locale: r.locale,
        label: r.label,
        slug: r.slug,
        synonyms: r.synonyms ?? [],
      });
      domainsById.set(r.domain_id, list);
    }

    const tagsById = new Map<string, TagTranslationRow[]>();
    for (const r of tagRows) {
      const list = tagsById.get(r.tag_id) ?? [];
      list.push({
        tagId: r.tag_id,
        locale: r.locale,
        label: r.label,
        synonyms: r.synonyms ?? [],
      });
      tagsById.set(r.tag_id, list);
    }

    const themesById = new Map<string, ThemeTranslationRow[]>();
    for (const r of themeRows) {
      const list = themesById.get(r.theme_id) ?? [];
      list.push({
        themeId: r.theme_id,
        locale: r.locale,
        label: r.label,
        description: r.description,
        synonyms: r.synonyms ?? [],
      });
      themesById.set(r.theme_id, list);
    }

    const themeDomainsById = new Map<string, string[]>();
    for (const relation of themeDomainRows) {
      const existing = themeDomainsById.get(relation.theme_id) ?? [];
      existing.push(relation.domain_id);
      themeDomainsById.set(relation.theme_id, existing);
    }

    const resourceTypesById = new Map<string, ResourceTypeTranslationRow[]>();
    for (const r of resourceTypeRows) {
      const list = resourceTypesById.get(r.resource_type_id) ?? [];
      list.push({
        resourceTypeId: r.resource_type_id,
        locale: r.locale,
        label: r.label,
      });
      resourceTypesById.set(r.resource_type_id, list);
    }

    const localizedDomains = allDomains
      .map((d) => {
        const t = resolveTranslation(d.id, domainsById, locale, defaultLocale);
        return t ? { id: d.id, label: t.label, slug: t.slug, synonyms: t.synonyms ?? [] } : null;
      })
      .filter((domain): domain is NonNullable<typeof domain> => Boolean(domain))
      .sort((a, b) => a.label.localeCompare(b.label));

    const tagColorsById = new Map(allTags.map((tag) => [tag.id, tag.color_label]));

    const localizedTags = allTags
      .map((t) => t.id)
      .concat(Array.from(tagsById.keys()))
      .filter((id, index, ids) => ids.indexOf(id) === index)
      .map((tagId) => {
        const tr = resolveTranslation(tagId, tagsById, locale, defaultLocale);
        return tr
          ? {
              id: tagId,
              label: tr.label,
              synonyms: tr.synonyms ?? [],
              color: tagColorsById.get(tagId) ?? null,
            }
          : null;
      })
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
      .sort((a, b) => a.label.localeCompare(b.label));

    const localizedThemes = allThemes
      .map((p) => {
        const tr = resolveTranslation(p.id, themesById, locale, defaultLocale);
        const domainIds = themeDomainsById.get(p.id) ?? [];
        const themeLocalizedDomains = domainIds
          .map((domainId) => {
            const translation = resolveTranslation(domainId, domainsById, locale, defaultLocale);
            return translation ? { id: domainId, label: translation.label } : null;
          })
          .filter((domain): domain is { id: string; label: string } => Boolean(domain));
        return tr
          ? {
              id: p.id,
              label: tr.label,
              slug: p.slug,
              description: tr.description,
              synonyms: tr.synonyms ?? [],
              domains: themeLocalizedDomains,
            }
          : null;
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .sort((a, b) => a.label.localeCompare(b.label));

    const localizedResourceTypes = allResourceTypes
      .map((type) => {
        const tr = resolveTranslation(type.id, resourceTypesById, locale, defaultLocale);
        return tr ? { id: type.id, label: tr.label } : null;
      })
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .sort((a, b) => a.label.localeCompare(b.label));

    const payload = taxonomyResponseSchema.parse({
      domains: localizedDomains,
      tags: localizedTags,
      themes: localizedThemes,
      resourceTypes: localizedResourceTypes,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch taxonomy', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = taxonomyMutationSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;

    if (payload.type === 'domain') {
      const created = await createDomain(payload.value, locale, payload.synonyms);
      return NextResponse.json({ domain: created }, { status: 201 });
    }

    if (payload.type === 'tag') {
      const created = await createTag(payload.value, payload.color, locale, payload.synonyms);
      return NextResponse.json({ tag: created }, { status: 201 });
    }

    if (payload.type === 'theme') {
      const created = await createTheme(
        payload.value,
        payload.description,
        payload.synonyms,
        payload.domainIds ?? [],
        locale,
      );
      return NextResponse.json({ theme: created }, { status: 201 });
    }

    if (payload.type === 'resourceType') {
      const created = await createResourceType(payload.value, locale);
      return NextResponse.json({ resourceType: created }, { status: 201 });
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  } catch (error) {
    console.error('Create taxonomy error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const json = await request.json();
    const { id, ...rest } = json; 
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID requis pour la mise à jour' }, { status: 400 });
    }
    
    const entityId = id;
    const payload = taxonomyMutationSchema.parse(rest);
    const locale = payload.locale ?? defaultLocale;
    const db = getDb();

    if (payload.type === 'theme') {
      await updateTheme({
        id: entityId,
        label: payload.value,
        description: payload.description,
        synonyms: payload.synonyms,
        domainIds: payload.domainIds ?? [],
        locale,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (payload.type === 'tag') {
      const synonymsArray = parseSynonyms(payload.synonyms);
      if (payload.color !== undefined) {
        await db.update(tags).set({ colorLabel: payload.color }).where(eq(tags.id, entityId));
      }
      await db.update(tagsTranslations)
        .set({ label: payload.value, synonyms: synonymsArray })
        .where(and(eq(tagsTranslations.tagId, entityId), eq(tagsTranslations.locale, locale)));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (payload.type === 'domain') {
      const synonymsArray = parseSynonyms(payload.synonyms);
      await db.update(domainsTranslations)
        .set({ label: payload.value, synonyms: synonymsArray })
        .where(and(eq(domainsTranslations.domainId, entityId), eq(domainsTranslations.locale, locale)));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (payload.type === 'resourceType') {
      // Correction ici: utilisation de l'import au lieu de require
      const trTable = resourceTypesTranslations;
      await db
        .update(trTable)
        .set({ label: payload.value })
        .where(and(eq(trTable.resourceTypeId, entityId), eq(trTable.locale, locale)));
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  } catch (error) {
    console.error('Update taxonomy error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = taxonomyDeletionSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    let deleted;

    if (payload.type === 'domain') deleted = await deleteDomain(payload.id, locale);
    else if (payload.type === 'tag') deleted = await deleteTag(payload.id, locale);
    else if (payload.type === 'theme') deleted = await deleteTheme(payload.id, locale);
    else if (payload.type === 'resourceType') deleted = await deleteResourceType(payload.id, locale);

    if (!deleted) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json({ deleted }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 400 });
  }
}