'use client';

import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

import styles from './administration-page.module.css';

function AdministrationDashboard() {
  const t = useTranslations('Header');
  const tm = useTranslations('taxonomyManagement');
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <section className={`container section-shell ${styles.page}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="section-title">
            <span />
            <p className={styles.sectionLabel}>{t('admin')}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => void handleLogout()} 
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Déconnexion
        </Button>
      </div>

      <div className={`glass panel ${styles.introPanel}`}>
        <h1 className={styles.pageTitle}>{t('dashboard')}</h1>
        <p className={`text-subtle ${styles.pageLead}`}>{t('adminMenuLabel')}</p>
      </div>

      <div className={styles.cardGrid}>
        <Link href="/tests/manage" className={styles.card} aria-label={t('addTest')}>
          <div className={styles.cardBody}>
            <p className={styles.cardEyebrow}>{t('catalogue')}</p>
            <span className={styles.cardTitle}>{t('addTest')}</span>
          </div>
          <span aria-hidden className={styles.cardArrow}>
            →
          </span>
        </Link>

        <Link
          href="/administration/TaxonomyManagement"
          className={styles.card}
          aria-label={tm('nav.cardTitle')}
        >
          <div className={styles.cardBody}>
            <p className={styles.cardEyebrow}>{tm('nav.cardEyebrow')}</p>
            <span className={styles.cardTitle}>{tm('nav.cardTitle')}</span>
          </div>
          <span aria-hidden className={styles.cardArrow}>
            →
          </span>
        </Link>
      </div>
    </section>
  );
}

export default AdministrationDashboard;