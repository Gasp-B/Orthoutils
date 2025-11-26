import { notFound } from 'next/navigation';

import AdministrationDashboard from './AdministrationDashboard';
import { locales, type Locale } from '@/i18n/routing';

type AdministrationPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdministrationPage({ params }: AdministrationPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return <AdministrationDashboard />;
}
