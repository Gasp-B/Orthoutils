import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { referentialsResponseSchema } from '@/lib/validation/referentials';

type ReferentialRow = {
  id: string;
  name: string;
  description: string | null;
  section_subsections: Array<{
    subsection: {
      id: string;
      name: string;
      format_label: string | null;
      color_label: string | null;
      notes: string | null;
      subsection_tags: Array<{
        tag: {
          id: string;
          name: string;
          color_label: string | null;
        } | null;
      }> | null;
    } | null;
  }> | null;
};

type ReferentialSubsectionRow = NonNullable<ReferentialRow['section_subsections']>[number]['subsection'];
type ReferentialTagRow = NonNullable<ReferentialSubsectionRow['subsection_tags']>[number]['tag'];

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    const { data, error } = await supabase
      .from('sections')
      .select(
        [
          'id',
          'name',
          'description',
          `section_subsections:section_subsections (
            subsection:subsections (
              id,
              name,
              format_label,
              color_label,
              notes,
              subsection_tags:subsection_tags (
                tag:tags (
                  id,
                  name,
                  color_label
                )
              )
            )
          )`,
        ].join(','),
      )
      .order('name', { ascending: true })
      .order('name', { foreignTable: 'section_subsections.subsection' });

    if (error) {
      throw error;
    }

    const rows = ((data as unknown as ReferentialRow[] | null) ?? []);

    const payload = referentialsResponseSchema.parse({
      referentials:
        rows.map((section) => ({
          id: section.id,
          name: section.name,
          description: section.description ?? null,
          subsections:
            section.section_subsections
              ?.map((link) => link.subsection)
              .filter((subsection): subsection is ReferentialSubsectionRow => Boolean(subsection))
              .map((subsection) => ({
                id: subsection.id,
                name: subsection.name,
                formatLabel: subsection.format_label ?? null,
                colorLabel: subsection.color_label ?? null,
                notes: subsection.notes ?? null,
                tags:
                  subsection.subsection_tags
                    ?.map((subsectionTag) => subsectionTag.tag)
                    .filter((tag): tag is ReferentialTagRow => Boolean(tag))
                    .map((tag) => ({
                      id: tag.id,
                      name: tag.name,
                      colorLabel: tag.color_label ?? null,
                    })) ?? [],
              })) ?? [],
        })) ?? [],
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
