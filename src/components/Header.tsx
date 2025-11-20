import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="top-banner">
      <div className="container top-banner__content">
        <div className="top-banner__identity">
          <div className="top-banner__mark">OT</div>
          <div>
            <p className="top-banner__title">Othoutils</p>
            <small className="top-banner__subtitle">Référentiel collaboratif d'outils d'orthophonie</small>
          </div>
        </div>
        <nav className="top-banner__nav">
          <a href="#top" className="top-banner__link">
            Accueil
          </a>
          <a href="#catalogue" className="top-banner__link">
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
