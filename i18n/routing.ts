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
  '/administration/taxonomy': '/administration/taxonomy',
  '/tests/manage': '/tests/manage',
} satisfies Pathnames<typeof locales>;
