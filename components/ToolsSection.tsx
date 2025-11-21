import Link from 'next/link';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';
import styles from './tools-section.module.css';

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

async function ToolsSection() {
  let tests: TestDto[] = [];
  let loadError: string | null = null;

  try {
    tests = await getTestsWithMetadata();
  } catch (error) {
    console.error('Erreur lors du chargement du catalogue des tests', error);
    loadError =
      "Impossible de récupérer les tests pour le moment. Vérifiez la connexion à la base Supabase ou réessayez plus tard.";
  }
  const featured = tests.slice(0, 3);
  const domains = Array.from(new Set(tests.flatMap((test) => test.domains)));

  const computedStats = [
    { label: 'Tests référencés', value: tests.length, detail: 'Synchronisés depuis Supabase' },
    { label: 'Domaines couverts', value: domains.length, detail: 'Phonologie, pragmatique, langage écrit…' },
    { label: 'Standardisés', value: tests.filter((test) => test.isStandardized).length, detail: 'Marqués comme normés' },
  ];

  return (
    <>
      <section id="catalogue" className="container section-shell">
        <div className="section-title">
          <span />
          <p className={styles.sectionLabel}>Référentiel des tests</p>
        </div>

        <div className="glass panel">
          <div className={styles.headerRow}>
            <div className={`stack ${styles.headingStack}`}>
              <h2 className={styles.headingTitle}>Catalogue clinique</h2>
              <p className={styles.headingText}>
                Une vue rapide des tests présents en base, directement issus de Supabase via Drizzle pour une cohérence
                totale avec le schéma.
              </p>
            </div>
            <Link className="ph-header__pill" href="/catalogue">
              Ouvrir le catalogue
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
                    {test.shortDescription ?? 'Description à venir.'}
                  </p>
                </div>
                <span className="badge">{formatAgeRange(test.ageMinMonths, test.ageMaxMonths)}</span>
              </div>

              <p className={styles.objectiveText}>
                {test.objective ?? 'Objectif clinique à documenter.'}
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
                <span className="text-subtle">{test.durationMinutes ? `${test.durationMinutes} min` : 'Durée variable'}</span>
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
                "Aucun test n'est disponible pour l'instant. Ajoutez des entrées dans Supabase pour alimenter le catalogue."}
            </p>
          </div>
        )}
      </section>

      <section id="collaboration" className={`container section-shell ${styles.collaborationSection}`}>
        <div className="card-grid">
          <div className="glass panel">
            <div className="section-title">
              <span />
              <p className={styles.sectionLabel}>Gouvernance éditoriale</p>
            </div>
            <ul className="list">
              <li>Assurez un espace clair entre brouillons, fiches validées et contenus communautaires.</li>
              <li>Constituez un comité de relecture pluridisciplinaire avec attribution automatique des validations.</li>
              <li>Archivez les versions pour suivre les modifications, commentaires et décisions thérapeutiques.</li>
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
