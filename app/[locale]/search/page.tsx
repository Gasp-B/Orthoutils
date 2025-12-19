import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import SearchHub from '@/components/SearchHub';
import { locales, type Locale } from '@/i18n/routing';
import { getSearchHubData } from '@/lib/search/queries';
import styles from './search.module.css';

export const dynamic = 'force-dynamic';

type LocalePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>;
};

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'SearchHub' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    metadataBase: new URL('https://othoutils.example.com'),
  };
}

export default async function SearchPage({ params, searchParams }: LocalePageProps) {
  const { locale } = await params;
  const { q, page, limit } = await searchParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'SearchHub' });
  const searchHubData = await getSearchHubData({
    locale: locale as Locale,
    query: q ?? undefined,
    page,
    limit,
  });

  return (
    <main className={`container section-shell ${styles.page}`}>
      <header className="section-shell">
        <div className="section-title">
          <span />
          <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
        </div>

        <div className={`glass panel ${styles.headerCard}`}>
          <div className={styles.titleRow}>
            <div className="stack">
              <h1 className={styles.headingTitle}>{t('headingTitle')}</h1>
              <p className={styles.headingText}>{t('headingText')}</p>
            </div>
          </div>
          <p className={styles.helper}>{t('helper')}</p>
        </div>

        <form className={`glass panel ${styles.searchForm}`} method="get">
          <div className={styles.searchField}>
            <label className={styles.searchLabel} htmlFor="search-query">
              {t('search.ariaLabel')}
            </label>
            <input
              className={`ui-input ${styles.searchInput}`}
              defaultValue={q ?? ''}
              id="search-query"
              name="q"
              placeholder={t('search.inputPlaceholder')}
              type="search"
            />
          </div>
          {limit ? <input name="limit" type="hidden" value={limit} /> : null}
          <input name="page" type="hidden" value="1" />
          <button className={`ui-button ui-button-sm ${styles.searchButton}`} type="submit">
            {t('search.submit')}
          </button>
        </form>
      </header>

      <SearchHub groups={searchHubData.groups} domains={searchHubData.domains} tags={searchHubData.tags} />
    </main>
  );
}
