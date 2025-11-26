import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { 
  domains, 
  domainsTranslations, 
  tags, 
  tagsTranslations 
} from '@/lib/db/schema';
import {
  taxonomyDeletionSchema,
  taxonomyMutationSchema,
  taxonomyResponseSchema,
} from '@/lib/validation/tests';
import { createDomain, createTag, deleteDomain, deleteTag } from '@/lib/tests/taxonomy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;

    // UTILISATION DE DRIZZLE AU LIEU DE SUPABASE CLIENT (Bypass RLS)
    const db = getDb();

    const [domainTranslationsRows, tagTranslationsRows, domainIdsRows, tagIdsRows] = await Promise.all([
      db
        .select({
          domain_id: domainsTranslations.domainId,
          locale: domainsTranslations.locale,
          label: domainsTranslations.label,
          slug: domainsTranslations.slug,
        })
        .from(domainsTranslations)
        .where(inArray(domainsTranslations.locale, [locale, defaultLocale])),
      db
        .select({
          tag_id: tagsTranslations.tagId,
          locale: tagsTranslations.locale,
          label: tagsTranslations.label,
        })
        .from(tagsTranslations)
        .where(inArray(tagsTranslations.locale, [locale, defaultLocale])),
      db.select({ id: domains.id }).from(domains),
      db.select({ id: tags.id }).from(tags),
    ]);

    const domainsById = new Map<string, typeof domainTranslationsRows>();
    for (const translation of domainTranslationsRows) {
      const existing = domainsById.get(translation.domain_id) ?? [];
      existing.push(translation);
      domainsById.set(translation.domain_id, existing);
    }

    const tagsById = new Map<string, typeof tagTranslationsRows>();
    for (const translation of tagTranslationsRows) {
      const existing = tagsById.get(translation.tag_id) ?? [];
      existing.push(translation);
      tagsById.set(translation.tag_id, existing);
    }

    const localizedDomains = domainIdsRows
      .map((row) => {
        const translations = domainsById.get(row.id) ?? [];
        const localized = translations.find((t) => t.locale === locale);
        const fallback = translations.find((t) => t.locale === defaultLocale);
        const label = localized?.label ?? fallback?.label;
        const slug = localized?.slug ?? fallback?.slug;

        if (!label || !slug) {
          return null;
        }

        return { id: row.id, label, slug };
      })
      .filter((d): d is { id: string; label: string; slug: string } => Boolean(d))
      .sort((a, b) => a.label.localeCompare(b.label));

    const localizedTags = tagIdsRows
      .map((row) => {
        const translations = tagsById.get(row.id) ?? [];
        const localized = translations.find((t) => t.locale === locale);
        const fallback = translations.find((t) => t.locale === defaultLocale);
        const label = localized?.label ?? fallback?.label;

        if (!label) {
          return null;
        }

        return { id: row.id, label };
      })
      .filter((t): t is { id: string; label: string } => Boolean(t))
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