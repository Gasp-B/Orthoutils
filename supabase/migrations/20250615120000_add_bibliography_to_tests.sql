-- Ajout d'une colonne bibliographie pour stocker des liens structurés par test.
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS bibliography jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.tests
ALTER COLUMN bibliography SET NOT NULL;

UPDATE public.tests
SET bibliography = '[]'::jsonb
WHERE bibliography IS NULL;
