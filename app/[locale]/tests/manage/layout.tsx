import { redirect } from '@/i18n/navigation';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ManageTestsLayout({ children, params }: Props) {
  const { locale } = await params;
  
  const supabase = await createRouteHandlerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/login', locale: locale as Locale });
  }

  return <>{children}</>;
}