import React from 'react';

const Hero: React.FC = () => {
  const preview = {
    name: 'EVALO 2-6',
    status: 'Validé',
    version: 'v3.1',
    lastReview: '05/2025',
    population: 'Enfants 2 à 6 ans',
    focus: 'Langage oral · compréhension · production',
  } as const;

  return (
    <section className="container hero-shell">
      <div className="glass hero-grid">
        <div className="stack">
          <div className="section-title">
            <span />
            <p style={{ margin: 0, opacity: 0.8 }}>Référentiels conçus et validés par des orthophonistes</p>
          </div>
          <h1 className="title-lg">
            Une bibliothèque clinique pour consulter des outils éprouvés et suivre leur validation
          </h1>
          <p className="hero-lead section-note">
            Pensé pour les cabinets, centres hospitaliers et services de rééducation : Othoutils met en avant les
            questionnaires, batteries et fiches de suivi déjà relus par des professionnels de santé. Les équipes peuvent
            ensuite proposer, en toute discrétion, des ajustements documentés et relus avant diffusion.
          </p>
          <div className="hero-actions">
            <a href="#catalogue" className="primary-btn">
              Consulter les référentiels validés
            </a>
            <a href="#collaboration" className="secondary-btn">
              Comprendre la validation éditoriale
            </a>
          </div>
        </div>
        <div className="hero-support">
          <div className="glass panel preview-card">
            <div className="preview-header">
              <div>
                <p className="preview-label">Référentiel</p>
                <p className="preview-title">{preview.name}</p>
              </div>
              <span className="badge validated">{preview.status}</span>
            </div>
            <div className="preview-meta">
              <div>
                <p className="preview-label">Version</p>
                <p className="preview-value">{preview.version}</p>
              </div>
              <div>
                <p className="preview-label">Relecture orthophoniste</p>
                <p className="preview-value">{preview.lastReview}</p>
              </div>
              <div>
                <p className="preview-label">Population</p>
                <p className="preview-value">{preview.population}</p>
              </div>
            </div>
            <div className="preview-foot">
              <p className="preview-label">Focus clinique</p>
              <p className="body-text" style={{ marginTop: '0.1rem' }}>{preview.focus}</p>
              <p className="section-note" style={{ marginTop: '0.4rem' }}>
                Fiche validée par des orthophonistes. Les propositions d’ajustements restent discrètes et arrivent après la
                lecture des consignes et cotations.
              </p>
            </div>
          </div>
          {[
            {
              title: 'Référentiels vérifiés',
              desc: 'Chaque fiche est relue par des orthophonistes et publiée avec les précisions nécessaires au terrain.',
            },
            {
              title: 'Validation par pairs',
              desc: 'Un circuit de relecture clair : brouillon, relecture interdisciplinaire puis diffusion sécurisée.',
            },
            {
              title: 'Prêt pour le terrain',
              desc: 'Interface lumineuse, lisible et accessible pour travailler au cabinet, à l’hôpital ou en mobilité.',
            },
          ].map((item) => (
            <div key={item.title} className="glass panel support-card">
              <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>{item.title}</p>
              <p className="body-text" style={{ marginTop: '0.2rem' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
