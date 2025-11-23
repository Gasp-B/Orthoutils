import { NextResponse } from 'next/server';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const normalizedLocale = locale ?? defaultLocale;
    const q = searchParams.get('q')?.trim();
    const limit = Number(searchParams.get('limit') ?? 20);
    const supabase = createRouteHandlerSupabaseClient();

    const translationFilters = (searchLocale: Locale) => {
      const query = supabase
        .from('pathology_translations')
        .select('pathology_id, locale, label, description, synonyms, pathologies(id, slug)')
        .eq('locale', searchLocale)
        .order('label', { ascending: true })
        .limit(limit);

      if (q) {
        const like = `%${q}%`;
        query.or(`label.ilike.${like},description.ilike.${like}`);
      }

      return query;
    };

    const { data, error } = await translationFilters(normalizedLocale);

    if (error) {
      throw error;
    }

    const hasResults = (data ?? []).length > 0;

    if (!hasResults && normalizedLocale !== defaultLocale) {
      const { data: fallbackData, error: fallbackError } = await translationFilters(defaultLocale);

      if (fallbackError) {
        throw fallbackError;
      }

      return NextResponse.json({
        items: (fallbackData ?? []).map((row) => ({
          id: row.pathologies?.id ?? row.pathology_id,
          slug: row.pathologies?.slug ?? '',
          label: row.label,
          description: row.description,
          synonyms: row.synonyms ?? [],
        })),
      });
    }

    return NextResponse.json({
      items: (data ?? []).map((row) => ({
        id: row.pathologies?.id ?? row.pathology_id,
        slug: row.pathologies?.slug ?? '',
        label: row.label,
        description: row.description,
        synonyms: row.synonyms ?? [],
      })),
    });
  } catch (err) {
    console.error('[GET /api/pathologies] Error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
