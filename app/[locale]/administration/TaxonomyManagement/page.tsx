import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import TaxonomyManagementPanel from './TaxonomyManagementPanel';
import styles from '../administration-page.module.css';
import { locales, type Locale } from '@/i18n/routing';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = locales.includes(locale as Locale) ? (locale as Locale) : locales[0];
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'taxonomyManagement' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function TaxonomyManagementPage({ params }: PageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'taxonomyManagement' });

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

      <TaxonomyManagementPanel />
    </main>
  );
}
