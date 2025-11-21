import { and, like, ne } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[-_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type GenerateUniqueSlugParams<TTable extends AnyPgTable> = {
  db: PostgresJsDatabase<Record<string, unknown>>;
  name: string;
  table: TTable;
  slugColumn: AnyPgColumn;
  idColumn?: AnyPgColumn;
  excludeId?: string;
  reserved?: Set<string>;
};

export async function generateUniqueSlug<TTable extends AnyPgTable>({
  db,
  name,
  table,
  slugColumn,
  idColumn,
  excludeId,
  reserved = new Set<string>(),
}: GenerateUniqueSlugParams<TTable>): Promise<string> {
  const baseSlug = slugify(name) || 'item';
  const pattern = `${baseSlug}%`;

  const baseCondition = like(slugColumn, pattern);
  const condition = excludeId && idColumn ? and(baseCondition, ne(idColumn, excludeId)) : baseCondition;

  const existingRows = await db
    .select({ slug: slugColumn })
    .from(table)
    .where(condition);

  const taken = new Set<string>(reserved);
  for (const row of existingRows) {
    if (typeof row.slug === 'string') {
      taken.add(row.slug);
    }
  }

  let candidate = baseSlug;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  reserved.add(candidate);
  return candidate;
}
