import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestsTable from './TestsTable';
import styles from './tests-page.module.css';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import { locales, type Locale } from '@/i18n/routing';

type TestsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TestsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function TestsManagementPage({ params }: TestsPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });
  const tests = await getTestsWithMetadata(locale as Locale);

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
        <p className={`text-subtle ${styles.pageLead}`}>{t('pageLead')}</p>
      </div>

      <TestsTable tests={tests} locale={locale as Locale} />
    </main>
  );
}
