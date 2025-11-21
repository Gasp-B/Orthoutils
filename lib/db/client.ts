import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

type PostgresClient = Sql;

let cachedDb: PostgresJsDatabase | null = null;
let cachedClient: PostgresClient | null = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL est requis pour initialiser Drizzle.');
  }

  cachedClient = postgres(connectionString, { prepare: false });
  cachedDb = drizzle(cachedClient);

  return cachedDb;
}
