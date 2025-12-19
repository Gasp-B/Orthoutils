import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

export const searchLocaleSchema = z.enum(locales).default(defaultLocale);
export const searchQuerySchema = z.string().trim().min(1).max(200);
export const searchPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type SearchLocale = z.infer<typeof searchLocaleSchema>;
