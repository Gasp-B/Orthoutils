import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

const localeEnum = z.enum(locales);

export const populationCharacteristicsResponseSchema = z.object({
  populations: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string(),
      characteristics: z.array(z.string()),
    }),
  ),
});

export type PopulationCharacteristicsResponse = z.infer<typeof populationCharacteristicsResponseSchema>;

export const populationCharacteristicCreateSchema = z.object({
  populationId: z.string().uuid(),
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
});

export const populationCharacteristicUpdateSchema = z.object({
  populationId: z.string().uuid(),
  locale: localeEnum.default(defaultLocale),
  previousValue: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
  value: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
});

export const populationCharacteristicDeleteSchema = z.object({
  populationId: z.string().uuid(),
  locale: localeEnum.default(defaultLocale),
  value: z.string().trim().min(1, { message: 'La caractéristique est requise.' }),
});

export type PopulationCharacteristicCreateInput = z.infer<typeof populationCharacteristicCreateSchema>;
export type PopulationCharacteristicUpdateInput = z.infer<typeof populationCharacteristicUpdateSchema>;
export type PopulationCharacteristicDeleteInput = z.infer<typeof populationCharacteristicDeleteSchema>;
