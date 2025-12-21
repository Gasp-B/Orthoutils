import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';
import TestsTable from './tests-table';

export const dynamic = 'force-dynamic';

type TestsManagementPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TestsManagementPageProps): Promise<Metadata> {
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

export default async function TestsManagementPage({ params }: TestsManagementPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'AdminTests' });

  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata(locale as Locale);
  } catch (error) {
    console.error('Impossible de charger les tests pour l’administration', error);
    loadError = t('errors.load');
  }

  return (
    <main className="container section-shell space-y-8">
      <header className="section-shell space-y-4">
        <div className="section-title">
          <span />
          <p className="text-sm text-muted-foreground">{t('sectionLabel')}</p>
        </div>
        <div className="glass panel space-y-2">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">{t('pageTitle')}</h1>
          <p className="text-subtle max-w-3xl">{t('pageLead')}</p>
        </div>
      </header>

      {loadError && (
        <div className="glass panel text-sm text-red-200" role="status">
          {loadError}
        </div>
      )}

      <section className="glass panel">
        <TestsTable locale={locale as Locale} tests={tests} />
      </section>
    </main>
  );
}
