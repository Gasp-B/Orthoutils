import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

const localeEnum = z.enum(locales);

const bibliographySchema = z
  .array(
    z.object({
      label: z.string().min(1),
      url: z.string().url(),
    }),
  )
  .default([]);

export const testSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string().nullable(),
  objective: z.string().nullable(),
  ageMinMonths: z.number().int().nullable(),
  ageMaxMonths: z.number().int().nullable(),
  population: z.string().nullable(),
  durationMinutes: z.number().int().nullable(),
  materials: z.string().nullable(),
  isStandardized: z.boolean(),
  publisher: z.string().nullable(),
  priceRange: z.string().nullable(),
  buyLink: z.string().url().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  domains: z.array(z.string()),
  tags: z.array(z.string()),
  themes: z.array(z.string()),
  bibliography: bibliographySchema,
});

export const testsResponseSchema = z.object({
  tests: z.array(testSchema),
});

export type TestDto = z.infer<typeof testSchema>;

const taxonomyDomainSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
});

export const testInputSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  name: z.string().min(1),
  shortDescription: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  ageMinMonths: z.number().int().nullable().optional(),
  ageMaxMonths: z.number().int().nullable().optional(),
  population: z.string().nullable().optional(),
  durationMinutes: z.number().int().nullable().optional(),
  materials: z.string().nullable().optional(),
  isStandardized: z.boolean().default(false),
  publisher: z.string().nullable().optional(),
  priceRange: z.string().nullable().optional(),
  buyLink: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  domains: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  themes: z.array(z.string().min(1)).default([]),
  bibliography: bibliographySchema,
});

export const updateTestInputSchema = testInputSchema.extend({
  id: z.string().uuid(),
});

export const taxonomyResponseSchema = z.object({
  domains: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string(),
      slug: z.string(),
      synonyms: z.array(z.string()),
    }),
  ),
  tags: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string(),
      color: z.string().nullable().optional(),
    }),
  ),
  themes: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string(),
      slug: z.string(),
      description: z.string().nullable(),
      synonyms: z.array(z.string()),
      domains: z.array(taxonomyDomainSchema),
    }),
  ),
  resourceTypes: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string(),
    }),
  ),
});

export type TaxonomyResponse = z.infer<typeof taxonomyResponseSchema>;

export const taxonomyMutationSchema = z.object({
  type: z.enum(['domain', 'tag', 'theme', 'resourceType']),
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'La valeur est requise.' }),
  // Champs additionnels optionnels
  description: z.string().nullable().optional(),
  synonyms: z.string().trim().optional(), // Reçu comme string "a, b, c" depuis le form
  color: z.string().nullable().optional(),
  domainIds: z.array(z.string().uuid()).optional(),
});

export const taxonomyDeletionSchema = z.object({
  type: z.enum(['domain', 'tag', 'theme', 'resourceType']),
  id: z.string().uuid(),
  locale: localeEnum.default(defaultLocale),
});

export type TaxonomyMutationInput = z.infer<typeof taxonomyMutationSchema>;
export type TaxonomyDeletionInput = z.infer<typeof taxonomyDeletionSchema>;
