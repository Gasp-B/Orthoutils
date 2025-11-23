import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import {
  taxonomyDeletionSchema,
  taxonomyMutationSchema,
  taxonomyResponseSchema,
} from '@/lib/validation/tests';
import { createDomain, createTag, deleteDomain, deleteTag } from '@/lib/tests/taxonomy';

type DomainTranslationRow = { domain_id: string; locale: string; label: string; slug: string };
type TagTranslationRow = { tag_id: string; locale: string; label: string };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;
    const supabase = createRouteHandlerSupabaseClient();

    const [domainTranslationsResult, tagTranslationsResult, domainIdsResult, tagIdsResult] = await Promise.all([
      supabase
        .from('domains_translations')
        .select('domain_id, locale, label, slug')
        .in('locale', [locale, defaultLocale]),
      supabase
        .from('tags_translations')
        .select('tag_id, locale, label')
        .in('locale', [locale, defaultLocale]),
      supabase.from('domains').select('id').returns<{ id: string }[]>(),
      supabase.from('tags').select('id').returns<{ id: string }[]>(),
    ]);

    if (domainTranslationsResult.error) {
      throw domainTranslationsResult.error;
    }

    if (tagTranslationsResult.error) {
      throw tagTranslationsResult.error;
    }

    if (domainIdsResult.error) {
      throw domainIdsResult.error;
    }

    if (tagIdsResult.error) {
      throw tagIdsResult.error;
    }

    const domainTranslations = (domainTranslationsResult.data ?? []) as DomainTranslationRow[];
    const tagTranslations = (tagTranslationsResult.data ?? []) as TagTranslationRow[];
    const domainIds = (domainIdsResult.data ?? []).map((row) => row.id as string);
    const tagIds = (tagIdsResult.data ?? []).map((row) => row.id as string);

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

    const localizedDomains = domainIds
      .map((id) => {
        const translations = domainsById.get(id) ?? [];
        const localized = translations.find((row) => row.locale === locale);
        const fallback = translations.find((row) => row.locale === defaultLocale);
        const label = localized?.label ?? fallback?.label;
        const slug = localized?.slug ?? fallback?.slug;

        if (!label || !slug) {
          return null;
        }

        return { id, label, slug };
      })
      .filter((domain): domain is { id: string; label: string; slug: string } => Boolean(domain))
      .sort((a, b) => a.label.localeCompare(b.label));

    const localizedTags = tagIds
      .map((id) => {
        const translations = tagsById.get(id) ?? [];
        const localized = translations.find((row) => row.locale === locale);
        const fallback = translations.find((row) => row.locale === defaultLocale);
        const label = localized?.label ?? fallback?.label;

        if (!label) {
          return null;
        }

        return { id, label };
      })
      .filter((tag): tag is { id: string; label: string } => Boolean(tag))
      .sort((a, b) => a.label.localeCompare(b.label));

    const payload = taxonomyResponseSchema.parse({
      domains: localizedDomains,
      tags: localizedTags,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch taxonomy for tests', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les domaines et tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = taxonomyMutationSchema.parse(await request.json());

    if (payload.type === 'domain') {
      const created = await createDomain(payload.value, payload.locale ?? defaultLocale);
      return NextResponse.json({ domain: created }, { status: 201 });
    }

    const created = await createTag(payload.value, payload.locale ?? defaultLocale);
    return NextResponse.json({ tag: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create taxonomy entry', error);
    const message = error instanceof Error ? error.message : 'Impossible de créer cet élément';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = taxonomyDeletionSchema.parse(await request.json());

    if (payload.type === 'domain') {
      const deleted = await deleteDomain(payload.id, payload.locale ?? defaultLocale);

      if (!deleted) {
        return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
      }

      return NextResponse.json({ domain: deleted }, { status: 200 });
    }

    const deleted = await deleteTag(payload.id, payload.locale ?? defaultLocale);

    if (!deleted) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    return NextResponse.json({ tag: deleted }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete taxonomy entry', error);
    const message = error instanceof Error ? error.message : "Impossible de supprimer cet élément";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
