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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
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
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
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
        onFocus={() => setIsOpen(true)}
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
      >
        <div className="ph-header__mega-grid">
          {/* Colonne domaines */}
          <div className="ph-header__mega-column" aria-label={t('domainsLabel')}>
            <ul className="ph-header__mega-domains">
              {domains.map((domain) => (
                <li key={domain.id}>
                  <Link
                    href={`/catalogue/${domain.slug}`}
                    className={`ph-header__mega-domain ${
                      domain.id === activeDomain?.id ? 'is-active' : ''
                    }`}
                    onMouseEnter={() => setActiveDomainId(domain.id)}
                    onFocus={() => {
                      setIsOpen(true);
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

          {/* Colonne tags */}
          <div className="ph-header__mega-column ph-header__mega-tags" aria-live="polite">
            <p className="ph-header__mega-title">
              {activeDomain?.label ?? t('tagsLabel')}
            </p>
            <div className="ph-header__mega-tag-grid">
              {(activeDomain?.tags ?? []).map((tag) => (
                <Link
                  key={`${activeDomain?.id ?? 'domain'}-${tag.id}`}
                  href={`/catalogue/${activeDomain?.slug}/${tag.slug}`}
                  className="ph-header__mega-tag"
                  onClick={() => setIsOpen(false)}
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CatalogueMegaMenu;
