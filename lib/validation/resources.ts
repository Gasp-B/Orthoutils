import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

const localeEnum = z.enum(locales);

// Schéma de base pour une ressource (lecture)
export const resourceSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  url: z.string().url().nullable(),
  createdAt: z.string(),
  // Champs traduits (aplatis pour le DTO)
  title: z.string(),
  description: z.string().nullable(),
  // Relations
  domains: z.array(z.string()),
  tags: z.array(z.string()),
  pathologies: z.array(z.string()),
});

export const resourcesResponseSchema = z.object({
  resources: z.array(resourceSchema),
});

export type ResourceDto = z.infer<typeof resourceSchema>;

// Schéma pour la création/mise à jour (écriture)
export const resourceInputSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  // Champs table resources
  type: z.string().min(1, "Le type est requis"),
  url: z.string().url("URL invalide").nullable().optional(),
  // Champs table resources_translations
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().nullable().optional(),
  // Relations (IDs ou Labels pour création à la volée, selon votre logique UI)
  // Ici on reprend la logique des tests : on envoie des labels (string)
  domains: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  pathologies: z.array(z.string().min(1)).default([]),
});

export const updateResourceInputSchema = resourceInputSchema.extend({
  id: z.string().uuid(),
});

export type ResourceInput = z.infer<typeof resourceInputSchema>;
export type ResourceUpdateInput = z.infer<typeof updateResourceInputSchema>;