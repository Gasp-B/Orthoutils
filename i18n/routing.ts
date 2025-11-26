import type { LocalePrefix, Pathnames } from 'next-intl/routing';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';
export const localePrefix: LocalePrefix<typeof locales> = 'always';

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
  '/administration': '/administration',
  '/administration/taxonomy': '/administration/taxonomy',
  '/tests/manage': '/tests/manage',
} satisfies Pathnames<typeof locales>;

export const routing = {
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
};
