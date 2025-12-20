import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestDataGrid from './TestDataGrid';
import { locales, type Locale } from '@/i18n/routing';

type AdministrationTestsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdministrationTestsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function AdministrationTestsPage({ params }: AdministrationTestsPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return (
    <main className="container section-shell flex flex-col gap-6">
      <header className="rounded-2xl bg-slate-950/80 px-6 py-5 shadow-lg shadow-slate-950/30 ring-1 ring-white/10">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            {t('sectionLabel')}
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-white/90">{t('pageTitle')}</h1>
            <p className="text-sm text-white/70 sm:text-base">{t('pageLead')}</p>
          </div>
        </div>
      </header>

      <TestDataGrid locale={locale as Locale} />
    </main>
  );
}
