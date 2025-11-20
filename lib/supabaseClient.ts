import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

type GenericSupabaseClient = SupabaseClient<Record<string, unknown>>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Les variables d'environnement Supabase ne sont pas définies. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pour activer la persistance côté client.",
  );
}

const browserClient =
  supabaseUrl && supabaseAnonKey ? createBrowserClient(supabaseUrl, supabaseAnonKey) : null;

export const supabaseClient = browserClient;

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

export function createRouteHandlerSupabaseClient(): GenericSupabaseClient {
  const cookieStore = cookies();

  const getCookieValue = (name: string): string | undefined => {
    const store = cookieStore as unknown as Awaited<ReturnType<typeof cookies>>;
    const cookie = store.get(name);

    if (cookie && typeof cookie === 'object' && typeof cookie.value === 'string') {
      return cookie.value;
    }

    return undefined;
  };

  const client = createServerClient<Record<string, unknown>, 'public'>(
    assertValue(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL est requis'),
    assertValue(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY est requis'),
    {
      cookies: {
        get: getCookieValue,
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    },
  );

  return client as GenericSupabaseClient;
}

