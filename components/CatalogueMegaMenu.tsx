'use client';

import { useTranslations } from 'next-intl';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Link } from '@/i18n/navigation';
import type { CatalogueDomain } from '@/lib/navigation/catalogue';

type Props = {
  domains: CatalogueDomain[];
};

function CatalogueMegaMenu({ domains }: Props) {
  const t = useTranslations('Header');

  const [isOpen, setIsOpen] = useState(false);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(
    domains[0]?.id ?? null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuId = 'catalogue-mega-menu';

  // Garde un domaine actif cohérent même si la liste change
  useEffect(() => {
    if (!domains.length) {
      setActiveDomainId(null);
      return;
    }

    if (!activeDomainId || !domains.some((d) => d.id === activeDomainId)) {
      setActiveDomainId(domains[0]?.id ?? null);
    }
  }, [activeDomainId, domains]);

  const activeDomain = useMemo(
    () => domains.find((d) => d.id === activeDomainId) ?? domains[0],
    [activeDomainId, domains],
  );

  const openMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const closeMenu = () => {
    // Petit délai pour éviter les clignotements quand on passe
    // du bouton vers le panel avec la souris
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 80);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    // Navigation simple au clavier entre les domaines (↑ / ↓)
    if (!domains.length) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!activeDomain) {
        setActiveDomainId(domains[0]?.id ?? null);
        return;
      }

      const currentIndex = domains.findIndex((d) => d.id === activeDomain.id);
      if (currentIndex === -1) return;

      const offset = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex =
        (currentIndex + offset + domains.length) % domains.length;

      setActiveDomainId(domains[nextIndex]?.id ?? activeDomain.id);
      openMenu();
    }
  };

  if (!domains.length) {
    return (
      <Link className="ph-header__link" href="/catalogue">
        {t('catalogue')}
      </Link>
    );
  }

  return (
    <div
      className="ph-header__mega-wrapper"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="ph-header__link ph-header__mega-trigger"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        onFocus={openMenu}
      >
        {t('catalogue')}
        <span aria-hidden>▾</span>
      </button>

      {/* Mega menu */}
      <div
        id={menuId}
        role="menu"
        className={`ph-header__mega-panel ${isOpen ? 'is-open' : ''}`}
        aria-label={t('megaMenuLabel')}
        // Important : on garde le menu ouvert tant qu’on est dedans
        onMouseEnter={openMenu}
        onMouseLeave={closeMenu}
      >
        <div className="ph-header__mega-grid">
          {/* Colonne domaines */}
          <div
            className="ph-header__mega-column"
            aria-label={t('domainsLabel')}
          >
            <ul className="ph-header__mega-domains">
              {domains.map((domain) => (
                <li key={domain.id}>
                  <Link
                    href={{
                      pathname: '/catalogue/[slug]',
                      params: { slug: domain.slug },
                    }}
                    className={`ph-header__mega-domain ${
                      domain.id === activeDomain?.id ? 'is-active' : ''
                    }`}
                    onMouseEnter={() => setActiveDomainId(domain.id)}
                    onFocus={() => {
                      openMenu();
                      setActiveDomainId(domain.id);
                    }}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{domain.label}</span>
                    <span aria-hidden>›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne thèmes */}
          <div
            className="ph-header__mega-column ph-header__mega-tags"
            aria-live="polite"
          >
            <p className="ph-header__mega-title">
              {activeDomain?.label ?? t('themesLabel')}
            </p>
            <div className="ph-header__mega-tag-grid">
              {(activeDomain?.themes ?? []).map((theme) => {
                if (!activeDomain) return null;

                return (
                  <Link
                    key={`${activeDomain.id}-${theme.id}`}
                    href={{
                      pathname: '/catalogue/[slug]/[theme]',
                      params: {
                        slug: activeDomain.slug,
                        theme: theme.slug,
                      },
                    }}
                    className="ph-header__mega-tag"
                    onClick={() => setIsOpen(false)}
                  >
                    {theme.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CatalogueMegaMenu;
