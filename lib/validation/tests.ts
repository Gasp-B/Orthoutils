import { z } from 'zod';

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
  bibliography: bibliographySchema,
});

export const testsResponseSchema = z.object({
  tests: z.array(testSchema),
});

export type TestDto = z.infer<typeof testSchema>;
export const testInputSchema = z.object({
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
  bibliography: bibliographySchema,
});

export const updateTestInputSchema = testInputSchema.extend({
  id: z.string().uuid(),
});

export const taxonomyResponseSchema = z.object({
  domains: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
  ),
  tags: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string(),
    }),
  ),
});

export type TestInput = z.infer<typeof testInputSchema>;
export type TestUpdateInput = z.infer<typeof updateTestInputSchema>;
export type TaxonomyResponse = z.infer<typeof taxonomyResponseSchema>;
