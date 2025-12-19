BEGIN;

-- 1. Création du type énuméré (extensible si vous voulez 'mixed' plus tard)
CREATE TYPE public.target_audience AS ENUM ('child', 'adult');

-- 2. Ajout de la colonne à la table tests avec une valeur par défaut
ALTER TABLE public.tests 
ADD COLUMN target_audience public.target_audience NOT NULL DEFAULT 'child';

COMMIT;
