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
  '/catalogue/[slug]': {
    en: '/catalogue/[slug]',
    fr: '/catalogue/[slug]',
  },
  '/catalogue/[slug]/[tag]': {
    en: '/catalogue/[slug]/[tag]',
    fr: '/catalogue/[slug]/[tag]',
  },
  '/tools': {
    en: '/tools',
    fr: '/outils',
  },
  '/tools/new': '/tools/new',
  '/administration': '/administration',
  '/administration/taxonomy': '/administration/taxonomy',
  '/tests/manage': '/tests/manage',
} satisfies Pathnames<typeof locales>;
