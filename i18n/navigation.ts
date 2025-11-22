import { createLocalizedPathnamesNavigation } from 'next-intl/navigation';
import { localePrefix, locales, pathnames } from './routing';

export const { Link, redirect, usePathname, useRouter } =
  createLocalizedPathnamesNavigation({
    locales,
    localePrefix,
    pathnames,
  });
