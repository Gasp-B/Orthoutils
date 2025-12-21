import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TestsManagementTable from './TestsManagementTable';
import styles from './tests-page.module.css';
import { locales, type Locale } from '@/i18n/routing';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';

export const dynamic = 'force-dynamic';

type TestsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TestsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'TestsManage' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function TestsPage({ params }: TestsPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'TestsManage' });

  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata(locale as Locale);
  } catch (error) {
    console.error('Impossible de charger les tests', error);
    loadError = t('errors.load');
  }

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

      <div className="glass panel">
        <TestsManagementTable tests={tests} errorMessage={loadError} />
      </div>
    </main>
  );
}
