import { sql } from 'drizzle-orm';

// Drizzle migration to add localized tag synonyms
export type MigrationClient = { execute: (query: ReturnType<typeof sql>) => Promise<unknown> };

export async function up(db: MigrationClient): Promise<void> {
  await db.execute(
    sql`ALTER TABLE "tags_translations" ADD COLUMN IF NOT EXISTS "synonyms" text[] NOT NULL DEFAULT '{}'::text[];`,
  );
}

export async function down(db: MigrationClient): Promise<void> {
  await db.execute(sql`ALTER TABLE "tags_translations" DROP COLUMN IF EXISTS "synonyms";`);
}
