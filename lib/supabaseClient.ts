import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// On privilégie la clé de rôle de service, sinon on tente la clé secrète (legacy/fallback)
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

type GenericSupabaseClient = SupabaseClient<Record<string, unknown>>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Les variables d'environnement Supabase ne sont pas définies. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pour activer la persistance côté client.",
  );
}

// Client navigateur (Singleton si possible pour éviter les fuites, mais ici createBrowserClient gère bien ça)
const browserClient =
  supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null;

export const supabaseClient = browserClient;

// Client Admin (côté serveur uniquement, contourne le RLS)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? (createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }) as GenericSupabaseClient)
    : null;

function assertValue<T>(value: T | null | undefined, message: string) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

// Client serveur pour les Route Handlers et Server Actions
// Doit être asynchrone car cookies() renvoie une Promise dans Next.js 15+
export async function createRouteHandlerSupabaseClient(): Promise<GenericSupabaseClient> {
  const cookieStore = await cookies();

  const client = createServerClient<Record<string, unknown>, 'public'>(
    assertValue(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL est requis'),
    assertValue(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY est requis'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignorer si appelé depuis un Server Component (lecture seule)
            // Cela peut arriver si ce client est utilisé hors d'un Route Handler/Action
          }
        },
      },
    },
  );

  return client as GenericSupabaseClient;
}

export function createSupabaseAdminClient(): GenericSupabaseClient {
  return createClient(
    assertValue(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL est requis'),
    assertValue(supabaseServiceKey, 'SUPABASE_SERVICE_ROLE_KEY est requis'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  ) as GenericSupabaseClient;
}
