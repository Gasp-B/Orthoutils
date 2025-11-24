'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { referentialsResponseSchema, type ReferentialDto } from '@/lib/validation/referentials';
import styles from './referentials-section.module.css';

function ReferentialsSection() {
  const t = useTranslations('Referentials');
  const shared = useTranslations('Shared');
  const locale = useLocale();

  const { data: referentials = [], isLoading, isError, refetch } = useQuery<ReferentialDto[]>({
    queryKey: ['referentials', locale],
    queryFn: async () => {
      const response = await fetch(`/api/referentials?locale=${locale}`, { cache: 'no-store' });

      if (!response.ok) {
        let errorMessage = t('errors.load');

        try {
          const payload = (await response.json()) as { error?: unknown };
          if (typeof payload.error === 'string') {
            errorMessage = payload.error;
          }
        } catch {
          // Ignore parsing issues and keep the localized message
        }

        throw new Error(String(errorMessage));
      }

      const data = (await response.json()) as unknown;
      return referentialsResponseSchema.parse(data).referentials;
    },
    staleTime: 1000 * 60,
    retry: false,
  });

  return (
    <section id="referentiels" className="container section-shell">
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>{t('sectionLabel')}</p>
      </div>

      {isLoading && <p className="text-subtle">{t('loading')}</p>}

      {isError && (
        <div className={`glass panel ${styles.errorPanel}`}>
          <div>
            <p className={styles.errorTitle}>{t('errorTitle')}</p>
            <p className={`text-subtle ${styles.errorSubtitle}`}>{t('errorSubtitle')}</p>
          </div>
          <button className="secondary-btn" type="button" onClick={() => void refetch()}>
            {shared('ctas.retry')}
          </button>
        </div>
      )}

      <div className="card-grid">
        {referentials.map((referential) => (
          <article key={referential.id} className={`glass panel panel-muted ${styles.referentialCard}`}>
            <div className={styles.referentialHeader}>
              <div>
                <p className={styles.cardTitle}>{referential.name}</p>
                {referential.description && (
                  <p className={`text-subtle ${styles.cardSubtitle}`}>
                    {referential.description}
                  </p>
                )}
              </div>
              <span className="badge validated">{shared('statuses.referential')}</span>
            </div>

            <div className={`tag-row ${styles.subsectionRow}`}>
              {referential.subsections.map((subsection) => (
                <span key={subsection.id} className={`tag ${styles.subsectionTag}`}>
                  {subsection.name}
                </span>
              ))}
              {referential.subsections.length === 0 && (
                <span className="text-subtle">{t('emptySubsections')}</span>
              )}
            </div>

            {referential.subsections.some((subsection) => subsection.tags.length > 0) && (
              <div className={`tag-row ${styles.tagRowTight}`}>
                {referential.subsections.flatMap((subsection) =>
                  subsection.tags.map((tag) => (
                    <span key={`${subsection.id}-${tag.id}`} className={`tag ${styles.lightTag}`}>
                      #{tag.name}
                    </span>
                  )),
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {!isLoading && !isError && referentials.length === 0 && (
        <p className={`text-subtle ${styles.emptyState}`}>
          {t('emptyState')}
        </p>
      )}
    </section>
  );
}

export default ReferentialsSection;