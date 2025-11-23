import { NextResponse, type NextRequest } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getDb } from '@/lib/db/client';
import { tools, toolsCatalog } from '@/lib/db/schema';
import { createToolSchema, toolsResponseSchema, type ToolStatus } from '@/lib/validation/tools';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';

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
  createdAt: Date | string;
  type: string | null;
  source: string | null;
};

type CommunityRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  tags: string[];
  source: string;
  createdAt: Date | string;
};

function resolveLocale(request: NextRequest): Locale {
  const requestedLocale =
    request.headers.get('x-orthoutil-locale') ?? request.headers.get('accept-language');

  if (!requestedLocale) {
    return defaultLocale;
  }

  const normalizedLocale = requestedLocale.split(',')[0]?.split('-')[0]?.trim();

  if (normalizedLocale && locales.includes(normalizedLocale as Locale)) {
    return normalizedLocale as Locale;
  }

  return defaultLocale;
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

export async function GET() {
  try {
    const [catalogRows, communityRows] = await Promise.all([
      getDb()
        .select({
          id: toolsCatalog.id,
          title: toolsCatalog.title,
          category: toolsCatalog.category,
          colorLabel: toolsCatalog.colorLabel,
          tags: toolsCatalog.tags,
          description: toolsCatalog.description,
          links: toolsCatalog.links,
          notes: toolsCatalog.notes,
          targetPopulation: toolsCatalog.targetPopulation,
          status: toolsCatalog.status,
          createdAt: toolsCatalog.createdAt,
        })
        .from(toolsCatalog),
      getDb()
        .select({
          id: tools.id,
          name: tools.name,
          category: tools.category,
          type: tools.type,
          tags: tools.tags,
          source: tools.source,
          createdAt: tools.createdAt,
        })
        .from(tools),
    ]);

    const payload = toolsResponseSchema.parse({
      tools: [...catalogRows, ...communityRows]
        .map((tool) => {
          const isCommunity = 'name' in tool;

          const createdAt =
            tool.createdAt instanceof Date ? tool.createdAt.toISOString() : tool.createdAt;

          if (isCommunity) {
            const community = tool as CommunityRow;
            return {
              id: community.id,
              title: community.name,
              category: community.category,
              colorLabel: null,
              tags: community.tags ?? [],
              description: null,
              links: [],
              notes: null,
              targetPopulation: 'Tous publics',
              status: 'Communauté' as const,
              createdAt,
              type: community.type,
              source: community.source,
            } satisfies CatalogRow & { type: string; source: string };
          }

          const catalog = tool as CatalogRow;
          return {
            id: catalog.id,
            title: catalog.title,
            category: catalog.category,
            colorLabel: catalog.colorLabel ?? null,
            tags: catalog.tags ?? [],
            description: catalog.description ?? null,
            links: catalog.links ?? [],
            notes: catalog.notes ?? null,
            targetPopulation: catalog.targetPopulation ?? 'Tous publics',
            status: catalog.status,
            createdAt,
            type: null,
            source: catalog.links?.[0]?.url ?? null,
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
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les outils';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const locale = resolveLocale(request);
  const { schema, fallbackError } = await getToolValidationResources(locale);

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
        tags: tools.tags,
        source: tools.source,
        createdAt: tools.createdAt,
      });

    const responseBody = toolsResponseSchema.shape.tools.element.parse({
      id: inserted.id,
      title: inserted.name,
      category: inserted.category,
      colorLabel: null,
      tags: inserted.tags ?? [],
      description: null,
      links: [],
      notes: null,
      targetPopulation: 'Tous publics',
      status: 'Communauté' as const,
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
