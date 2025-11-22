import { redirect } from 'next/navigation';

import { defaultLocale } from '@/i18n/routing';

export const dynamic = 'force-static';

function HomePage() {
  redirect(`/${defaultLocale}`);
}

export default HomePage;
