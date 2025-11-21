'use client';

import { useQuery } from '@tanstack/react-query';
import { referentialsResponseSchema, type ReferentialDto } from '@/lib/validation/referentials';
import styles from './referentials-section.module.css';

async function fetchReferentials() {
  const response = await fetch('/api/referentials', { cache: 'no-store' });

  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({ error: null }))) as { error?: string | null };
    throw new Error(error ?? "Erreur lors du chargement des référentiels");
  }

  const data = (await response.json()) as unknown;
  return referentialsResponseSchema.parse(data).referentials;
}

function ReferentialsSection() {
  const { data: referentials = [], isLoading, isError, refetch } = useQuery<ReferentialDto[]>({
    queryKey: ['referentials'],
    queryFn: fetchReferentials,
    staleTime: 1000 * 60,
    retry: false,
  });

  return (
    <section id="referentiels" className="container section-shell">
      <div className="section-title">
        <span />
        <p className={styles.sectionLabel}>Référentiels structurés</p>
      </div>

      {isLoading && <p className="text-subtle">Chargement des référentiels depuis Supabase…</p>}

      {isError && (
        <div className={`glass panel ${styles.errorPanel}`}>
          <div>
            <p className={styles.errorTitle}>Impossible de récupérer les référentiels</p>
            <p className={`text-subtle ${styles.errorSubtitle}`}>
              Vérifiez la connexion ou rechargez la page. La requête passe par Supabase avec RLS activé.
            </p>
          </div>
          <button className="secondary-btn" type="button" onClick={() => void refetch()}>
            Réessayer
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
              <span className="badge validated">Référentiel</span>
            </div>

            <div className={`tag-row ${styles.subsectionRow}`}>
              {referential.subsections.map((subsection) => (
                <span key={subsection.id} className={`tag ${styles.subsectionTag}`}>
                  {subsection.name}
                </span>
              ))}
              {referential.subsections.length === 0 && (
                <span className="text-subtle">Aucune sous-catégorie associée pour le moment.</span>
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
          Aucun référentiel n'est disponible pour le moment. Vérifiez que les données sont bien présentes dans Supabase.
        </p>
      )}
    </section>
  );
}

export default ReferentialsSection;
