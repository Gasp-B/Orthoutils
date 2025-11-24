# Repository Review — Security, Next.js 16, Data Layer, DX

## Key entry points
- **next.config.ts / proxy.ts**: Centralized middleware-style proxy adds rate limiting and security headers (CSP, referrer, frame, permissions). CSP now issues nonce-based `script-src`/`style-src` without `'unsafe-inline'` or `'unsafe-eval'`; the nonce is exposed via the `x-nonce` header for front-end integration. Connect sources include Supabase URL or wildcard. 【F:proxy.ts†L47-L119】
- **Vercel config**: `vercel.json` only defines build command/output. No headers or environment enforcement. 【F:vercel.json†L1-L4】
- **App layout**: Global layout sets static `metadataBase` to `https://othoutils.example.com`. Providers wrap all pages with a client-side React Query provider. 【F:app/layout.tsx†L1-L24】【F:app/providers.tsx†L1-L10】
- **API routes**: Route handlers under `app/api/**` implement read/write with Drizzle (e.g., `/api/tools`) and Supabase client for referentials. No server actions. 【F:app/api/tools/route.ts†L1-L120】【F:app/api/referentials/route.ts†L1-L70】
- **Supabase clients**: `lib/supabaseClient.ts` creates browser client from `NEXT_PUBLIC_*` vars and a `supabaseAdmin` using `SUPABASE_SERVICE_ROLE_KEY` (fallback to `SUPABASE_SECRET_KEY`). Route handlers use anon key via `createServerClient`. 【F:lib/supabaseClient.ts†L1-L68】
- **Drizzle schema**: Defined in `lib/db/schema.ts` for tools catalog, taxonomy, and tests; relies on `SUPABASE_DB_URL` in `lib/db/client.ts` to connect. Migrations exist under `supabase/migrations`. 【F:lib/db/schema.ts†L4-L147】【F:lib/db/client.ts†L1-L21】
- **DX/tooling**: TS strict=true but `allowJs` and `skipLibCheck`; ESLint disables `@typescript-eslint/no-unsafe-*` rules, potentially masking runtime issues. 【F:tsconfig.json†L3-L34】【F:eslint.config.mjs†L1-L36】

## Risks / smells
1. **CSP origin pinning & nonce propagation**: CSP now relies on nonces (no `'unsafe-inline'`/`'unsafe-eval'`), but `connect-src` still defaults to a wildcard Supabase host rather than a pinned project URL, and consumers must honor the `x-nonce` header to wire bundled scripts/styles. 【F:proxy.ts†L47-L119】
2. **Admin client optional & fallback secret key**: `supabaseAdmin` silently becomes `null` if service key missing and may rely on `SUPABASE_SECRET_KEY` (non-standard). Route handlers also use the anon key (`createServerClient`) even for server-only data, increasing reliance on RLS for access that likely targets public tables. 【F:lib/supabaseClient.ts†L5-L68】
3. **Metadata base hardcoded**: `metadataBase` points to `othoutils.example.com`, which can break canonical URLs/previews on other environments (Vercel preview, local) and can conflict with CSP origins. 【F:app/layout.tsx†L1-L18】
4. **Runtime rate limit store**: Rate limiting in `proxy.ts` stores counters in-memory; in serverless/Vercel this resets per instance and can lead to inconsistent protection. Not necessarily wrong but may give false sense of throttling. 【F:proxy.ts†L5-L115】
5. **Type safety loosened**: `allowJs`, `skipLibCheck`, and disabled `no-unsafe-*` lint rules reduce DX and mask unsafe Supabase/Drizzle usage, undermining the “TypeScript strict” goal. 【F:tsconfig.json†L3-L34】【F:eslint.config.mjs†L1-L36】

## Suggested minimal changes
1. **Harden CSP & explicit origins** (proxy.ts)
   - Remove `'unsafe-inline'`/`'unsafe-eval'`; use nonce/hashed scripts only if needed.
   - Pin `connect-src` to `https://<project>.supabase.co` (env) and `https://api.vercel.com` if required.
   ```ts
   const contentSecurityPolicy = [
     "default-src 'self'",
     "base-uri 'self'",
     "font-src 'self' data:",
     "img-src 'self' data:",
     "object-src 'none'",
     "script-src 'self'",
     "style-src 'self'",
     `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`,
     "frame-ancestors 'none'",
     "form-action 'self'",
   ].filter(Boolean).join('; ');
   ```
2. **Ensure server-only Supabase access** (lib/supabaseClient.ts)
   - Require `SUPABASE_SERVICE_ROLE_KEY` (no fallback) and throw if missing in server contexts.
   - Use the admin client in route handlers instead of anon key when reading/writing public catalog to avoid client-exposed policies.
   ```ts
   const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
   if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
   export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });
   ```
3. **Make metadata environment-aware** (app/layout.tsx)
   - Derive `metadataBase` from `process.env.NEXT_PUBLIC_SITE_URL` or omit to let Next infer, preventing invalid canonical links on previews.
   ```ts
   const metadataBase = process.env.NEXT_PUBLIC_SITE_URL
     ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
     : undefined;
   export const metadata = { title: '...', description: '...', metadataBase } satisfies Metadata;
   ```
4. **Document rate-limit limitations** (proxy.ts or README)
   - Add a comment noting that in-memory rate limiting is best-effort on serverless and should be backed by edge KV/Upstash if needed.
5. **Tighten DX safety rails** (tsconfig.json, eslint.config.mjs)
   - Consider disabling `allowJs` and enabling `skipLibCheck: false` for stricter typing.
   - Re-enable `@typescript-eslint/no-unsafe-*` rules or add targeted `satisfies`/types where needed.

## Hydration considerations
- Moving to a stricter CSP (removing `'unsafe-inline'`/`'unsafe-eval'`) may require verifying that any inline scripts/styles are removed; current React/Next setup should hydrate if all scripts are bundled. The existing permissive CSP does not block hydration but weakens XSS defenses; tightening it later without removing inline usages could break hydration, so audit inline assets when applying the change. 【F:proxy.ts†L47-L134】
