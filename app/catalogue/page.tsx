import Link from 'next/link';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';
import styles from './catalogue.module.css';

function formatAgeRange(min: number | null, max: number | null) {
  if (min && max) {
    return `${min} à ${max} mois`;
  }

  if (min) {
    return `Dès ${min} mois`;
  }

  if (max) {
    return `Jusqu'à ${max} mois`;
  }

  return 'Âge libre';
}

function formatDuration(minutes: number | null) {
  if (!minutes) {
    return 'Durée variable';
  }

  return `${minutes} min`;
}

export const dynamic = 'force-dynamic';

export default async function CataloguePage() {
  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata();
  } catch (error) {
    console.error('Impossible de charger le catalogue complet', error);
    loadError =
      'Le catalogue ne peut pas être affiché pour le moment. Vérifiez la connexion à Supabase ou réessayez dans un instant.';
  }

  return (
    <main className={`container section-shell ${styles.page}`}>
      <header className="section-shell">
        <div className="section-title">
          <span />
          <p className={styles.sectionLabel}>Catalogue des tests</p>
        </div>
        <div className="glass panel">
          <div className={styles.headerRow}>
            <div className={`stack ${styles.headingStack}`}>
              <h1 className={styles.headingTitle}>Tests d&apos;orthophonie référencés</h1>
              <p className={styles.headingText}>
                Retrouvez les évaluations publiées, leur objectif clinique, le public ciblé et les données pratiques pour
                planifier vos séances.
              </p>
            </div>
            <Link className="ph-header__pill" href="/tests/manage">
              Ajouter un test
            </Link>
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
                    {test.shortDescription ?? 'Description à venir.'}
                  </p>
                </div>
                <span className={styles.durationBadge}>
                  {formatDuration(test.durationMinutes)}
                </span>
              </div>

              <div className={styles.badgeRow}>
                <span className="badge">{formatAgeRange(test.ageMinMonths, test.ageMaxMonths)}</span>
                <span className="badge">{test.population ?? 'Population générale'}</span>
                <span className="badge">{test.isStandardized ? 'Standardisé' : 'Non standardisé'}</span>
              </div>

              <div className={styles.metaList}>
                {test.objective && (
                  <p className={styles.metaItem}>
                    <strong>Objectif :</strong> {test.objective}
                  </p>
                )}
                {test.materials && (
                  <p className={styles.metaItem}>
                    <strong>Matériel :</strong> {test.materials}
                  </p>
                )}
                {test.publisher && (
                  <p className={styles.metaItem}>
                    <strong>Éditeur :</strong> {test.publisher}
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
                    Acheter / Consulter
                  </a>
                ) : (
                  <span className="text-subtle">Pas de lien d&apos;achat renseigné</span>
                )}
                <Link className="ph-header__link" href={`/catalogue/${test.slug}`} aria-label={`Consulter ${test.name}`}>
                  Voir la fiche
                </Link>
              </div>
            </article>
          ))}
        </div>

        {tests.length === 0 && (
          <div className={`glass panel ${styles.emptyState}`}>
            <p className={`text-subtle ${styles.emptyText}`}>
              {loadError ??
                "Aucun test n'est référencé pour l'instant. Ajoutez vos premiers tests pour alimenter le catalogue."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
