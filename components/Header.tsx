'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import CatalogueMegaMenu from '@/components/CatalogueMegaMenu';
import type { CatalogueDomain } from '@/lib/navigation/catalogue';

function Header() {
  const t = useTranslations('Header');
  const navErrorMessage = t('navError');
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
          setCatalogueDomains(Array.isArray(data.domains) ? data.domains : []);
        }
      } catch (err: unknown) {
        console.error('[Header] Failed to load catalogue:', err);
        if (!cancelled) {
            setError(String(navErrorMessage));
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
  }, [navErrorMessage]);

  return (
    <header className="ph-header" role="banner">
      <div className="ph-header__bar container">
        <Link className="ph-header__brand" href="/" aria-label={t('brandAria')}>
          <div className="ph-header__logo" aria-hidden>
            OT
          </div>
          <div>
            <p className="ph-header__name">{t('brandName')}</p>
            <p className="ph-header__tagline">{t('tagline')}</p>
          </div>
        </Link>

        <div className="ph-header__search" role="search">
          <input
            type="search"
            name="search"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
          />
        </div>

        <nav className="ph-header__nav" aria-label="Navigation principale">
          {loading && (
            <span className="ph-header__link ph-header__link--muted">
              {t('navLoading')}
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
            {t('community')}
          </a>
          <a className="ph-header__link" href="#news">
            {t('news')}
          </a>
          <div className="ph-header__menu">
            <button
              className="ph-header__link ph-header__menu-toggle"
              type="button"
              aria-haspopup="true"
              aria-expanded={false}
            >
              {t('admin')}
              <span aria-hidden>▾</span>
            </button>
            <div className="ph-header__submenu" aria-label={t('adminMenuLabel')}>
              <Link className="ph-header__submenu-link" href="/administration">
                {t('dashboard')}
              </Link>
              <Link className="ph-header__submenu-link" href="/tests/manage">
                {t('addTest')}
              </Link>
              <Link className="ph-header__submenu-link" href="/administration/taxonomy">
                {t('taxonomy')}
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
