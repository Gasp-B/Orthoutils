import { NextResponse } from 'next/server';
import { getTestsWithMetadata } from '@/lib/tests/queries';

export async function GET() {
  try {
    const tests = await getTestsWithMetadata();

    return NextResponse.json(
      { tests },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch tests', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les tests';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
