import { z } from 'zod';

export const toolLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export const toolStatusSchema = z.enum(['Validé', 'En cours de revue', 'Communauté']);

export const toolSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  colorLabel: z.string().nullable(),
  tags: z.array(z.string()),
  description: z.string().nullable(),
  links: z.array(toolLinkSchema),
  notes: z.string().nullable(),
  targetPopulation: z.string().nullable(),
  status: toolStatusSchema,
  createdAt: z.string(),
  type: z.string().nullable().optional(),
  source: z.string().url().nullable().optional(),
});

export const toolsResponseSchema = z.object({
  tools: z.array(toolSchema),
});

export type ToolDto = z.infer<typeof toolSchema>;
export type ToolStatus = z.infer<typeof toolStatusSchema>;

export const createToolSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  type: z.string().min(1, 'Le type est requis'),
  tags: z.array(z.string().min(1)).min(1, 'Ajoutez au moins un tag'),
  source: z.string().url('La source doit être une URL valide'),
});
