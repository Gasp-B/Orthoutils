import { createNavigation } from 'next-intl/navigation';
import { localePrefix, locales, pathnames } from './routing';

export const { Link, redirect, usePathname, useRouter } =
  createNavigation({
    locales,
    localePrefix,
    pathnames,
  });
