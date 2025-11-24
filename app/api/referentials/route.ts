import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  sections,
  sectionsTranslations,
  sectionSubsections,
  subsections,
  subsectionsTranslations,
  subsectionTags,
  tags,
  tagsTranslations,
} from '@/lib/db/schema';
import { referentialsResponseSchema } from '@/lib/validation/referentials';

function resolveLocale(request: NextRequest): Locale {
  // 1. Priorité au paramètre d'URL (ex: ?locale=fr)
  const { searchParams } = new URL(request.url);
  const queryLocale = searchParams.get('locale');

  if (queryLocale && locales.includes(queryLocale as Locale)) {
    return queryLocale as Locale;
  }

  // 2. Fallback sur les headers (ex: Client Component sans paramètre ou appel direct)
  const requestedLocale = request.headers.get('x-orthoutil-locale') ?? request.headers.get('accept-language');

  if (!requestedLocale) {
    return defaultLocale;
  }

  const normalizedLocale = requestedLocale.split(',')[0]?.split('-')[0]?.trim();

  if (normalizedLocale && locales.includes(normalizedLocale as Locale)) {
    return normalizedLocale as Locale;
  }

  return defaultLocale;
}

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request);

  try {
    const localizedSection = alias(sectionsTranslations, 'localized_section');
    const fallbackSection = alias(sectionsTranslations, 'fallback_section');
    const localizedSubsection = alias(subsectionsTranslations, 'localized_subsection');
    const fallbackSubsection = alias(subsectionsTranslations, 'fallback_subsection');
    const localizedTag = alias(tagsTranslations, 'localized_tag');
    const fallbackTag = alias(tagsTranslations, 'fallback_tag');

    const sectionLabelExpression = sql<string>`COALESCE(${localizedSection.label}, ${fallbackSection.label}, ${sections.name})`;
    const sectionDescriptionExpression = sql<string | null>`COALESCE(${localizedSection.description}, ${fallbackSection.description}, ${sections.description})`;
    const subsectionLabelExpression = sql<string>`COALESCE(${localizedSubsection.label}, ${fallbackSubsection.label}, ${subsections.name})`;
    const subsectionFormatLabelExpression = sql<string | null>`COALESCE(${localizedSubsection.formatLabel}, ${fallbackSubsection.formatLabel}, ${subsections.formatLabel})`;
    const subsectionColorLabelExpression = sql<string | null>`COALESCE(${localizedSubsection.colorLabel}, ${fallbackSubsection.colorLabel}, ${subsections.colorLabel})`;
    const subsectionNotesExpression = sql<string | null>`COALESCE(${localizedSubsection.notes}, ${fallbackSubsection.notes}, ${subsections.notes})`;
    const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label}, '')`;

    const rows = await getDb()
      .select({
        sectionId: sections.id,
        sectionLabel: sectionLabelExpression,
        sectionDescription: sectionDescriptionExpression,
        subsectionId: subsections.id,
        subsectionLabel: subsectionLabelExpression,
        subsectionFormatLabel: subsectionFormatLabelExpression,
        subsectionColorLabel: subsectionColorLabelExpression,
        subsectionNotes: subsectionNotesExpression,
        tagId: tags.id,
        tagLabel: tagLabelExpression,
        tagColorLabel: tags.colorLabel,
      })
      .from(sections)
      .leftJoin(localizedSection, and(eq(localizedSection.sectionId, sections.id), eq(localizedSection.locale, locale)))
      .leftJoin(fallbackSection, and(eq(fallbackSection.sectionId, sections.id), eq(fallbackSection.locale, defaultLocale)))
      .leftJoin(sectionSubsections, eq(sectionSubsections.sectionId, sections.id))
      .leftJoin(subsections, eq(sectionSubsections.subsectionId, subsections.id))
      .leftJoin(
        localizedSubsection,
        and(eq(localizedSubsection.subsectionId, subsections.id), eq(localizedSubsection.locale, locale)),
      )
      .leftJoin(
        fallbackSubsection,
        and(eq(fallbackSubsection.subsectionId, subsections.id), eq(fallbackSubsection.locale, defaultLocale)),
      )
      .leftJoin(subsectionTags, eq(subsections.id, subsectionTags.subsectionId))
      .leftJoin(tags, eq(subsectionTags.tagId, tags.id))
      .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
      .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
      .orderBy(sectionLabelExpression, subsectionLabelExpression, tagLabelExpression);

    const sectionsById = new Map<
      string,
      {
        id: string;
        name: string;
        description: string | null;
        subsections: Map<
          string,
          {
            id: string;
            name: string;
            formatLabel: string | null;
            colorLabel: string | null;
            notes: string | null;
            tags: Map<string, { id: string; name: string; colorLabel: string | null }>;
          }
        >;
      }
    >();

    for (const row of rows) {
      if (!row.sectionId || !row.sectionLabel) {
        continue;
      }

      const section =
        sectionsById.get(row.sectionId) ??
        {
          id: row.sectionId,
          name: row.sectionLabel,
          description: row.sectionDescription ?? null,
          subsections: new Map(),
        };

      if (!sectionsById.has(row.sectionId)) {
        sectionsById.set(row.sectionId, section);
      }

      if (!row.subsectionId || !row.subsectionLabel) {
        continue;
      }

      const subsection =
        section.subsections.get(row.subsectionId) ??
        {
          id: row.subsectionId,
          name: row.subsectionLabel,
          formatLabel: row.subsectionFormatLabel ?? null,
          colorLabel: row.subsectionColorLabel ?? null,
          notes: row.subsectionNotes ?? null,
          tags: new Map(),
        };

      if (!section.subsections.has(row.subsectionId)) {
        section.subsections.set(row.subsectionId, subsection);
      }

      if (row.tagId && row.tagLabel) {
        subsection.tags.set(row.tagId, {
          id: row.tagId,
          name: row.tagLabel,
          colorLabel: row.tagColorLabel ?? null,
        });
      }
    }

    const payload = referentialsResponseSchema.parse({
      referentials: Array.from(sectionsById.values()).map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description ?? null,
        subsections: Array.from(section.subsections.values()).map((subsection) => ({
          id: subsection.id,
          name: subsection.name,
          formatLabel: subsection.formatLabel ?? null,
          colorLabel: subsection.colorLabel ?? null,
          notes: subsection.notes ?? null,
          tags: Array.from(subsection.tags.values()),
        })),
      })),
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch referentials from Supabase', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les référentiels';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}