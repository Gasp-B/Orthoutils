'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CatalogueMegaMenu from '@/components/CatalogueMegaMenu';
import type { CatalogueDomain } from '@/lib/navigation/catalogue';

function Header() {
  const [catalogueDomains, setCatalogueDomains] = useState<CatalogueDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const res = await fetch('/api/catalogue', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: { domains?: CatalogueDomain[] } = await res.json();

        if (!cancelled) {
          // On suppose que l’API renvoie { domains: [...] }
          setCatalogueDomains(data.domains ?? []);
        }
      } catch (err) {
        console.error('[Header] Failed to load catalogue:', err);
        if (!cancelled) {
          setError('Impossible de charger le catalogue');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="ph-header" role="banner">
      <div className="ph-header__bar container">
        <Link className="ph-header__brand" href="/" aria-label="Othoutils, retour à l&apos;accueil">
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
          {loading && (
            <span className="ph-header__link ph-header__link--muted">
              Chargement du catalogue…
            </span>
          )}

          {!loading && !error && (
            <CatalogueMegaMenu domains={catalogueDomains} />
          )}

          {!loading && error && (
            <span className="ph-header__link ph-header__link--error">
              {error}
            </span>
          )}

          <a className="ph-header__link" href="#collaboration">
            Communauté
          </a>
          <a className="ph-header__link" href="#news">
            Nouveautés
          </a>
          <div className="ph-header__menu">
            <button
              className="ph-header__link ph-header__menu-toggle"
              type="button"
              aria-haspopup="true"
            >
              Administration
              <span aria-hidden>▾</span>
            </button>
            <div className="ph-header__submenu" aria-label="Menu administration">
              <Link className="ph-header__submenu-link" href="/administration">
                Tableau de bord
              </Link>
              <Link className="ph-header__submenu-link" href="/tests/manage">
                Ajouter un test
              </Link>
              <Link className="ph-header__submenu-link" href="/administration/taxonomy">
                Catégories &amp; tags
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
