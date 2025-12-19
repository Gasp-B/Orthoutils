'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import CatalogueMegaMenu from '@/components/CatalogueMegaMenu';
import type { CatalogueDomain } from '@/lib/navigation/catalogue';

function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  
  const [catalogueDomains, setCatalogueDomains] = useState<CatalogueDomain[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // 1. Gestion de l'authentification
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    };

    void checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 1b. Chargement du rôle admin une fois l'utilisateur disponible
  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError) {
        console.error('[Header] Failed to load user role:', roleError);
        if (!cancelled) setIsAdmin(false);
        return;
      }

      if (!cancelled) setIsAdmin(data?.role === 'admin');
    };

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  // 2. Chargement du catalogue
  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const res = await fetch(`/api/catalogue?locale=${locale}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        // Typage explicite de la réponse API
        const data = (await res.json()) as { domains: CatalogueDomain[] };

        if (!cancelled) {
          setCatalogueDomains(Array.isArray(data.domains) ? data.domains : []);
        }
      } catch (err) {
        console.error('[Header] Failed to load catalogue:', err);
        if (!cancelled) setError(t('navError'));
      } finally {
        if (!cancelled) setLoadingCatalogue(false);
      }
    }

    void loadCatalogue();
    return () => { cancelled = true; };
  }, [locale, t]);

  const switchLocale = (nextLocale: 'fr' | 'en') => {
    if (nextLocale === locale) return;
    startTransition(() => {
      // @ts-expect-error -- pathname est valide mais le typage strict de next-intl peut nécessiter un cast complexe ici
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <header className="ph-header" role="banner">
      <div className="ph-header__bar container">
        {/* Logo */}
        <Link className="ph-header__brand" href="/" aria-label={t('brandAria')}>
          <div className="ph-header__logo" aria-hidden>OT</div>
          <div>
            <p className="ph-header__name">{t('brandName')}</p>
            <p className="ph-header__tagline">{t('tagline')}</p>
          </div>
        </Link>

        {/* Barre de recherche */}
        <form className="ph-header__search" role="search" action={`/${locale}/search`} method="get">
          <input
            type="search"
            name="q"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
          />
          <input type="hidden" name="page" value="1" />
          <button className="ph-header__search-button" type="submit">
            {t('searchSubmit')}
          </button>
        </form>

        {/* Navigation Droite */}
        <nav className="ph-header__nav" aria-label={t('navAria')}>
          
          {loadingCatalogue && (
            <span className="ph-header__link ph-header__link--muted">{t('navLoading')}</span>
          )}
          {!loadingCatalogue && !error && <CatalogueMegaMenu domains={catalogueDomains} />}
          

          {isAdmin && (
            <div className="ph-header__menu">
              <button className="ph-header__link ph-header__menu-toggle" type="button">
                {t('admin')} <span aria-hidden>▾</span>
              </button>
              <div className="ph-header__submenu" aria-label={t('adminMenuLabel')}>
                <Link className="ph-header__submenu-link" href="/administration">{t('dashboard')}</Link>
                <Link className="ph-header__submenu-link" href="/tests/manage">{t('addTest')}</Link>
                <Link className="ph-header__submenu-link" href="/administration/TaxonomyManagement">{t('taxonomy')}</Link>
                <Link className="ph-header__submenu-link" href="/administration/resources">{t('resources')}</Link>
              </div>
            </div>
          )}

          <div className="u-separator-vertical" />

          {/* --- Zone Utilisateur / Connexion --- */}
          {!loadingAuth && (
            <>
              {user ? (
                <div className="ph-header__menu">
                  <Link 
                    href="/administration" 
                    className="ph-header__link ph-header__menu-toggle ph-header__menu-trigger--avatar"
                    aria-label={t('profileAria')}
                  >
                    <div className="user-avatar">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </Link>

                  <div className="ph-header__submenu" aria-label={t('profileAria')}>
                    <div className="px-3 py-2 text-sm text-slate-500 border-b border-slate-100 mb-1">
                      {user.email}
                    </div>
                    
                    <Link className="ph-header__submenu-link" href="/administration">
                      {t('dashboard')}
                    </Link>
                    
                    <Link className="ph-header__submenu-link" href="/account">
                      {t('account')}
                    </Link>
                    
                    <button 
                      type="button" 
                      className="ph-header__submenu-link" 
                      onClick={() => void handleLogout()}
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="login-btn">
                  {t('login')}
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Sélecteur de langue */}
        <div className="ph-header__locale-switcher" role="group" aria-label={t('localeSwitcher.ariaLabel')}>
          <div className="ph-header__locale-options">
            <button
              type="button"
              className="ph-header__locale-button"
              aria-pressed={locale === 'fr'}
              disabled={isNavigating || locale === 'fr'}
              onClick={() => switchLocale('fr')}
            >
              FR
            </button>
            <span className="u-opacity-30">|</span>
            <button
              type="button"
              className="ph-header__locale-button"
              aria-pressed={locale === 'en'}
              disabled={isNavigating || locale === 'en'}
              onClick={() => switchLocale('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
