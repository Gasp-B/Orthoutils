import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="container" style={{ padding: '2.5rem 0 1.5rem' }}>
      <div
        className="glass"
        style={{
          padding: '2.2rem',
          display: 'grid',
          gap: '1.5rem',
          background:
            'radial-gradient(circle at 12% 18%, rgba(14,165,233,0.18), transparent 42%), radial-gradient(circle at 92% 14%, rgba(34,197,94,0.18), transparent 35%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="section-title">
            <span />
            <p style={{ margin: 0, opacity: 0.8 }}>Orthophonie centrée patient, nourrie par vos pratiques</p>
          </div>
          <h1
            style={{
              margin: 0,
              color: '#0f172a',
              fontSize: 'clamp(2.1rem, 3vw, 2.8rem)',
              lineHeight: 1.2,
            }}
          >
            Une bibliothèque clinique pour référencer, évaluer et adapter vos outils d'orthophonie
          </h1>
          <p style={{ margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
            Pensé pour les cabinets, centres hospitaliers et services de rééducation : Othoutils rassemble les
            questionnaires, batteries et fiches de suivi en un espace rassurant. Les équipes peuvent partager leurs
            ajustements, valider les mises à jour et documenter les effets sur le parcours de soin.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="#catalogue" className="primary-btn">
              Découvrir le catalogue
            </a>
            <a href="#collaboration" className="secondary-btn">
              Voir comment nous validons les fiches
            </a>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
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
          ].map(
            (item) => (
              <div key={item.title} className="glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.75)' }}>
                <p style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>{item.title}</p>
                <p style={{ margin: '0.2rem 0 0', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
