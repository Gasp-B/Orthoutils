import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="container" style={{ padding: '1.2rem 0 0.6rem' }}>
      <div
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.2rem',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              display: 'grid',
              placeItems: 'center',
              color: '#0b1223',
              fontWeight: 900,
              letterSpacing: '0.04em',
            }}
          >
            OT
          </div>
          <div>
            <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 800 }}>Othoutils</p>
            <small style={{ color: 'rgba(255,255,255,0.65)' }}>
              Référentiel collaboratif d'outils d'orthophonie
            </small>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', color: '#e2e8f0' }}>
          <a href="#catalogue" className="secondary-btn" style={{ padding: '0.55rem 0.9rem' }}>
            Catalogue
          </a>
          <a href="#collaboration" className="secondary-btn" style={{ padding: '0.55rem 0.9rem' }}>
            Collaboration
          </a>
          <a href="#collaboration" className="primary-btn" style={{ padding: '0.75rem 1rem' }}>
            Soumettre une idée
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
