import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

import AppFrame from '../AppFrame';
import { locales, type Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // CORRECTION : On appelle headers() pour forcer le mode dynamique,
  // mais sans assigner le résultat à une variable inutile.
  await headers();

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppFrame>{children}</AppFrame>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}