import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { toolsCatalog } from '@/lib/db/schema';
import { toolsResponseSchema } from '@/lib/validation/tools';

type ToolRow = {
  id: string;
  title: string;
  category: string;
  color_label: string | null;
  tags: string[] | null;
  description: string | null;
  links: Array<{ label: string; url: string }> | null;
  notes: string | null;
  target_population: string | null;
  status: string;
  created_at: string;
};

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    const { data, error } = await supabase
      .from(toolsCatalog._.name)
      .select(
        [
          'id',
          'title',
          'category',
          'color_label',
          'tags',
          'description',
          'links',
          'notes',
          'target_population',
          'status',
          'created_at',
        ].join(','),
      );

    if (error) {
      throw error;
    }

    const rows = ((data as unknown as ToolRow[] | null) ?? []);

    const payload = toolsResponseSchema.parse({
      tools: rows.map((tool) => ({
        id: tool.id,
        title: tool.title,
        category: tool.category,
        colorLabel: tool.color_label ?? null,
        tags: tool.tags ?? [],
        description: tool.description ?? null,
        links: tool.links ?? [],
        notes: tool.notes ?? null,
        targetPopulation: tool.target_population ?? null,
        status: tool.status,
        createdAt: tool.created_at,
      })),
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch tools from Supabase', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les outils';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
