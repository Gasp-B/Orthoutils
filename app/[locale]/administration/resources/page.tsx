import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ResourceForm from './ResourceForm';
import styles from './resources-page.module.css';
import { locales, type Locale } from '@/i18n/routing';

type ResourcesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ResourcesPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'ResourcesManage' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function ResourcesPage({ params }: ResourcesPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'ResourcesManage' });

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

      <ResourceForm locale={locale as Locale} />
    </main>
  );
}
