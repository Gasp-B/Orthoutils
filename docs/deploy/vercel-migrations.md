# Migrations Supabase sur Vercel

Afin d'appliquer automatiquement les migrations SQL à chaque build Vercel tout en gardant une sortie de secours, la commande de build déclenche désormais `npm run migrate:apply` avant `npm run build`.

## Variables d'environnement requises

Configurez ces variables dans le dashboard Vercel (ou dans `.env` en local) pour autoriser l'accès à la base distante :

- `SUPABASE_DB_URL` : chaîne de connexion PostgreSQL vers votre base Supabase (par ex. `postgresql://postgres:<password>@db.<project_ref>.supabase.co:6543/postgres`).
- `SUPABASE_PROJECT_REF` / `SUPABASE_DB_PASSWORD` (optionnel) : seulement si vous utilisez un format de connexion dérivé ; sinon `SUPABASE_DB_URL` suffit.

## Scripts disponibles

- `npm run migrate:apply` : applique toutes les migrations présentes dans `supabase/migrations` sur la base pointée par `SUPABASE_DB_URL`. La build échoue si l'exécution ne passe pas, évitant un déploiement incohérent.
- `npm run migrate:rollback` : annule la dernière migration appliquée sur la même base. À utiliser manuellement en cas d'incident.

## Flux conseillé

1. Ajoutez les migrations SQL idempotentes dans `supabase/migrations`.
2. Poussez sur la branche déployée sur Vercel : la build applique les migrations puis lance `next build`.
3. Si un problème survient après déploiement, exécutez `npm run migrate:rollback` avec la même configuration d'environnement pour revenir à l'état précédent, le temps de corriger.
