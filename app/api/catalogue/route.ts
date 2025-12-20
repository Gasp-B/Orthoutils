import { NextResponse } from 'next/server';
import { getCatalogueTaxonomy } from '@/lib/navigation/catalogue';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLocale = searchParams.get('locale');
  const locale = (locales.includes(requestedLocale as Locale)
    ? requestedLocale
    : defaultLocale) as Locale;

  try {
    const domains = await getCatalogueTaxonomy(locale);
    return NextResponse.json({ domains });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 });
  }
}
