import Link from 'next/link';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import type { TestDto } from '@/lib/validation/tests';

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
          <p style={{ margin: 0 }}>Référentiel des tests</p>
        </div>

        <div className="glass panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
            <div className="stack" style={{ margin: 0 }}>
              <h2 style={{ margin: 0, color: '#0f172a' }}>Catalogue clinique</h2>
              <p style={{ margin: 0 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{test.name}</p>
                  <p className="text-subtle" style={{ margin: '0.1rem 0 0' }}>
                    {test.shortDescription ?? 'Description à venir.'}
                  </p>
                </div>
                <span className="badge">{formatAgeRange(test.ageMinMonths, test.ageMaxMonths)}</span>
              </div>

              <p style={{ margin: '0.4rem 0 0', fontWeight: 600, color: '#0f172a' }}>
                {test.objective ?? 'Objectif clinique à documenter.'}
              </p>

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {test.domains.map((domain) => (
                  <span key={domain} className="pill-muted">
                    {domain}
                  </span>
                ))}
              </div>

              {test.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {test.tags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="action-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-subtle">{test.durationMinutes ? `${test.durationMinutes} min` : 'Durée variable'}</span>
                <Link className="ph-header__link" href={`/catalogue/${test.slug}`} aria-label={`Consulter ${test.name}`}>
                  Voir la fiche
                </Link>
              </div>
            </article>
          ))}
        </div>

        {tests.length === 0 && (
          <div className="glass panel" style={{ marginTop: '0.5rem' }}>
            <p className="text-subtle" style={{ margin: 0 }}>
              {loadError ??
                "Aucun test n'est disponible pour l'instant. Ajoutez des entrées dans Supabase pour alimenter le catalogue."}
            </p>
          </div>
        )}
      </section>

      <section id="collaboration" className="container section-shell" style={{ marginTop: '1.6rem' }}>
        <div className="card-grid">
          <div className="glass panel">
            <div className="section-title">
              <span />
              <p style={{ margin: 0 }}>Gouvernance éditoriale</p>
            </div>
            <ul className="list">
              <li>Assurez un espace clair entre brouillons, fiches validées et contenus communautaires.</li>
              <li>Constituez un comité de relecture pluridisciplinaire avec attribution automatique des validations.</li>
              <li>Archivez les versions pour suivre les modifications, commentaires et décisions thérapeutiques.</li>
            </ul>
            <div className="stat-grid">
              {computedStats.map((stat) => (
                <div key={stat.label} className="glass panel stat-card">
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '1.3rem' }}>{stat.value}</p>
                  <p style={{ margin: '0.1rem 0 0', color: '#0f172a' }}>{stat.label}</p>
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
