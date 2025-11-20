import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="container header-shell">
      <div className="glass header-bar">
        <div className="brand">
          <div className="brand-mark">OT</div>
          <div className="brand-copy">
            <p style={{ color: '#0f172a', fontWeight: 800 }}>Othoutils</p>
            <small className="text-subtle">Référentiel clinique, co-construit par les équipes de soins</small>
          </div>
        </div>
        <nav className="nav">
          <a href="#catalogue" className="secondary-btn" style={{ padding: '0.55rem 0.9rem' }}>
            Catalogue
          </a>
          <a href="#collaboration" className="top-banner__link">
            Collaboration
          </a>
          <a href="#collaboration" className="primary-btn top-banner__cta">
            Soumettre une idée
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
