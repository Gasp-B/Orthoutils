import { NextResponse } from 'next/server';
import { getCatalogueTaxonomy } from '@/lib/navigation/catalogue';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'fr';

  try {
    const domains = await getCatalogueTaxonomy(locale);
    return NextResponse.json({ domains });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 });
  }
}
