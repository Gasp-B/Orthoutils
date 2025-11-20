# Othoutils

Base responsive pour référencer et éditer les outils d'orthophonie. Construite avec React + Vite, prête pour être
branchée à Supabase afin de stocker les fiches et suggestions dans une base relationnelle.

## Démarrer

```bash
npm install
npm run dev
```

Pour que les migrations Supabase soient appliquées automatiquement lors des builds Vercel, ajoutez `SUPABASE_DB_URL` dans les variables d'environnement du projet. La commande de build exécute `npm run migrate:apply` avant `next build`. En cas de besoin, `npm run migrate:rollback` permet d'annuler la dernière migration appliquée.

Variables d'environnement à ajouter dans `.env.local` pour activer Supabase (clé publishable côté client et clé secrète côté serveur) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé_anon>
SUPABASE_SECRET_KEY=<clé_service>
```

## Fonctionnalités incluses

- Catalogue responsive des outils (questionnaires, tests, suivis patients) avec status et tags.
- Formulaire de propositions d'édition pour que les membres soumettent leurs modifications.
- Section de gouvernance éditoriale et checklist pour préparer les workflows de validation.
- Connecteur Supabase préconfiguré dans `src/lib/supabaseClient.ts` pour persister les données.
