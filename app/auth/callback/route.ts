import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  
  const code = searchParams.get('code');
  // Le paramètre "next" peut être défini par le client lors de l'appel (ex: ?next=/dashboard)
  const next = searchParams.get('next') ?? '/fr/tests/manage';
  
  // Supabase ajoute souvent le type d'action dans l'URL (signup, recovery, invite, magiclink...)
  const type = searchParams.get('type');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignorer les erreurs d'écriture dans un Server Component
            }
          },
        },
      }
    );

    // 1. Échange du code contre une session (Gère: Login, Invite, Confirm Email, Magic Link)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 2. Détermination de l'URL de redirection finale
      let redirectTo = next;

      // CAS SPÉCIAL : Réinitialisation de mot de passe (Reset Password)
      if (type === 'recovery') {
        redirectTo = '/fr/account/update-password'; 
      }

      // 3. Construction de l'URL absolue (Gestion Vercel / Localhost)
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocal = origin.includes('localhost');
      
      let finalUrl = '';

      if (isLocal) {
        finalUrl = `${origin}${redirectTo}`;
      } else if (forwardedHost) {
        // En prod sur Vercel, on utilise le domaine réel (https)
        finalUrl = `https://${forwardedHost}${redirectTo}`;
      } else {
        finalUrl = `${origin}${redirectTo}`;
      }

      return NextResponse.redirect(finalUrl);
    }
  }

  // 4. Gestion d'erreur (Code invalide, expiré ou manquant)
  return NextResponse.redirect(`${origin}/fr/auth/auth-code-error`);
}