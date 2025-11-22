import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './routing';

export default getRequestConfig(async ({ locale }) => {
  const localeToUse = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return {
    locale: localeToUse,
    defaultLocale,
    locales,
    messages: (await import(`../messages/${localeToUse}.json`)).default,
  };
});
