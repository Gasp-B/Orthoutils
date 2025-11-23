import { z } from 'zod';

export const toolLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export const toolStatusSchema = z.enum(['validated', 'review', 'community']);

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
  statusLabel: z.string().optional(),
  createdAt: z.string(),
  type: z.string().nullable().optional(),
  source: z.string().url().nullable().optional(),
});

export const toolsResponseSchema = z.object({
  tools: z.array(toolSchema),
});

export type ToolDto = z.infer<typeof toolSchema>;
export type ToolStatus = z.infer<typeof toolStatusSchema>;

export type CreateToolMessages = {
  nameRequired: string;
  categoryRequired: string;
  typeRequired: string;
  tagsRequired: string;
  sourceUrl: string;
};

export const createToolSchema = (messages: CreateToolMessages) =>
  z.object({
    name: z.string().min(1, messages.nameRequired),
    category: z.string().min(1, messages.categoryRequired),
    type: z.string().min(1, messages.typeRequired),
    tags: z.array(z.string().min(1)).min(1, messages.tagsRequired),
    source: z.string().url(messages.sourceUrl),
  });

export type CreateToolSchema = ReturnType<typeof createToolSchema>;
export type CreateToolPayload = z.infer<CreateToolSchema>;
