import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

const localeEnum = z.enum(locales);

export const clinicalProfilesResponseSchema = z.object({
  profiles: z.array(z.string()),
});

export type ClinicalProfilesResponse = z.infer<typeof clinicalProfilesResponseSchema>;

export const clinicalProfileCreateSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'Le profil clinique est requis.' }),
});

export const clinicalProfileUpdateSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  previousValue: z.string().trim().min(1, { message: 'Le profil clinique est requis.' }),
  value: z.string().trim().min(1, { message: 'Le profil clinique est requis.' }),
});

export const clinicalProfileDeleteSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'Le profil clinique est requis.' }),
});

export type ClinicalProfileCreateInput = z.infer<typeof clinicalProfileCreateSchema>;
export type ClinicalProfileUpdateInput = z.infer<typeof clinicalProfileUpdateSchema>;
export type ClinicalProfileDeleteInput = z.infer<typeof clinicalProfileDeleteSchema>;
