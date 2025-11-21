import { NextRequest, NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { domains, tags } from '@/lib/db/schema';
import {
  taxonomyDeletionSchema,
  taxonomyMutationSchema,
  taxonomyResponseSchema,
} from '@/lib/validation/tests';
import { createDomain, createTag, deleteDomain, deleteTag } from '@/lib/tests/taxonomy';

export async function GET() {
  try {
    const [domainRows, tagRows] = await Promise.all([
      getDb()
        .select({ id: domains.id, label: domains.label, slug: domains.slug })
        .from(domains)
        .orderBy(asc(domains.label)),
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

export async function POST(request: NextRequest) {
  try {
    const payload = taxonomyMutationSchema.parse(await request.json());

    if (payload.type === 'domain') {
      const created = await createDomain(payload.value);
      return NextResponse.json({ domain: created }, { status: 201 });
    }

    const created = await createTag(payload.value);
    return NextResponse.json({ tag: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create taxonomy entry', error);
    const message = error instanceof Error ? error.message : 'Impossible de créer cet élément';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = taxonomyDeletionSchema.parse(await request.json());

    if (payload.type === 'domain') {
      const deleted = await deleteDomain(payload.id);

      if (!deleted) {
        return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
      }

      return NextResponse.json({ domain: deleted }, { status: 200 });
    }

    const deleted = await deleteTag(payload.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    return NextResponse.json({ tag: deleted }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete taxonomy entry', error);
    const message = error instanceof Error ? error.message : "Impossible de supprimer cet élément";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
