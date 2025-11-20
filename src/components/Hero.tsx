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
            'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.16), transparent 40%), radial-gradient(circle at 90% 10%, rgba(14,165,233,0.22), transparent 35%), rgba(17,24,39,0.75)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="section-title">
            <span />
            <p style={{ margin: 0, opacity: 0.75 }}>Orthophonie augmentée par la communauté</p>
          </div>
          <h1
            style={{
              margin: 0,
              color: '#e2e8f0',
              fontSize: 'clamp(2.1rem, 3vw, 2.8rem)',
              lineHeight: 1.2,
            }}
          >
            Référencez, évaluez et améliorez les outils d'orthophonie en équipe
          </h1>
          <p style={{ margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
            Othoutils centralise les questionnaires, batteries et suivis patients avec un mode collaboratif.
            Chaque membre peut proposer des évolutions, annoter les fiches et alimenter vos tableaux de bord en
            temps réel.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="#catalogue" className="primary-btn">
              Découvrir le catalogue
            </a>
            <a href="#collaboration" className="secondary-btn">
              Comment proposer des modifications ?
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
          {[{ title: 'Synchronisation', desc: 'Glissez vos fiches vers vos outils préférés en un clic et conservez un historique.' },
          { title: 'Gouvernance', desc: 'Workflow de revue : brouillon, validation par pairs et diffusion publique.' },
          { title: 'Accessibilité', desc: 'Interface responsive, contrastée et prête pour les cabinets comme le terrain.' }].map(
            (item) => (
              <div key={item.title} className="glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 700 }}>{item.title}</p>
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
