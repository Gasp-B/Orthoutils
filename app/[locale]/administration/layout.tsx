import { redirect } from '@/i18n/navigation';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdministrationLayout({ children, params }: Props) {
  // 1. On récupère la locale depuis les paramètres (obligatoire pour next-intl côté serveur)
  const { locale } = await params;
  
  const supabase = await createRouteHandlerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 2. On passe un objet complet avec href et locale pour satisfaire TypeScript
    redirect({ href: '/login', locale: locale as Locale });
  }

  return <>{children}</>;
}