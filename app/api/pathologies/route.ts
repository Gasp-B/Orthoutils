import { NextResponse } from 'next/server';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

type PathologyTranslationRow = {
  pathology_id: string;
  locale: string;
  label: string;
  description: string | null;
  synonyms: string[] | null;
  pathologies: { id: string; slug: string; status?: string } | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const normalizedLocale = locale ?? defaultLocale;
    const q = searchParams.get('q')?.trim();
    const limitParam = Number(searchParams.get('limit') ?? 20);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;

    // CORRECTION : Ajout de 'await' ici
    const supabase = await createRouteHandlerSupabaseClient();

    const translationFilters = (searchLocale: Locale) => {
      const query = supabase
        .from('pathology_translations')
        .select('pathology_id, locale, label, description, synonyms, pathologies!inner(id, slug, status)')
        .eq('locale', searchLocale)
        .eq('pathologies.status', 'published')
        .order('label', { ascending: true })
        .limit(limit);

      if (q) {
        const like = `%${q}%`;
        query.or(`label.ilike.${like},description.ilike.${like}`);
      }

      return query.returns<PathologyTranslationRow[]>();
    };

    const { data, error } = await translationFilters(normalizedLocale);

    if (error) {
      throw error;
    }

    const rows = data ?? [];
    const hasResults = rows.length > 0;

    if (!hasResults && normalizedLocale !== defaultLocale) {
      const { data: fallbackData, error: fallbackError } = await translationFilters(defaultLocale);

      if (fallbackError) {
        throw fallbackError;
      }

      const fallbackRows = fallbackData ?? [];

      return NextResponse.json({
        items: fallbackRows.map((row) => ({
          id: row.pathologies?.id ?? row.pathology_id,
          slug: row.pathologies?.slug ?? '',
          label: row.label,
          description: row.description,
          synonyms: row.synonyms ?? [],
        })),
      });
    }

    return NextResponse.json({
      items: rows.map((row) => ({
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