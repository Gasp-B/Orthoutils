import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestEditForm from './TestEditForm';
import styles from './tests-edit.module.css';
import { locales, type Locale } from '@/i18n/routing';
import { getTestWithMetadata } from '@/lib/tests/queries';

type TestEditPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: TestEditPageProps): Promise<Metadata> {
  const { locale, id } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const test = await getTestWithMetadata(id, locale as Locale);

  if (!test) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests.edit' });

  return {
    title: t('metadata.title', { name: test.name }),
    description: t('metadata.description', { name: test.name }),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function TestEditPage({ params }: TestEditPageProps) {
  const { locale, id } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const test = await getTestWithMetadata(id, locale as Locale);

  if (!test) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests.edit' });

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.headerPanel}`}>
        <h1 className={styles.pageTitle}>{t('pageTitle', { name: test.name })}</h1>
        <p className={styles.pageLead}>{t('pageLead')}</p>
      </div>

      <div className="glass panel">
        <TestEditForm test={test} locale={locale as Locale} mode="edit" />
      </div>
    </main>
  );
}
