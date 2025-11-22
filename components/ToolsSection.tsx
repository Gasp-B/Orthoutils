import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
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

  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata();
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
        <div className="section-title">
          <span />
          <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
        </div>

        <div className="glass panel">
          <div className={styles.headerRow}>
            <div className={`stack ${styles.headingStack}`}>
              <h2 className={styles.headingTitle}>{t('headingTitle')}</h2>
              <p className={styles.headingText}>{t('headingText')}</p>
            </div>
            <Link className="ph-header__pill" href="/catalogue">
              {t('ctas.openCatalogue')}
            </Link>
          </div>
        </div>

        <div className="card-grid">
          {featured.map((test) => (
            <article key={test.id} className="glass panel">
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardTitle}>{test.name}</p>
                  <p className={`text-subtle ${styles.cardSubtitle}`}>
                    {test.shortDescription ?? shared('placeholders.description')}
                  </p>
                </div>
                <span className="badge">{formatAgeRange(shared, test.ageMinMonths, test.ageMaxMonths)}</span>
              </div>

              <p className={styles.objectiveText}>
                {test.objective ?? shared('placeholders.objective')}
              </p>

              <div className={styles.tagRow}>
                {test.domains.map((domain) => (
                  <span key={domain} className="pill-muted">
                    {domain}
                  </span>
                ))}
              </div>

              {test.tags.length > 0 && (
                <div className={styles.tagRow}>
                  {test.tags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={`action-row ${styles.actionRow}`}>
                <span className="text-subtle">{formatDuration(shared, test.durationMinutes)}</span>
                <Link
                  className="ph-header__link"
                  href={{ pathname: '/catalogue/[slug]', params: { slug: test.slug } }}
                  aria-label={t('ctas.viewSheet', { testName: test.name })}
                >
                  {t('ctas.viewSheetLabel')}
                </Link>
              </div>
            </article>
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
