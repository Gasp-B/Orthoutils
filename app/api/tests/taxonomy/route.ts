
import { NextRequest, NextResponse } from 'next/server';
import { inArray, eq, and } from 'drizzle-orm';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  tags,
  tagsTranslations,
  themes,
  themeTranslations,
  themeDomains,
  resourceTypes,
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
type DomainTranslationRow = typeof domainsTranslations.$inferSelect;
type TagTranslationRow = typeof tagsTranslations.$inferSelect;
type ThemeTranslationRow = typeof themeTranslations.$inferSelect;
type ResourceTypeTranslationRow = typeof resourceTypesTranslations.$inferSelect;

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

    const db = getDb();

    const [
      domainRows,
      tagRows,
      themeRows,
      resourceTypeRows,
      themeDomainRows,
      allDomains,
      allTags,
      allThemes,
      allResourceTypes,
    ] =
      await Promise.all([
        db.select().from(domainsTranslations).where(inArray(domainsTranslations.locale, [locale, defaultLocale])),
        db.select().from(tagsTranslations).where(inArray(tagsTranslations.locale, [locale, defaultLocale])),
        db.select().from(themeTranslations).where(inArray(themeTranslations.locale, [locale, defaultLocale])),
        db.select().from(resourceTypesTranslations).where(inArray(resourceTypesTranslations.locale, [locale, defaultLocale])),
        db.select().from(themeDomains),
        db.select().from(domains),
        db.select().from(tags),
        db.select().from(themes),
        db.select().from(resourceTypes),
      ]);

    // Mapping
    const domainsById = new Map<string, DomainTranslationRow[]>();
    for (const r of domainRows) {
      const list = domainsById.get(r.domainId) ?? [];
      list.push(r);
      domainsById.set(r.domainId, list);
    }

    const tagsById = new Map<string, TagTranslationRow[]>();
    for (const r of tagRows) {
      const list = tagsById.get(r.tagId) ?? [];
      list.push(r);
      tagsById.set(r.tagId, list);
    }

    const themesById = new Map<string, ThemeTranslationRow[]>();
    for (const r of themeRows) {
      const list = themesById.get(r.themeId) ?? [];
      list.push(r);
      themesById.set(r.themeId, list);
    }

    const themeDomainsById = new Map<string, string[]>();
    for (const relation of themeDomainRows) {
      const existing = themeDomainsById.get(relation.themeId) ?? [];
      existing.push(relation.domainId);
      themeDomainsById.set(relation.themeId, existing);
    }

    const resourceTypesById = new Map<string, ResourceTypeTranslationRow[]>();
    for (const r of resourceTypeRows) {
      const list = resourceTypesById.get(r.resourceTypeId) ?? [];
      list.push(r);
      resourceTypesById.set(r.resourceTypeId, list);
    }

    // Build Response
    const localizedDomains = allDomains
      .map((d) => {
        const t = resolveTranslation(d.id, domainsById, locale, defaultLocale);
        return t ? { id: d.id, label: t.label, slug: t.slug, synonyms: t.synonyms ?? [] } : null;
      })
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .sort((a, b) => a.label.localeCompare(b.label));

    const localizedTags = allTags
      .map((t) => {
        const tr = resolveTranslation(t.id, tagsById, locale, defaultLocale);
        return tr
          ? {
              id: t.id,
              label: tr.label,
              synonyms: tr.synonyms ?? [],
              color: t.colorLabel,
            }
          : null;
      })
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .sort((a, b) => a.label.localeCompare(b.label));

    const localizedThemes = allThemes
      .map((p) => {
        const tr = resolveTranslation(p.id, themesById, locale, defaultLocale);
        const domainIds = themeDomainsById.get(p.id) ?? [];
        const localizedDomains = domainIds
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
              domains: localizedDomains,
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

// NOUVEAU: Gestion de l'update via PUT
export async function PUT(request: NextRequest) {
  try {
    const json = await request.json();
    // On suppose que l'ID est passé dans le corps
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

      // Update parent color
      if (payload.color !== undefined) {
        await db.update(tags).set({ colorLabel: payload.color }).where(eq(tags.id, entityId));
      }
      // Update translation
      await db.update(tagsTranslations)
        .set({ label: payload.value, synonyms: synonymsArray })
        .where(and(eq(tagsTranslations.tagId, entityId), eq(tagsTranslations.locale, locale)));

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (payload.type === 'domain') {
      const synonymsArray = parseSynonyms(payload.synonyms);
      // Update translation (slug should ideally be regenerated but skipped for simplicity here)
      await db.update(domainsTranslations)
        .set({ label: payload.value, synonyms: synonymsArray })
        .where(and(eq(domainsTranslations.domainId, entityId), eq(domainsTranslations.locale, locale)));

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (payload.type === 'resourceType') {
      await db
        .update(resourceTypesTranslations)
        .set({ label: payload.value })
        .where(
          and(
            eq(resourceTypesTranslations.resourceTypeId, entityId),
            eq(resourceTypesTranslations.locale, locale),
          ),
        );

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
