import type { Pathnames } from 'next-intl/routing';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';
export const localePrefix = 'always';

export const pathnames = {
  '/': '/',
  '/catalogue': {
    en: '/catalogue',
    fr: '/catalogue',
  },
  '/tools': {
    en: '/tools',
    fr: '/outils',
  },
  '/administration': '/administration',
} satisfies Pathnames<typeof locales>;
