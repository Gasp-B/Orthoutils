// app/api/catalogue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getCatalogueTaxonomy } from '@/lib/navigation/catalogue';
// AJOUT : Import du client Supabase
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;

    // CORRECTION : Création explicite du client avec await
    const supabase = await createRouteHandlerSupabaseClient();

    // Passage du client à la fonction utilitaire
    const domains = await getCatalogueTaxonomy(locale, supabase);

    return NextResponse.json(
      { domains },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch catalogue taxonomy', error);
    const message =
      error instanceof Error ? error.message : 'Impossible de récupérer le catalogue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}