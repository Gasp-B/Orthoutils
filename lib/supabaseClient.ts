import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const browserSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const browserSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serverSupabaseUrl = process.env.SUPABASE_URL ?? browserSupabaseUrl;
const serverServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

type GenericSupabaseClient = SupabaseClient<Record<string, unknown>>;

const isBrowserEnvConfigured = Boolean(browserSupabaseUrl && browserSupabaseAnonKey);
const isServerEnvConfigured = Boolean(serverSupabaseUrl && serverServiceRoleKey);

if (!isBrowserEnvConfigured) {
  console.warn(
    "Les variables d'environnement Supabase pour le navigateur ne sont pas définies. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pour activer le client côté navigateur.",
  );
}

if (!isServerEnvConfigured) {
  console.warn(
    "Les variables d'environnement Supabase côté serveur sont manquantes. Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour activer les clients privilégiés.",
  );
}

const browserClient =
  isBrowserEnvConfigured && browserSupabaseUrl && browserSupabaseAnonKey
    ? createBrowserClient(browserSupabaseUrl, browserSupabaseAnonKey)
    : null;

export const supabaseClient = browserClient;

export const supabaseAdmin =
  isServerEnvConfigured && serverSupabaseUrl && serverServiceRoleKey
    ? (createClient(serverSupabaseUrl, serverServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }) as GenericSupabaseClient)
    : null;

export function createRouteHandlerSupabaseClient(): GenericSupabaseClient | null {
  if (!isServerEnvConfigured || !serverSupabaseUrl || !serverServiceRoleKey) {
    console.warn(
      '[supabase] Impossible de créer le client serveur : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.',
    );
    return null;
  }

  const cookieStore = cookies();

  const getCookieValue = (name: string): string | undefined => {
    const store = cookieStore as unknown as Awaited<ReturnType<typeof cookies>>;
    const cookie = store.get(name);

    if (cookie && typeof cookie === 'object' && typeof cookie.value === 'string') {
      return cookie.value;
    }

    return undefined;
  };

  const client = createServerClient<Record<string, unknown>, 'public'>(serverSupabaseUrl, serverServiceRoleKey, {
    cookies: {
      get: getCookieValue,
      set(_name: string, _value: string, _options: CookieOptions) {},
      remove(_name: string, _options: CookieOptions) {},
    },
  });

  return client as GenericSupabaseClient;
}
