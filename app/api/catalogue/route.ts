// app/api/catalogue/route.ts
import { NextResponse } from 'next/server';
import { getCatalogueTaxonomy } from '@/lib/navigation/catalogue';

export async function GET() {
  try {
    const domains = await getCatalogueTaxonomy();

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
