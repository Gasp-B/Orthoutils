import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getTestsWithMetadata } from '@/lib/tests/queries'; // Utilisez votre DAL existante !

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;

    // Appel propre à la couche de données (DAL)
    const tests = await getTestsWithMetadata(locale);

    return NextResponse.json(
      { tests },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Failed to fetch tests', error);
    return NextResponse.json({ error: 'Impossible de récupérer les tests' }, { status: 500 });
  }
}