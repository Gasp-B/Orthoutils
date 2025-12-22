import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

const localeEnum = z.enum(locales);

export const populationCharacteristicsResponseSchema = z.object({
  characteristics: z.array(z.string()),
});

export type PopulationCharacteristicsResponse = z.infer<typeof populationCharacteristicsResponseSchema>;

export const populationCharacteristicCreateSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
});

export const populationCharacteristicUpdateSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  previousValue: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
  value: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
});

export const populationCharacteristicDeleteSchema = z.object({
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
});

export type PopulationCharacteristicCreateInput = z.infer<typeof populationCharacteristicCreateSchema>;
export type PopulationCharacteristicUpdateInput = z.infer<typeof populationCharacteristicUpdateSchema>;
export type PopulationCharacteristicDeleteInput = z.infer<typeof populationCharacteristicDeleteSchema>;
