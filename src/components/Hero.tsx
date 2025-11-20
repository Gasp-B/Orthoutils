import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="container hero-shell">
      <div className="glass hero-grid">
        <div className="stack">
          <div className="section-title">
            <span />
            <p style={{ margin: 0, opacity: 0.8 }}>Orthophonie centrée patient, nourrie par vos pratiques</p>
          </div>
          <h1 className="title-lg">
            Une bibliothèque clinique pour référencer, évaluer et adapter vos outils d'orthophonie
          </h1>
          <p className="hero-lead section-note">
            Pensé pour les cabinets, centres hospitaliers et services de rééducation : Othoutils rassemble les
            questionnaires, batteries et fiches de suivi en un espace rassurant. Les équipes peuvent partager leurs
            ajustements, valider les mises à jour et documenter les effets sur le parcours de soin.
          </p>
          <div className="hero-actions">
            <a href="#catalogue" className="primary-btn">
              Découvrir le catalogue
            </a>
            <a href="#collaboration" className="secondary-btn">
              Voir comment nous validons les fiches
            </a>
          </div>
        </div>
        <div className="hero-support">
          {[
            {
              title: 'Continuité des soins',
              desc: 'Suivez les évolutions de chaque outil avec des repères cliniques compréhensibles par toute l’équipe.',
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
