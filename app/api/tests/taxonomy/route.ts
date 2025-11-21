import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { domains, tags } from '@/lib/db/schema';
import { taxonomyResponseSchema } from '@/lib/validation/tests';

export async function GET() {
  try {
    const [domainRows, tagRows] = await Promise.all([
      getDb()
        .select({ id: domains.id, name: domains.name })
        .from(domains)
        .orderBy(asc(domains.name)),
      getDb()
        .select({ id: tags.id, label: tags.label })
        .from(tags)
        .orderBy(asc(tags.label)),
    ]);

    const payload = taxonomyResponseSchema.parse({
      domains: domainRows,
      tags: tagRows,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch taxonomy for tests', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les domaines et tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
