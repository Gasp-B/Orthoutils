import Link from 'next/link';
import { getTestsWithMetadata } from '@/lib/tests/queries';

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
  const tests = await getTestsWithMetadata();

  return (
    <main className="container section-shell" style={{ padding: '1.5rem 0 2rem' }}>
      <header className="section-shell">
        <div className="section-title">
          <span />
          <p style={{ margin: 0 }}>Catalogue des tests</p>
        </div>
        <div className="glass panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
            <div className="stack" style={{ margin: 0 }}>
              <h1 style={{ margin: 0, color: '#0f172a' }}>Tests d&apos;orthophonie référencés</h1>
              <p style={{ margin: 0 }}>
                Retrouvez les évaluations publiées, leur objectif clinique, le public ciblé et les données pratiques pour
                planifier vos séances.
              </p>
            </div>
            <Link className="ph-header__pill" href="/tools/new">
              Ajouter un test
            </Link>
          </div>
        </div>
      </header>

      <section className="section-shell">
        <div className="card-grid">
          {tests.map((test) => (
            <article key={test.id} className="glass panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>{test.name}</p>
                  <p className="text-subtle" style={{ margin: '0.1rem 0 0' }}>
                    {test.shortDescription ?? 'Description à venir.'}
                  </p>
                </div>
                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    background: 'rgba(14,165,233,0.12)',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {formatDuration(test.durationMinutes)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="badge">{formatAgeRange(test.ageMinMonths, test.ageMaxMonths)}</span>
                <span className="badge">{test.population ?? 'Population générale'}</span>
                <span className="badge">{test.isStandardized ? 'Standardisé' : 'Non standardisé'}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', flexDirection: 'column' }}>
                {test.objective && (
                  <p style={{ margin: 0 }}>
                    <strong>Objectif :</strong> {test.objective}
                  </p>
                )}
                {test.materials && (
                  <p style={{ margin: 0 }}>
                    <strong>Matériel :</strong> {test.materials}
                  </p>
                )}
                {test.publisher && (
                  <p style={{ margin: 0 }}>
                    <strong>Éditeur :</strong> {test.publisher}
                  </p>
                )}
              </div>

              {test.domains.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {test.domains.map((domain) => (
                    <span key={domain} className="pill-muted">
                      {domain}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
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
          <p className="text-subtle" style={{ marginTop: '0.5rem' }}>
            Aucun test n&apos;est référencé pour l&apos;instant. Ajoutez vos premiers tests pour alimenter le catalogue.
          </p>
        )}
      </section>
    </main>
  );
}
