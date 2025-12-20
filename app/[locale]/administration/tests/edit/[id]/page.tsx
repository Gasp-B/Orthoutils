import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestForm from '../../../../tests/manage/TestForm';
import styles from '../../../../tests/manage/manage-page.module.css';
import { locales, type Locale } from '@/i18n/routing';

type AdministrationTestsEditPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: AdministrationTestsEditPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return {
    title: t('edit.metadata.title'),
    description: t('edit.metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function AdministrationTestsEditPage({ params }: AdministrationTestsEditPageProps) {
  const { locale, id } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('edit.sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>{t('edit.pageTitle')}</h1>
        <p className={`text-subtle ${styles.pageLead}`}>{t('edit.pageLead')}</p>
      </div>

      <TestForm locale={locale as Locale} initialTestId={id} />
    </main>
  );
}
