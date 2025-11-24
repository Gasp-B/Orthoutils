import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import Hero from '../../components/Hero';
import ToolsSection from '../../components/ToolsSection';
import { locales, type Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

async function HomePage() {
  const t = await getTranslations('Footer');

  return (
    <>
      <Hero />
      <ToolsSection />

      <footer className="container footer">
        {t('note')}
      </footer>
    </>
  );
}

export default HomePage;
