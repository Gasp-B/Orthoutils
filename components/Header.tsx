function Header() {
  return (
    <header className="container header-shell">
      <div className="glass header-bar">
        <div className="brand">
          <div className="brand-mark">OT</div>
          <div className="brand-copy">
            <p style={{ color: '#0f172a', fontWeight: 800 }}>Othoutils</p>
            <small className="text-subtle">Référentiels cliniques validés par des orthophonistes</small>
          </div>
        </div>
        <nav className="nav">
          <a href="#catalogue" className="secondary-btn" style={{ padding: '0.55rem 0.9rem' }}>
            Catalogue
          </a>
          <a href="#collaboration" className="top-banner__link">
            Collaboration
          </a>
          <a href="/tools/new" className="top-banner__link">
            Ajouter un outil
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
