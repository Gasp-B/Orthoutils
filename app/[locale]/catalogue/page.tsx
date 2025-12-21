import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';
import styles from './catalogue.module.css';

export const dynamic = 'force-dynamic';

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

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

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Catalogue' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function CataloguePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Catalogue' });
  const shared = await getTranslations({ locale, namespace: 'Shared' });

  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata(locale as Locale);
  } catch (error) {
    console.error('Impossible de charger le catalogue complet', error);
    loadError = t('errors.load');
  }

  return (
    <main className={`container section-shell ${styles.page}`}>
      <header className="section-shell">
        <div className="section-title">
          <span />
          <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
        </div>
        <div className="glass panel">
          <div className={styles.headerRow}>
            <div className={`stack ${styles.headingStack}`}>
              <h1 className={styles.headingTitle}>{t('headingTitle')}</h1>
              <p className={styles.headingText}>{t('headingText')}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="section-shell">
        <div className="card-grid">
          {tests.map((test) => (
            <article key={test.id} className="glass panel">
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardTitle}>{test.name}</p>
                  <p className={`text-subtle ${styles.cardSubtitle}`}>
                    {test.shortDescription ?? shared('placeholders.description')}
                  </p>
                </div>
                <span className={styles.durationBadge}>{formatDuration(shared, test.durationMinutes)}</span>
              </div>

              <div className={styles.badgeRow}>
                <span className="badge">{formatAgeRange(shared, test.ageMinMonths, test.ageMaxMonths)}</span>
                <span className="badge">{test.population ?? shared('populationDefault')}</span>
                <span className="badge">
                  {test.isStandardized ? shared('statuses.standardized') : shared('statuses.nonStandardized')}
                </span>
              </div>

              <div className={styles.metaList}>
                {test.objective && (
                  <p className={styles.metaItem}>
                    <strong>{t('meta.objective')}</strong> {test.objective}
                  </p>
                )}
                {test.materials && (
                  <p className={styles.metaItem}>
                    <strong>{t('meta.materials')}</strong> {test.materials}
                  </p>
                )}
                {test.publisher && (
                  <p className={styles.metaItem}>
                    <strong>{t('meta.publisher')}</strong> {test.publisher}
                  </p>
                )}
              </div>

              {test.domains.length > 0 && (
                <div className={styles.tagRow}>
                  {test.domains.map((domain) => (
                    <span key={domain} className="pill-muted">
                      {domain}
                    </span>
                  ))}
                </div>
              )}

              {test.themes.length > 0 && (
                <div className={styles.tagRow} aria-label={t('meta.themes')}>
                  <span className="text-subtle">{t('meta.themes')}</span>
                  {test.themes.map((theme) => (
                    <span key={theme} className={`badge ${styles.themeBadge}`}>
                      {theme}
                    </span>
                  ))}
                </div>
              )}

              {test.tags.length > 0 && (
                <div className={styles.tagRow}>
                  {test.tags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.cardFooter}>
                {test.buyLink ? (
                  <a className="ph-header__link" href={test.buyLink} rel="noreferrer" target="_blank">
                    {shared('ctas.buyOrConsult')}
                  </a>
                ) : (
                  <span className="text-subtle">{t('empty.buyLink')}</span>
                )}
                <Link
                  className="ph-header__link"
                  href={{ pathname: '/catalogue/[slug]', params: { slug: test.slug } }}
                  aria-label={t('ctas.viewSheet', { testName: test.name })}
                >
                  {shared('ctas.viewSheetLabel')}
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
    </main>
  );
}
