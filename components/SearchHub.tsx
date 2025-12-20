'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type {
  ResourceSearchResult,
  SearchGroup,
  SearchHubProps,
  SearchResult,
  SearchResultKind,
} from '@/lib/search/types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import styles from './search-hub.module.css';

const categoryAccentClass: Record<SearchGroup['category'], string> = {
  assessments: styles.assessmentsAccent,
  selfReports: styles.selfReportsAccent,
  resources: styles.resourcesAccent,
};

type ResourceTypeGroup = {
  resourceType: string;
  results: ResourceSearchResult[];
};

function summarizeTags(
  tags: string[],
  t: (key: string, values?: Record<string, string | number | Date>) => string,
) {
  if (tags.length === 0) {
    return t('tags.empty');
  }

  if (tags.length === 1) {
    return tags[0];
  }

  return t('tags.more', { tag: tags[0], count: tags.length - 1 });
}

function buildTypeFilters(t: (key: string) => string) {
  return [
    { value: 'test' as const, label: t('filters.types.tests') },
    { value: 'resource' as const, label: t('filters.types.resources') },
  ];
}

function groupResourcesByType(results: ResourceSearchResult[]): ResourceTypeGroup[] {
  const grouped = new Map<string, ResourceSearchResult[]>();

  for (const result of results) {
    const list = grouped.get(result.resourceType) ?? [];
    list.push(result);
    grouped.set(result.resourceType, list);
  }

  return Array.from(grouped.entries())
    .map(([resourceType, entries]) => ({
      resourceType,
      results: entries.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.resourceType.localeCompare(b.resourceType));
}

function isResourceResult(result: SearchResult): result is ResourceSearchResult {
  return result.kind === 'resource';
}

const allowedTypes: SearchResultKind[] = ['test', 'resource'];

export default function SearchHub({ groups, domains, tags, themes, initialFilters }: SearchHubProps) {
  const t = useTranslations('SearchHub');
  const shared = useTranslations('Shared');
  const typeFilters = useMemo(() => buildTypeFilters(t), [t]);

  const initialFilterValues = useMemo(() => {
    const selectedTypes = (initialFilters?.types ?? allowedTypes).filter((value) =>
      allowedTypes.includes(value),
    );
    return {
      types: selectedTypes.length > 0 ? selectedTypes : allowedTypes,
      domains: (initialFilters?.domains ?? []).filter((value) => domains.includes(value)),
      tags: (initialFilters?.tags ?? []).filter((value) => tags.includes(value)),
      themes: (initialFilters?.themes ?? []).filter((value) => themes.includes(value)),
    };
  }, [
    domains,
    initialFilters?.domains,
    initialFilters?.tags,
    initialFilters?.themes,
    initialFilters?.types,
    tags,
    themes,
  ]);

  const [activeTypes, setActiveTypes] = useState<Set<SearchResultKind>>(
    new Set(initialFilterValues.types),
  );
  const [activeDomains, setActiveDomains] = useState<Set<string>>(
    new Set(initialFilterValues.domains),
  );
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set(initialFilterValues.tags));
  const [activeThemes, setActiveThemes] = useState<Set<string>>(
    new Set(initialFilterValues.themes),
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setActiveTypes(new Set(initialFilterValues.types));
    setActiveDomains(new Set(initialFilterValues.domains));
    setActiveTags(new Set(initialFilterValues.tags));
    setActiveThemes(new Set(initialFilterValues.themes));
    setExpanded(new Set());
  }, [initialFilterValues]);

  const toggleType = (value: SearchResultKind) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleDomain = (value: string) => {
    setActiveDomains((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleTag = (value: string) => {
    setActiveTags((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleTheme = (value: string) => {
    setActiveThemes((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        results: group.results.filter((result) => {
          const matchType = activeTypes.has(result.kind);
          const matchDomain =
            activeDomains.size === 0 || result.domains.some((domain) => activeDomains.has(domain));
          const matchTag = activeTags.size === 0 || result.tags.some((tag) => activeTags.has(tag));
          const matchTheme =
            activeThemes.size === 0 || result.themes.some((theme) => activeThemes.has(theme));
          return matchType && matchDomain && matchTag && matchTheme;
        }),
      }))
      .filter((group) => group.results.length > 0);
  }, [activeDomains, activeTags, activeThemes, activeTypes, groups]);

  const resourceTypeGroups = useMemo(() => {
    const resourcesGroup = filteredGroups.find((group) => group.category === 'resources');
    if (!resourcesGroup) return [];

    const resourcesOnly = resourcesGroup.results.filter(isResourceResult);

    return groupResourcesByType(resourcesOnly);
  }, [filteredGroups]);

  const hasResults = filteredGroups.some((group) => group.results.length > 0);

  const renderResultCard = (groupCategory: SearchGroup['category'], result: SearchResult) => {
    const isExpanded = expanded.has(result.id);

    return (
      <article key={result.id} className={`glass panel ${styles.resultCard}`}>
        <button
          type="button"
          className={styles.resultHeader}
          onClick={() => toggleExpanded(result.id)}
          aria-expanded={isExpanded}
          aria-controls={`details-${result.id}`}
        >
          <div className={`${styles.resultIcon} ${categoryAccentClass[groupCategory]}`} aria-hidden>
            {result.kind === 'test' ? '🧪' : '🔗'}
          </div>
          <div className={styles.resultSummary}>
            <p className={styles.resultTitle}>{result.title}</p>
            <p className={styles.resultTags}>{summarizeTags(result.tags, t)}</p>
          </div>
          <div className={styles.resultBadges}>
            {result.domains.slice(0, 3).map((domain) => (
              <Badge key={domain} variant="secondary" className={styles.badge}>
                {domain}
              </Badge>
            ))}
          </div>
        </button>

        {isExpanded && (
          <div className={styles.resultDetails} id={`details-${result.id}`}>
            <p className={styles.description}>{result.description ?? shared('placeholders.description')}</p>

            <dl className={styles.metaGrid}>
              {result.kind === 'test' && (
                <>
                  <div>
                    <dt>{t('meta.population')}</dt>
                    <dd>{result.population ?? shared('populationDefault')}</dd>
                  </div>
                  <div>
                    <dt>{t('meta.materials')}</dt>
                    <dd>{result.materials ?? t('meta.materialsFallback')}</dd>
                  </div>
                </>
              )}

              {result.kind === 'resource' && (
                <div>
                  <dt>{t('meta.resourceType')}</dt>
                  <dd>{result.resourceType}</dd>
                </div>
              )}

              {result.themes.length > 0 && (
                <div className={styles.themeRow}>
                  <dt>{t('meta.themes')}</dt>
                  <dd>
                    <div className={styles.pillRow}>
                      {result.themes.map((theme) => (
                        <Badge key={theme} variant="outline" className={styles.badge}>
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>

            <div className={styles.ctaRow}>
              {result.kind === 'test' ? (
                <Link
                  href={{ pathname: '/catalogue/[slug]', params: { slug: result.slug } }}
                  className={styles.ctaLink}
                >
                  <Button>{t('actions.viewSheet')}</Button>
                </Link>
              ) : (
                <Button
                  disabled={!result.url}
                  variant={result.url ? 'default' : 'outline'}
                  onClick={() => {
                    if (!result.url) return;
                    window.open(result.url, '_blank', 'noreferrer');
                  }}
                >
                  {t('actions.viewResource')}
                </Button>
              )}
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className={styles.layout}>
      <aside className={`glass panel ${styles.sidebar}`} aria-label={t('filters.title')}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarLabel}>{t('filters.title')}</p>
          <p className={styles.sidebarLead}>{t('filters.lead')}</p>
        </div>

        <div className={styles.filterGroup}>
          <p className={styles.filterTitle}>{t('filters.typeLabel')}</p>
          <div className={styles.checkboxList}>
            {typeFilters.map((filter) => (
              <label key={filter.value} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={activeTypes.has(filter.value)}
                  onChange={() => toggleType(filter.value)}
                  aria-checked={activeTypes.has(filter.value)}
                />
                <span>{filter.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <p className={styles.filterTitle}>{t('filters.domainsLabel')}</p>
          <div className={styles.domainList}>
            {domains.map((domain) => {
              const isActive = activeDomains.has(domain);
              return (
                <button
                  key={domain}
                  type="button"
                  className={`${styles.domainChip} ${isActive ? styles.domainChipActive : ''}`}
                  onClick={() => toggleDomain(domain)}
                  aria-pressed={isActive}
                >
                  {domain}
                </button>
              );
            })}

            {domains.length === 0 && <p className={styles.emptyHelper}>{t('filters.emptyDomains')}</p>}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <p className={styles.filterTitle}>{t('filters.themesLabel')}</p>
          <div className={styles.domainList}>
            {themes.map((theme) => {
              const isActive = activeThemes.has(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  className={`${styles.domainChip} ${isActive ? styles.domainChipActive : ''}`}
                  onClick={() => toggleTheme(theme)}
                  aria-pressed={isActive}
                >
                  {theme}
                </button>
              );
            })}

            {themes.length === 0 && <p className={styles.emptyHelper}>{t('filters.emptyThemes')}</p>}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <p className={styles.filterTitle}>{t('filters.tagsLabel')}</p>
          <div className={styles.domainList}>
            {tags.map((tag) => {
              const isActive = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.domainChip} ${isActive ? styles.domainChipActive : ''}`}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isActive}
                >
                  {tag}
                </button>
              );
            })}

            {tags.length === 0 && <p className={styles.emptyHelper}>{t('filters.emptyTags')}</p>}
          </div>
        </div>

        <div className={styles.filterFooter}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => {
              setActiveDomains(new Set());
              setActiveTags(new Set());
              setActiveThemes(new Set());
              setActiveTypes(new Set(allowedTypes));
            }}
          >
            {t('filters.reset')}
          </button>
        </div>
      </aside>

      <section className={styles.results} aria-live="polite">
        {!hasResults && (
          <div className={`glass panel ${styles.empty}`}>{t('empty')}</div>
        )}

        {filteredGroups.map((group) => (
          <div key={group.category} className={styles.group}>
            <header className={styles.groupHeader}>
              <div className={`${styles.groupDot} ${categoryAccentClass[group.category]}`} aria-hidden />
              <div>
                <p className={styles.groupLabel}>{t(`categories.${group.category}.title`)}</p>
                <p className={styles.groupLead}>{t(`categories.${group.category}.subtitle`)}</p>
              </div>
            </header>

            {group.category === 'resources' ? (
              <div className={styles.resourceTypeList}>
                {resourceTypeGroups.map((resourceTypeGroup) => (
                  <div key={resourceTypeGroup.resourceType} className={styles.resourceTypeGroup}>
                    <div className={styles.resourceTypeHeader}>
                      <p className={styles.resourceTypeLabel}>{t('meta.resourceType')}</p>
                      <p className={styles.resourceTypeName}>{resourceTypeGroup.resourceType}</p>
                    </div>
                    <div className={styles.resultList}>
                      {resourceTypeGroup.results.map((result) => renderResultCard(group.category, result))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.resultList}>
                {group.results.map((result) => renderResultCard(group.category, result))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
