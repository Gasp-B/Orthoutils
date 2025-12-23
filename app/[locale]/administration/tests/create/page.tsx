import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n/routing';
import { locales } from '@/i18n/routing';
import type { TestDto } from '@/lib/validation/tests';
import TestEditForm from '../edit/[id]/TestEditForm';
import styles from '../edit/[id]/tests-edit.module.css';

type TestCreatePageProps = {
  params: Promise<{ locale: string }>;
};

const createEmptyTest = (): TestDto => ({
  id: '00000000-0000-0000-0000-000000000000',
  name: '',
  slug: '',
  shortDescription: null,
  objective: null,
  targetAudience: 'child',
  status: 'draft',
  ageMinMonths: null,
  ageMaxMonths: null,
  population: null,
  clinicalProfiles: [],
  durationMinutes: null,
  materials: null,
  isStandardized: false,
  publisher: null,
  priceRange: null,
  buyLink: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  domains: [],
  tags: [],
  themes: [],
  bibliography: [],
});

export async function generateMetadata({ params }: TestCreatePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests.create' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function TestCreatePage({ params }: TestCreatePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests.create' });

  return (
    <main className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      <div className={`glass panel ${styles.headerPanel}`}>
        <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
        <p className={styles.pageLead}>{t('pageLead')}</p>
      </div>

      <div className="glass panel">
        <TestEditForm test={createEmptyTest()} locale={locale as Locale} mode="create" />
      </div>
    </main>
  );
}
