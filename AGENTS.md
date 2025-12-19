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

   # Instructions pour le développement de la base de données

## Règle d'or : Source de Vérité
La structure réelle de l'application est définie par les fichiers SQL dans `supabase/migrations/`. Le fichier `lib/db/schema.ts` (Drizzle) DOIT être le reflet exact de ces migrations.

## Processus de modification
Avant toute modification du code ou du schéma TypeScript :
1. **Analyser l'historique SQL** : Parcourir le dossier `supabase/migrations/` dans l'ordre chronologique pour comprendre l'état actuel (ex: suppression de tables, renommages).
2. **Priorité aux migrations** : Si une table est présente dans le code mais supprimée par un fichier `.sql` (ex: `drop_tools_tables.sql`), elle DOIT être supprimée immédiatement du fichier `schema.ts`.
3. **Vérifier les types natifs** : S'assurer que les types complexes comme `tsvector` ou les `enums` sont déclarés dans Drizzle pour correspondre aux index et colonnes de recherche SQL.

## Vigilance spécifique
- **Traductions** : Chaque table principale (ex: `tests`, `themes`) possède souvent une table `_translations` associée. Ne pas oublier de les synchroniser.
- **Thèmes vs Pathologies** : Ne plus utiliser le terme "pathologies". Tout a été migré vers "themes".
- **Recherche** : Utiliser les colonnes `fts_vector` pour les requêtes de recherche plutôt que des simples `LIKE` pour garantir les performances prévues en base.

    NEXT.JS 16 & ARCHITECTURE:

        Server Components First: Only add 'use client' for interactive hooks/state.

        Inputs: Validate all inputs with Zod (lib/validation/**) before DB calls.

    INTERNATIONALIZATION (next-intl):

        Strict Separation: NO hardcoded UI strings. Use messages/{locale}.json.

        Usage: getTranslations (Server) / useTranslations (Client).

CONTEXT: Orthoutil catalogues clinical tools. We have a public catalog (Server Components) and an admin dashboard (Client forms + Server Actions/API).
