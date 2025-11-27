'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

import styles from './administration-page.module.css';

function AdministrationDashboard() {
  const t = useTranslations('Header');
  const tm = useTranslations('taxonomyManagement');

  return (
    <section className={`container section-shell ${styles.page}`}>
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('admin')}</p>
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
