import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { type Locale } from '@/i18n/routing';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';
import styles from './tools-section.module.css';

function formatAgeRange(
  translateShared: Awaited<ReturnType<typeof getTranslations>>,
  min: number | null,
  max: number | null,
) {
  if (min && max) {
    return translateShared('ageRange.range', { max, min });
  }

  if (min) {
    return translateShared('ageRange.from', { min });
  }

  if (max) {
    return translateShared('ageRange.until', { max });
  }

  return translateShared('ageRange.free');
}

function formatDuration(translateShared: Awaited<ReturnType<typeof getTranslations>>, minutes: number | null) {
  if (!minutes) {
    return translateShared('duration.variable');
  }

  return translateShared('duration.minutes', { minutes });
}

async function ToolsSection() {
  const t = await getTranslations('Tools');
  const shared = await getTranslations('Shared');
  const locale = (await getLocale()) as Locale;

  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata(locale);
  } catch (error) {
    console.error('Erreur lors du chargement du catalogue des tests', error);
    loadError = t('errors.load');
  }
  const featured = tests.slice(0, 3);
  const domains = Array.from(new Set(tests.flatMap((test) => test.domains)));

  const computedStats = [
    { label: t('stats.tests.label'), value: tests.length, detail: t('stats.tests.detail') },
    { label: t('stats.domains.label'), value: domains.length, detail: t('stats.domains.detail') },
    {
      label: t('stats.standardized.label'),
      value: tests.filter((test) => test.isStandardized).length,
      detail: t('stats.standardized.detail'),
    },
  ];

  return (
    <>
      <section id="catalogue" className="container section-shell">
        <div className={`glass panel ${styles.headerPanel}`}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h2 className={styles.headingTitle}>{t('headingTitle')}</h2>
              <p className={styles.headingLead}>{t('headingText')}</p>
            </div>
            <Link className={`primary-btn ${styles.catalogueBtn}`} href="/catalogue">
              {t('ctas.openCatalogue')}
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {featured.map((test) => (
            <Link
              key={test.id}
              href={{ pathname: '/catalogue/[slug]', params: { slug: test.slug } }}
              className={`glass ${styles.card}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTop}>
                  <div className={styles.domains}>
                    {test.domains.slice(0, 1).map((domain) => (
                      <span key={domain} className={styles.domainPill}>
                        {domain}
                      </span>
                    ))}
                    {test.domains.length > 1 && (
                      <span className={styles.domainPlus}>+{test.domains.length - 1}</span>
                    )}
                  </div>
                  <span className={styles.ageBadge}>
                    {formatAgeRange(shared, test.ageMinMonths, test.ageMaxMonths)}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{test.name}</h3>
                <p className={styles.cardDesc}>
                  {test.shortDescription ?? shared('placeholders.description')}
                </p>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {formatDuration(shared, test.durationMinutes)}
                  </span>
                </div>
                <span className={styles.linkArrow}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {tests.length === 0 && (
          <div className={`glass panel ${styles.emptyState}`}>
            <p className={`text-subtle ${styles.emptyText}`}>
              {loadError ?? t('emptyState')}
            </p>
          </div>
        )}
      </section>

      <section id="collaboration" className={`container section-shell ${styles.collaborationSection}`}>
        <div className="card-grid">
          <div className="glass panel">
            <div className="section-title">
              <span />
              <p className={styles.sectionLabel}>{t('collaboration.sectionLabel')}</p>
            </div>
            <ul className="list">
              <li>{t('collaboration.items.workflow')}</li>
              <li>{t('collaboration.items.committee')}</li>
              <li>{t('collaboration.items.archives')}</li>
            </ul>
            <div className="stat-grid">
              {computedStats.map((stat) => (
                <div key={stat.label} className="glass panel stat-card">
                  <p className={styles.statCardValue}>{stat.value}</p>
                  <p className={styles.statCardLabel}>{stat.label}</p>
                  <small className="text-subtle">{stat.detail}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ToolsSection;