import type { LocalePrefix, Pathnames } from 'next-intl/routing';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';
export const localePrefix: LocalePrefix<typeof locales> = 'always';

export const pathnames = {
  '/': '/',
  '/login': '/login',
  '/signup': '/signup',   // Ajouté pour la cohérence
  '/forgot-password': '/forgot-password',
  '/account': '/account', // AJOUT CRITIQUE : Corrige l'erreur dans Header.tsx
  '/catalogue': {
    en: '/catalogue',
    fr: '/catalogue',
  },
  '/catalogue/[slug]': {
    en: '/catalogue/[slug]',
    fr: '/catalogue/[slug]',
  },
  '/catalogue/[slug]/[theme]': {
    en: '/catalogue/[slug]/[theme]',
    fr: '/catalogue/[slug]/[theme]',
  },
  '/search': {
    en: '/search',
    fr: '/search',
  },
  '/administration': '/administration',
  '/administration/TaxonomyManagement': {
    en: '/administration/TaxonomyManagement',
    fr: '/administration/TaxonomyManagement',
  },
  '/administration/resources': {
    en: '/administration/resources',
    fr: '/administration/resources',
  },
  '/administration/tests': {
    en: '/administration/tests',
    fr: '/administration/tests',
  },
  '/administration/tests/create': {
    en: '/administration/tests/create',
    fr: '/administration/tests/create',
  },
  '/administration/tests/edit/[id]': {
    en: '/administration/tests/edit/[id]',
    fr: '/administration/tests/edit/[id]',
  },
  '/tests/manage': '/tests/manage',
} satisfies Pathnames<typeof locales>;

export const routing = {
  locales,
  defaultLocale,
  localePrefix,
  pathnames,
};
