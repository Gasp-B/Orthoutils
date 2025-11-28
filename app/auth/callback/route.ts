import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

type AuthActionType = 'recovery' | 'invite' | 'signup' | 'magiclink';

function isSupportedType(type: string | null): type is AuthActionType {
  return type === 'recovery' || type === 'invite' || type === 'signup' || type === 'magiclink';
}

function resolveLocale(nextPath: string | null): (typeof routing.locales)[number] {
  if (!nextPath) {
    return routing.defaultLocale;
  }

  const [, possibleLocale] = nextPath.split('/');
  const matchedLocale = routing.locales.find((locale) => locale === possibleLocale);

  return matchedLocale ?? routing.defaultLocale;
}

function buildAbsoluteUrl(request: NextRequest, redirectPath: string) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  const host = forwardedHost ?? url.host;
  const protocol = forwardedProto ?? url.protocol.replace(':', '');

  return `${protocol}://${host}${redirectPath}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const type = searchParams.get('type');

  if (code && isSupportedType(type)) {
    const supabase = await createRouteHandlerSupabaseClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const locale = resolveLocale(next);
      const dashboardPath = next ?? `/${locale}/tests/manage`;
      const redirectTo =
        type === 'recovery'
          ? `/${locale}/account/update-password`
          : dashboardPath;

      return NextResponse.redirect(buildAbsoluteUrl(request, redirectTo));
    }
  }

  const fallbackUrl = buildAbsoluteUrl(
    request,
    `/${routing.defaultLocale}/auth/auth-code-error`
  );

  return NextResponse.redirect(fallbackUrl);
}