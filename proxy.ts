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
  if (realIp) {
    return realIp;
  }

  const connectingIp = request.headers.get('cf-connecting-ip');
  if (connectingIp) {
    return connectingIp;
  }

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
  const supabaseWss = supabaseUrl.replace('https://', 'wss://');
  
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
  const isProduction = process.env.VERCEL_ENV === 'production';

  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://vercel.live',
    'https://*.vercel.live',
  ];

  if (!isProduction) {
    scriptSources.push("'unsafe-eval'");
  }

  const styleSources = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://vercel.live',
    'https://*.vercel.live',
  ];

  if (!isProduction) {
    styleSources.push("'unsafe-inline'");
  }

  const scriptSrc = `script-src ${scriptSources.join(' ')}`;
  const styleSrc = `style-src ${styleSources.join(' ')}`;
  
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://vercel.live https://*.vercel.live",
    "object-src 'none'",
    scriptSrc,
    styleSrc,
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

export async function proxy(request: NextRequest) {
  // 1. Rate Limiting
  const key = getClientKey(request);
  const entry = getUpdatedEntry(key);
  const nonce = buildNonce();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);

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

  // 2. Initialisation de la réponse
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 3. Supabase Auth : Rafraîchissement de session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    }
  );

  // Ceci rafraîchit le token si nécessaire
  await supabase.auth.getUser();

  // 4. Rate Limit Headers
  response.headers.set('X-RateLimit-Limit', `${MAX_REQUESTS}`);
  response.headers.set('X-RateLimit-Remaining', `${Math.max(0, MAX_REQUESTS - entry.count)}`);
  response.headers.set('X-RateLimit-Reset', `${entry.expires}`);

  applySecurityHeaders(response, nonce);

  // 5. Gestion API : Retour direct
  if (request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }

  // 6. Gestion i18n (Next-Intl)
  const i18nResponse = intlMiddleware(request);

  // Fusion des headers de sécurité et des cookies Supabase dans la réponse i18n
  response.headers.forEach((value, key) => {
    i18nResponse.headers.set(key, value);
  });
  
  // Important : copier les cookies de session Supabase vers la réponse finale
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    i18nResponse.headers.set('set-cookie', setCookie);
  }

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};