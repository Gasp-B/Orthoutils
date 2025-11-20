import { z } from 'zod';

export const referentialTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  colorLabel: z.string().nullable(),
});

export const referentialSubsectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  formatLabel: z.string().nullable(),
  colorLabel: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(referentialTagSchema),
});

export const referentialSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  subsections: z.array(referentialSubsectionSchema),
});

export const referentialsResponseSchema = z.object({
  referentials: z.array(referentialSchema),
});

export type ReferentialDto = z.infer<typeof referentialSchema>;
export type ReferentialSubsectionDto = z.infer<typeof referentialSubsectionSchema>;
export type ReferentialTagDto = z.infer<typeof referentialTagSchema>;
