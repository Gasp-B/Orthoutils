import { z } from 'zod';

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
});

export const testsResponseSchema = z.object({
  tests: z.array(testSchema),
});

export type TestDto = z.infer<typeof testSchema>;
