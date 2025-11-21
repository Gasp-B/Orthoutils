import Link from 'next/link';

function Header() {
  return (
    <header className="ph-header" role="banner">
      <div className="ph-header__bar container">
        <Link className="ph-header__brand" href="/" aria-label="Othoutils, retour à l'accueil">
          <div className="ph-header__logo" aria-hidden>
            OT
          </div>
          <div>
            <p className="ph-header__name">Othoutils</p>
            <p className="ph-header__tagline">Ressources cliniques vérifiées par des orthophonistes</p>
          </div>
        </Link>

        <div className="ph-header__search" role="search">
          <input
            type="search"
            name="search"
            placeholder="Rechercher un outil, une thématique..."
            aria-label="Rechercher un outil, une thématique"
          />
        </div>

        <nav className="ph-header__nav" aria-label="Navigation principale">
          <Link className="ph-header__link" href="/catalogue">
            Catalogue
          </Link>
          <a className="ph-header__link" href="#collaboration">
            Communauté
          </a>
          <a className="ph-header__link" href="#news">
            Nouveautés
          </a>
          <div className="ph-header__menu">
            <button className="ph-header__link ph-header__menu-toggle" type="button" aria-haspopup="true">
              Administration
              <span aria-hidden>▾</span>
            </button>
            <div className="ph-header__submenu" aria-label="Menu administration">
              <a className="ph-header__submenu-link" href="/administration">
                Tableau de bord
              </a>
              <a className="ph-header__submenu-link" href="/tests/manage">
                Ajouter un test
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
