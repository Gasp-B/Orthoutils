import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';

const db = getDb();

type PathologyRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  synonyms: string[] | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locale = searchParams.get('locale') ?? 'fr';
    const q = searchParams.get('q')?.trim();
    const limit = Number(searchParams.get('limit') ?? 20);

    // Pas de recherche : on renvoie juste la liste limitée, triée par label
    if (!q) {
      const rows = await db.execute<PathologyRow>(
        sql`
          SELECT
            p.id,
            p.slug,
            t.label,
            t.description,
            t.synonyms
          FROM pathologies p
          JOIN pathology_translations t
            ON t.pathology_id = p.id
           AND t.locale = ${locale}
          ORDER BY t.label ASC
          LIMIT ${limit}
        `,
      );

      return NextResponse.json({ items: rows });
    }

    const likeQ = `%${q}%`;

    // Recherche sur label + description dans la locale demandée
    const rows = await db.execute<PathologyRow>(
      sql`
        SELECT
          p.id,
          p.slug,
          t.label,
          t.description,
          t.synonyms
        FROM pathologies p
        JOIN pathology_translations t
          ON t.pathology_id = p.id
         AND t.locale = ${locale}
        WHERE
          t.label ILIKE ${likeQ}
          OR t.description ILIKE ${likeQ}
        ORDER BY t.label ASC
        LIMIT ${limit}
      `,
    );

    if (rows.length > 0) {
      return NextResponse.json({ items: rows });
    }

    // Fallback FR si aucune correspondance dans la locale
    const frRows = await db.execute<PathologyRow>(
      sql`
        SELECT
          p.id,
          p.slug,
          t.label,
          t.description,
          t.synonyms
        FROM pathologies p
        JOIN pathology_translations t
          ON t.pathology_id = p.id
         AND t.locale = 'fr'
        WHERE
          t.label ILIKE ${likeQ}
          OR t.description ILIKE ${likeQ}
        ORDER BY t.label ASC
        LIMIT ${limit}
      `,
    );

    return NextResponse.json({ items: frRows });
  } catch (err) {
    console.error('[GET /api/pathologies] Error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
