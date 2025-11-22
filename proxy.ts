import crypto from 'crypto';
import type { Redirect, Rewrite } from 'next/dist/lib/load-custom-routes';
import type { NextConfig } from 'next';
import { NextResponse, type NextRequest } from 'next/server';

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
  return ["'self'", supabaseUrl].filter(Boolean).join(' ');
}

function buildNonce() {
  return crypto.randomBytes(16).toString('base64');
}

function getSecurityHeaders(_nonce: string) {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${getConnectSources()}`,
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
  for (const { key, value } of getSecurityHeaders(nonce)) {
    response.headers.set(key, value);
  }
}

export function proxy(request: NextRequest) {
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

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('X-RateLimit-Limit', `${MAX_REQUESTS}`);
  response.headers.set('X-RateLimit-Remaining', `${Math.max(0, MAX_REQUESTS - entry.count)}`);
  response.headers.set('X-RateLimit-Reset', `${entry.expires}`);

  applySecurityHeaders(response, nonce);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};

export const rewrites = (): Rewrite[] => [];

export const redirects = (): Redirect[] => [];

export const proxyConfig: NextConfig = {
  rewrites,
  redirects,
};
