import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { defaultLocale, type Locale } from '@/i18n/routing';

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>;

type DomainTranslationRow = { domain_id: string; locale: string; label: string; slug: string };
type ThemeTranslationRow = { theme_id: string; locale: string; label: string };
type ThemeRow = { id: string; slug: string };
type TestDomainRow = { test_id: string; domain_id: string };
type TestThemeRow = { test_id: string; theme_id: string };

export type CatalogueTheme = { id: string; label: string; slug: string };
export type CatalogueDomain = { id: string; label: string; slug: string; themes: CatalogueTheme[] };

export async function getCatalogueTaxonomy(
  locale: Locale = defaultLocale,
  client?: SupabaseClient,
): Promise<CatalogueDomain[]> {
  const supabase = client ?? (await createRouteHandlerSupabaseClient());

  // 1. Récupérer les tests publiés
  const [testsResult] = await Promise.all([
    supabase.from('tests').select('id').eq('status', 'published').returns<{ id: string }[]>(),
  ]);

  if (testsResult.error) throw testsResult.error;

  const publishedTestIds = (testsResult.data ?? []).map((row) => row.id);

  // Si aucun test publié, menu vide
  if (publishedTestIds.length === 0) {
    return [];
  }

  // 2. Récupérer les relations Domaines/Thèmes pour ces tests
  const [testDomainsResult, testThemesResult] = await Promise.all([
    supabase.from('test_domains').select('test_id, domain_id').in('test_id', publishedTestIds),
    supabase.from('test_themes').select('test_id, theme_id').in('test_id', publishedTestIds),
  ]);

  if (testDomainsResult.error) throw testDomainsResult.error;
  if (testThemesResult.error) throw testThemesResult.error;

  const testDomainRows = (testDomainsResult.data ?? []) as TestDomainRow[];
  const testThemeRows = (testThemesResult.data ?? []) as TestThemeRow[];

  const domainIds = Array.from(new Set(testDomainRows.map((row) => row.domain_id)));
  const themeIds = Array.from(new Set(testThemeRows.map((row) => row.theme_id)));

  // Si les tests n'ont pas de domaines, menu vide
  if (domainIds.length === 0) {
    return [];
  }

  // 3. Récupérer les traductions
  const [domainTranslationsResult, themeTranslationsResult, themeSlugsResult] = await Promise.all([
    supabase
      .from('domains_translations')
      .select('domain_id, locale, label, slug')
      .in('domain_id', domainIds)
      .in('locale', [locale, defaultLocale]),
    themeIds.length
      ? supabase
          .from('theme_translations')
          .select('theme_id, locale, label')
          .in('theme_id', themeIds)
          .in('locale', [locale, defaultLocale])
      : Promise.resolve({ data: [], error: null }),
    themeIds.length
      ? supabase.from('themes').select('id, slug').in('id', themeIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (domainTranslationsResult.error) throw domainTranslationsResult.error;
  if (themeTranslationsResult.error) throw themeTranslationsResult.error;
  if (themeSlugsResult.error) throw themeSlugsResult.error;

  // ... (le reste de la logique de mapping reste identique)
  const domainTranslations = (domainTranslationsResult.data ?? []) as DomainTranslationRow[];
  const themeTranslations = (themeTranslationsResult.data ?? []) as ThemeTranslationRow[];
  const themeSlugs = (themeSlugsResult.data ?? []) as ThemeRow[];

  const domainsById = new Map<string, DomainTranslationRow[]>();
  for (const translation of domainTranslations) {
    const existing = domainsById.get(translation.domain_id) ?? [];
    existing.push(translation);
    domainsById.set(translation.domain_id, existing);
  }

  const themesById = new Map<string, ThemeTranslationRow[]>();
  for (const translation of themeTranslations) {
    const existing = themesById.get(translation.theme_id) ?? [];
    existing.push(translation);
    themesById.set(translation.theme_id, existing);
  }

  const themeSlugsById = new Map<string, string>();
  for (const theme of themeSlugs) {
    themeSlugsById.set(theme.id, theme.slug);
  }

  const themesByTest = new Map<string, string[]>();
  for (const relation of testThemeRows) {
    const existing = themesByTest.get(relation.test_id) ?? [];
    existing.push(relation.theme_id);
    themesByTest.set(relation.test_id, existing);
  }

  const themesByDomain = new Map<string, CatalogueTheme[]>();
  for (const relation of testDomainRows) {
    const relatedThemes = themesByTest.get(relation.test_id) ?? [];

    for (const themeId of relatedThemes) {
      const translations = themesById.get(themeId) ?? [];
      const localized = translations.find((row) => row.locale === locale);
      const fallback = translations.find((row) => row.locale === defaultLocale);
      const label = localized?.label ?? fallback?.label;
      const slug = themeSlugsById.get(themeId);

      if (!label || !slug) continue;

      const theme: CatalogueTheme = { id: themeId, label, slug };
      const existing = themesByDomain.get(relation.domain_id) ?? [];

      if (!existing.some((item) => item.id === theme.id)) {
        existing.push(theme);
        themesByDomain.set(relation.domain_id, existing);
      }
    }
  }

  const uniqueDomains = Array.from(new Set(testDomainRows.map((row) => row.domain_id)));
  const domainItems: CatalogueDomain[] = uniqueDomains
    .map((id) => {
      const translations = domainsById.get(id) ?? [];
      const localized = translations.find((row) => row.locale === locale);
      const fallback = translations.find((row) => row.locale === defaultLocale);
      const label = localized?.label ?? fallback?.label;
      const slug = localized?.slug ?? fallback?.slug;

      if (!label || !slug) return null;

      return {
        id,
        label,
        slug,
        themes: (themesByDomain.get(id) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
      };
    })
    .filter((domain): domain is CatalogueDomain => Boolean(domain))
    .sort((a, b) => a.label.localeCompare(b.label));

  return domainItems;
}
