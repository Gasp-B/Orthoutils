import { NextResponse, type NextRequest } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { tools, toolsTranslations } from '@/lib/db/schema';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { createToolSchema, toolsResponseSchema, type ToolStatus } from '@/lib/validation/tools';

type CatalogRow = {
  id: string;
  title: string;
  category: string;
  colorLabel: string | null;
  tags: string[];
  description: string | null;
  links: Array<{ label: string; url: string }>;
  notes: string | null;
  targetPopulation: string | null;
  status: ToolStatus;
  statusLabel?: string;
  createdAt: Date | string;
  type: string | null;
  source: string | null;
};

function normalizeLocale(rawLocale: string | null): Locale | null {
  if (!rawLocale) {
    return null;
  }

  const normalized = rawLocale.split(',')[0]?.split('-')[0]?.trim();

  if (normalized && locales.includes(normalized as Locale)) {
    return normalized as Locale;
  }

  return null;
}

function resolveLocale(request: NextRequest): Locale {
  const localeFromQuery = normalizeLocale(request.nextUrl.searchParams.get('locale'));
  if (localeFromQuery) {
    return localeFromQuery;
  }

  const requestedLocale =
    request.headers.get('x-orthoutil-locale') ?? request.headers.get('accept-language');
  const localeFromHeader = normalizeLocale(requestedLocale);

  return localeFromHeader ?? defaultLocale;
}

async function getToolValidationResources(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'ToolForm' });

  const schema = createToolSchema({
    nameRequired: t('validation.name.required'),
    categoryRequired: t('validation.category.required'),
    typeRequired: t('validation.type.required'),
    tagsRequired: t('validation.tags.required'),
    sourceUrl: t('validation.source.url'),
  });

  return { schema, fallbackError: t('validation.fallback') };
}

function resolveStatusKey(value: string | null): ToolStatus {
  const normalized = value?.toLowerCase().trim();

  if (normalized === 'draft' || normalized === 'published' || normalized === 'archived') {
    return normalized as ToolStatus;
  }

  if (normalized === 'validé' || normalized === 'validated') {
    return 'published';
  }

  if (
    normalized === 'en cours de revue' ||
    normalized === 'under review' ||
    normalized === 'community' ||
    normalized === 'communauté' ||
    normalized === 'review'
  ) {
    return 'draft';
  }

  return 'draft';
}

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request);
  const toolCardTranslations = await getTranslations({ locale, namespace: 'ToolCard' });
  const apiTranslations = await getTranslations({ locale, namespace: 'ApiTools' });

  type ToolCatalogRow = {
    id: string;
    title: string;
    category: string;
    color_label: string | null;
    tags: string[] | null;
    description: string | null;
    links: Array<{ label: string; url: string }> | null;
    notes: string | null;
    target_population: string | null;
    status: string | null;
    created_at: string | null;
  };

  type ToolCatalogTranslationRow = {
    tool_catalog_id: string;
    locale: string;
    title: string;
    category: string;
    description: string | null;
    notes: string | null;
    target_population: string | null;
  };

  type ToolRow = {
    id: string;
    name: string;
    category: string;
    type: string | null;
    status: string | null;
    tags: string[] | null;
    source: string | null;
    created_at: string | null;
  };

  type ToolTranslationRow = {
    tool_id: string;
    locale: string;
    name: string;
    category: string;
    type: string;
  };

  const selectTranslation = <T extends { locale: string }>(
    rows: T[],
    currentLocale: Locale,
  ): T | undefined => {
    const localized = rows.find((row) => row.locale === currentLocale);

    if (localized) {
      return localized;
    }

    return rows.find((row) => row.locale === defaultLocale);
  };

  const normalizeLinks = (value: unknown): Array<{ label: string; url: string }> => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (link): link is { label: string; url: string } =>
        typeof link === 'object' &&
        !!link &&
        'label' in link &&
        'url' in link &&
        typeof (link as { label?: unknown }).label === 'string' &&
        typeof (link as { url?: unknown }).url === 'string',
    );
  };

  const supabase = createRouteHandlerSupabaseClient();

  try {
    const [catalogResult, communityResult] = await Promise.all([
      supabase
        .from('tools_catalog')
        .select(
          'id, title, category, color_label, tags, description, links, notes, target_population, status, created_at',
        )
        .eq('status', 'published'),
      supabase
        .from('tools')
        .select('id, name, category, type, status, tags, source, created_at')
        .eq('status', 'published'),
    ]);

    if (catalogResult.error) {
      throw catalogResult.error;
    }

    if (communityResult.error) {
      throw communityResult.error;
    }

    const catalogRows = (catalogResult.data ?? []) as ToolCatalogRow[];
    const communityRows = (communityResult.data ?? []) as ToolRow[];

    const catalogIds = catalogRows.map((row) => row.id);
    const toolIds = communityRows.map((row) => row.id);

    const [catalogTranslationsResult, toolTranslationsResult] = await Promise.all([
      catalogIds.length > 0
        ? supabase
            .from('tools_catalog_translations')
            .select('tool_catalog_id, locale, title, category, description, notes, target_population')
            .in('tool_catalog_id', catalogIds)
            .in('locale', [locale, defaultLocale])
        : { data: [], error: null },
      toolIds.length > 0
        ? supabase
            .from('tools_translations')
            .select('tool_id, locale, name, category, type')
            .in('tool_id', toolIds)
            .in('locale', [locale, defaultLocale])
        : { data: [], error: null },
    ]);

    if (catalogTranslationsResult.error) {
      throw catalogTranslationsResult.error;
    }

    if (toolTranslationsResult.error) {
      throw toolTranslationsResult.error;
    }

    const catalogTranslations = (catalogTranslationsResult.data ?? []) as ToolCatalogTranslationRow[];
    const toolTranslations = (toolTranslationsResult.data ?? []) as ToolTranslationRow[];

    const catalogTranslationsById = new Map<string, ToolCatalogTranslationRow[]>();
    for (const translation of catalogTranslations) {
      const existing = catalogTranslationsById.get(translation.tool_catalog_id) ?? [];
      existing.push(translation);
      catalogTranslationsById.set(translation.tool_catalog_id, existing);
    }

    const toolTranslationsById = new Map<string, ToolTranslationRow[]>();
    for (const translation of toolTranslations) {
      const existing = toolTranslationsById.get(translation.tool_id) ?? [];
      existing.push(translation);
      toolTranslationsById.set(translation.tool_id, existing);
    }

    const payload = toolsResponseSchema.parse({
      tools: [...catalogRows, ...communityRows]
        .map((tool) => {
          const createdAt = tool.created_at ?? new Date().toISOString();

          if ('name' in tool) {
            const community = tool as ToolRow;
            const translations = toolTranslationsById.get(community.id) ?? [];
            const translation = selectTranslation(translations, locale);
            const status = resolveStatusKey(community.status);

            return {
              id: community.id,
              title: translation?.name ?? community.name,
              category: translation?.category ?? community.category,
              colorLabel: null,
              tags: Array.isArray(community.tags) ? community.tags : [],
              description: null,
              links: [],
              notes: null,
              targetPopulation: toolCardTranslations('fallback.population'),
              status,
              statusLabel: toolCardTranslations(`status.${status}`),
              createdAt,
              type: translation?.type ?? community.type ?? null,
              source: community.source ?? null,
            } satisfies CatalogRow & { type: string | null; source: string | null };
          }

          const catalog = tool as ToolCatalogRow;
          const translations = catalogTranslationsById.get(catalog.id) ?? [];
          const translation = selectTranslation(translations, locale);
          const hasTargetPopulation = Boolean(
            (translation?.target_population ?? catalog.target_population)?.length,
          );
          const status = resolveStatusKey(catalog.status);

          return {
            id: catalog.id,
            title: translation?.title ?? catalog.title,
            category: translation?.category ?? catalog.category,
            colorLabel: catalog.color_label ?? null,
            tags: Array.isArray(catalog.tags) ? catalog.tags : [],
            description: translation?.description ?? catalog.description ?? null,
            links: normalizeLinks(catalog.links),
            notes: translation?.notes ?? catalog.notes ?? null,
            targetPopulation: hasTargetPopulation
              ? translation?.target_population ?? catalog.target_population
              : toolCardTranslations('fallback.population'),
            status,
            statusLabel: toolCardTranslations(`status.${status}`),
            createdAt,
            type: null,
            source: normalizeLinks(catalog.links)[0]?.url ?? null,
          } satisfies CatalogRow;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch tools from Supabase', error);
    const fallbackMessage = apiTranslations('errors.fetch');
    return NextResponse.json({ error: fallbackMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const locale = resolveLocale(request);
  const { schema, fallbackError } = await getToolValidationResources(locale);
  const toolCardTranslations = await getTranslations({ locale, namespace: 'ToolCard' });

  try {
    const json = await request.json();
    const payload = schema.parse(json);

    const [inserted] = await getDb()
      .insert(tools)
      .values({
        name: payload.name,
        category: payload.category,
        type: payload.type,
        tags: payload.tags,
        source: payload.source,
      })
      .returning({
        id: tools.id,
        name: tools.name,
        category: tools.category,
        type: tools.type,
        status: tools.status,
        tags: tools.tags,
        source: tools.source,
        createdAt: tools.createdAt,
      });

    if (!inserted) {
      throw new Error(fallbackError);
    }

    await getDb()
      .insert(toolsTranslations)
      .values([
        {
          toolId: inserted.id,
          locale,
          name: payload.name,
          category: payload.category,
          type: payload.type,
        },
        ...(locale === defaultLocale
          ? []
          : [
              {
                toolId: inserted.id,
                locale: defaultLocale,
                name: payload.name,
                category: payload.category,
                type: payload.type,
              },
            ]),
      ])
      .onConflictDoUpdate({
        target: [toolsTranslations.toolId, toolsTranslations.locale],
        set: {
          name: payload.name,
          category: payload.category,
          type: payload.type,
        },
      });

    const status = resolveStatusKey(inserted.status);

    const responseBody = toolsResponseSchema.shape.tools.element.parse({
      id: inserted.id,
      title: inserted.name,
      category: inserted.category,
      colorLabel: null,
      tags: inserted.tags ?? [],
      description: null,
      links: [],
      notes: null,
      targetPopulation: toolCardTranslations('fallback.population'),
      status,
      statusLabel: toolCardTranslations(`status.${status}`),
      createdAt:
        inserted.createdAt instanceof Date
          ? inserted.createdAt.toISOString()
          : inserted.createdAt ?? new Date().toISOString(),
      type: inserted.type,
      source: inserted.source,
    });

    return NextResponse.json({ tool: responseBody }, { status: 201 });
  } catch (error) {
    console.error('Failed to create tool', error);
    const message = error instanceof Error && error.message ? error.message : fallbackError;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
