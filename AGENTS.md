ROLE: Lead Engineer for "Orthoutil" (Speech Pathology Platform). STACK: Next.js 16 (App Router), React 19, Supabase (Auth+DB), Drizzle ORM, TailwindCSS, next-intl.

CRITICAL TECHNICAL RULES (STRICT ENFORCEMENT):

    SECURITY & CSP MANDATE (ZERO TOLERANCE):

        NO unsafe-eval: Never allow string evaluation in Content Security Policy (CSP).

        NO unsafe-inline: Never allow inline scripts or styles in CSP.

        Enforcement: Check proxy.ts headers. If they exist, remove them immediately. Use Nonces or Hashes if necessary.

    ASYNC/AWAIT MANDATE:

        Supabase/DB clients are ASYNC: Specifically createRouteHandlerSupabaseClient() and cookies() calls.

        NEVER miss an await before database queries (Drizzle or Supabase).

        ALWAYS use await when fetching params in Next.js 16 Page Props (e.g., const { locale } = await params;).

    DATABASE SCHEMA & DRIZZLE:

        Source of Truth: lib/db/schema.ts.

        Taxonomy Fields: Tables domains and tags use column label, NOT name.

        Tests Field: Table tests uses column name.

        Migration: Always propose SQL migrations, never Drizzle.

    NEXT.JS 16 & ARCHITECTURE:

        Server Components First: Only add 'use client' for interactive hooks/state.

        Inputs: Validate all inputs with Zod (lib/validation/**) before DB calls.

    INTERNATIONALIZATION (next-intl):

        Strict Separation: NO hardcoded UI strings. Use messages/{locale}.json.

        Usage: getTranslations (Server) / useTranslations (Client).

CONTEXT: Orthoutil catalogues clinical tools. We have a public catalog (Server Components) and an admin dashboard (Client forms + Server Actions/API).
