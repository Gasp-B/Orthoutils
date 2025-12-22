import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic'; // Assure que la route n'est pas mise en cache

function resolveLocale(nextPath: string | null): (typeof routing.locales)[number] {
  if (!nextPath) return routing.defaultLocale;
  const segment = nextPath.startsWith('/') ? nextPath.split('/')[1] : nextPath;
  const matchedLocale = routing.locales.find((l) => l === segment);
  return matchedLocale ?? routing.defaultLocale;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type'); // 'recovery', 'invite', etc.

  if (code) {
    const supabase = await createRouteHandlerSupabaseClient();

    // Échange le code contre une session (set-cookie est géré ici)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Détermination de la locale
      const locale = resolveLocale(next);
      
      // Logique spécifique pour le mot de passe oublié
      if (type === 'recovery') {
        // Redirection vers la page de changement de mot de passe
        return NextResponse.redirect(`${requestUrl.origin}/${locale}/account`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profile, error: profileError } = user
        ? await supabase.from('profiles').select('role').eq('id', user.id).single()
        : { data: null, error: null };

      if (profileError) {
        console.error('[Auth Callback] Failed to load user role:', profileError.message);
      }

      const isAdmin = profile?.role === 'admin';
      const targetPath = isAdmin ? `/${locale}/administration` : `/${locale}`;
      return NextResponse.redirect(`${requestUrl.origin}${targetPath}`);
    } else {
      console.error('[Auth Callback] Code exchange error:', error.message);
    }
  }

  // En cas d'erreur, redirection vers une page d'erreur
  return NextResponse.redirect(`${requestUrl.origin}/${routing.defaultLocale}/login?error=auth_code_error`);
}
