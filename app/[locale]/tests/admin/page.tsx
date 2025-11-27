import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import TestAdminForm from './TestAdminForm';
import { locales, type Locale } from '@/i18n/routing';

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'TestsAdmin.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function AdminTestsPage({ params }: AdminPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'TestsAdmin' });

  return (
    <main className="container space-y-8 py-10">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{t('title')}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">{t('description')}</p>
      </div>

      <TestAdminForm locale={locale as Locale} />
    </main>
  );
}
