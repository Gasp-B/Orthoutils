import crypto from 'crypto';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from './i18n/routing';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

const rateLimitStore = new Map<string, { count: number; expires: number }>();

function getClientKey(request: NextRequest) {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'global';
}

function getUpdatedEntry(key: string) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (!existing || existing.expires < now) {
    const freshEntry = { count: 0, expires: now + WINDOW_MS };
    rateLimitStore.set(key, freshEntry);
    return freshEntry;
  }
  return existing;
}

function getConnectSources() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  // Remplacer https:// par wss:// pour les websockets Supabase
  const supabaseWss = supabaseUrl.replace(/^https:\/\//, 'wss://');
  
  return [
    "'self'", 
    supabaseUrl, 
    supabaseWss,
    "https://vercel.live", 
    "https://*.vercel.live"
  ].filter(Boolean).join(' ');
}

function buildNonce() {
  return crypto.randomBytes(16).toString('base64');
}

function getSecurityHeaders(nonce: string) {
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://vercel.live',
    'https://*.vercel.live',
  ];
  
  const styleSources = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://vercel.live',
    'https://*.vercel.live',
  ];

  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://vercel.live https://*.vercel.live",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    `connect-src ${getConnectSources()}`,
    "frame-src 'self' https://vercel.live https://*.vercel.live",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');

  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-XSS-Protection', value: '0' },
    { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  ];
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set('x-nonce', nonce);
  for (const { key, value } of getSecurityHeaders(nonce)) {
    response.headers.set(key, value);
  }
}

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // 1. Rate Limiting
  const key = getClientKey(request);
  const entry = getUpdatedEntry(key);
  const nonce = buildNonce();
  
  // CORRECTION MAJEURE : On modifie les headers de la requête entrante
  // pour que intlMiddleware et Next.js voient le x-nonce.
  request.headers.set('x-nonce', nonce);

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const limitedResponse = new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': `${Math.ceil((entry.expires - Date.now()) / 1000)}`,
        'X-RateLimit-Limit': `${MAX_REQUESTS}`,
        'X-RateLimit-Remaining': '0',
      },
    });
    applySecurityHeaders(limitedResponse, nonce);
    return limitedResponse;
  }

  // 2. Gestion de la session Supabase
  // On crée une réponse temporaire juste pour gérer les cookies Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  // 3. Exclusion des routes API et Auth
  if (request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/auth')) {
    applySecurityHeaders(response, nonce);
    return response;
  }

  // 4. Exécution du middleware next-intl avec la requête modifiée (qui contient x-nonce)
  const i18nResponse = intlMiddleware(request);

  // 5. Transfert des Headers et Cookies
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      i18nResponse.headers.set(key, value);
    }
  });

  const supabaseCookies = response.cookies.getAll();
  supabaseCookies.forEach((cookie) => {
    i18nResponse.cookies.set(cookie);
  });

  // Application finale des headers de sécurité sur la réponse i18n
  applySecurityHeaders(i18nResponse, nonce);
  
  // Headers Rate Limit
  i18nResponse.headers.set('X-RateLimit-Limit', `${MAX_REQUESTS}`);
  i18nResponse.headers.set('X-RateLimit-Remaining', `${Math.max(0, MAX_REQUESTS - entry.count)}`);
  i18nResponse.headers.set('X-RateLimit-Reset', `${entry.expires}`);

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};