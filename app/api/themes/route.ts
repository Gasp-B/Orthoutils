import { NextResponse } from 'next/server';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

type ThemeTranslationRow = {
  theme_id: string;
  locale: string;
  label: string;
  description: string | null;
  synonyms: string[] | null;
  themes: { id: string; slug: string; status?: string } | null;
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
        .from('theme_translations')
        .select('theme_id, locale, label, description, synonyms, themes!inner(id, slug, status)')
        .eq('locale', searchLocale)
        .eq('themes.status', 'published')
        .order('label', { ascending: true })
        .limit(limit);

      if (q) {
        const like = `%${q}%`;
        query.or(`label.ilike.${like},description.ilike.${like}`);
      }

      return query.returns<ThemeTranslationRow[]>();
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
          id: row.themes?.id ?? row.theme_id,
          slug: row.themes?.slug ?? '',
          label: row.label,
          description: row.description,
          synonyms: row.synonyms ?? [],
        })),
      });
    }

    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.themes?.id ?? row.theme_id,
        slug: row.themes?.slug ?? '',
        label: row.label,
        description: row.description,
        synonyms: row.synonyms ?? [],
      })),
    });
  } catch (err) {
    console.error('[GET /api/themes] Error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
