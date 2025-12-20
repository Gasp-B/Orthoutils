import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestForm from '../../../tests/manage/TestForm';
import styles from '../../../tests/manage/manage-page.module.css';
import { locales, type Locale } from '@/i18n/routing';

type AdministrationTestsCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdministrationTestsCreatePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return {
    title: t('create.metadata.title'),
    description: t('create.metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function AdministrationTestsCreatePage({ params }: AdministrationTestsCreatePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('create.sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>{t('create.pageTitle')}</h1>
        <p className={`text-subtle ${styles.pageLead}`}>{t('create.pageLead')}</p>
      </div>

      <TestForm locale={locale as Locale} />
    </main>
  );
}
