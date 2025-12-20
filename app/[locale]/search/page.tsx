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
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
    limit?: string | string[];
    domain?: string | string[];
    theme?: string | string[];
    tag?: string | string[];
    type?: string | string[];
  }>;
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
  const { q, page, limit, domain, theme, tag, type } = await searchParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const normalizeSearchParam = (value?: string | string[]) => {
    if (!value) return [];
    const values = Array.isArray(value) ? value : [value];
    return values.map((item) => item.trim()).filter(Boolean);
  };

  const normalizedDomains = normalizeSearchParam(domain);
  const normalizedThemes = normalizeSearchParam(theme);
  const normalizedTags = normalizeSearchParam(tag);
  const normalizedTypes = normalizeSearchParam(type).filter(
    (value): value is 'test' | 'resource' => value === 'test' || value === 'resource',
  );

  const t = await getTranslations({ locale, namespace: 'SearchHub' });
  const searchHubData = await getSearchHubData({
    locale: locale as Locale,
    query: Array.isArray(q) ? q[0] : q ?? undefined,
    page: Array.isArray(page) ? page[0] : page,
    limit: Array.isArray(limit) ? limit[0] : limit,
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
              defaultValue={Array.isArray(q) ? q[0] ?? '' : q ?? ''}
              id="search-query"
              name="q"
              placeholder={t('search.inputPlaceholder')}
              type="search"
            />
          </div>
          {Array.isArray(limit) ? limit[0] : limit ? (
            <input name="limit" type="hidden" value={Array.isArray(limit) ? limit[0] : limit} />
          ) : null}
          {normalizedDomains.map((value) => (
            <input key={`domain-${value}`} name="domain" type="hidden" value={value} />
          ))}
          {normalizedThemes.map((value) => (
            <input key={`theme-${value}`} name="theme" type="hidden" value={value} />
          ))}
          {normalizedTags.map((value) => (
            <input key={`tag-${value}`} name="tag" type="hidden" value={value} />
          ))}
          {normalizedTypes.map((value) => (
            <input key={`type-${value}`} name="type" type="hidden" value={value} />
          ))}
          <input name="page" type="hidden" value="1" />
          <button className={`ui-button ui-button-sm ${styles.searchButton}`} type="submit">
            {t('search.submit')}
          </button>
        </form>
      </header>

      <SearchHub
        groups={searchHubData.groups}
        domains={searchHubData.domains}
        tags={searchHubData.tags}
        themes={searchHubData.themes}
        initialFilters={{
          domains: normalizedDomains,
          tags: normalizedTags,
          themes: normalizedThemes,
          types: normalizedTypes,
        }}
      />
    </main>
  );
}
