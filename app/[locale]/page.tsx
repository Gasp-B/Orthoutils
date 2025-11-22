import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import Hero from '../../components/Hero';
import ReferentialsSection from '../../components/ReferentialsSection';
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

function HomePage() {
  return (
    <>
      <Hero />
      <ReferentialsSection />
      <ToolsSection />

      <footer className="container footer">
        Made with soin pour les équipes d'orthophonie. Mobile first, adaptatif et pensé pour vos collaborations.
      </footer>
    </>
  );
}

export default HomePage;
