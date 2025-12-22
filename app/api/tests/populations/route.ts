import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { createRouteHandlerSupabaseClient, supabaseAdmin } from '@/lib/supabaseClient';
import { populationTranslations } from '@/lib/db/schema';
import {
  populationCharacteristicCreateSchema,
  populationCharacteristicDeleteSchema,
  populationCharacteristicUpdateSchema,
  populationCharacteristicsResponseSchema,
} from '@/lib/validation/population';

function normalizeCharacteristic(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Caractéristique invalide.');
  }
  return normalized;
}

async function getPopulationTranslation(
  populationId: string,
  locale: Locale,
) {
  const db = getDb();
  const [row] = await db
    .select({
      id: populationTranslations.id,
      label: populationTranslations.label,
      populationCharacteristic: populationTranslations.populationCharacteristic,
    })
    .from(populationTranslations)
    .where(and(eq(populationTranslations.populationId, populationId), eq(populationTranslations.locale, locale)))
    .limit(1);

  return row ?? null;
}

async function ensurePopulationTranslation(
  populationId: string,
  locale: Locale,
) {
  const db = getDb();
  const existing = await getPopulationTranslation(populationId, locale);
  if (existing) return existing;

  const [fallback] = await db
    .select({
      label: populationTranslations.label,
    })
    .from(populationTranslations)
    .where(
      and(
        eq(populationTranslations.populationId, populationId),
        eq(populationTranslations.locale, defaultLocale),
      ),
    )
    .limit(1);

  if (!fallback) return null;

  const [created] = await db
    .insert(populationTranslations)
    .values({
      populationId,
      locale,
      label: fallback.label,
      populationCharacteristic: [],
    })
    .returning({
      id: populationTranslations.id,
      label: populationTranslations.label,
      populationCharacteristic: populationTranslations.populationCharacteristic,
    });

  return created ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;

    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataClient = supabaseAdmin ?? supabase;

    const [populationRowsResult, translationRowsResult] = await Promise.all([
      dataClient.from('population').select('id'),
      dataClient
        .from('population_translations')
        .select('population_id, locale, label, population_characteristic')
        .in('locale', [locale, defaultLocale]),
    ]);

    if (populationRowsResult.error) throw populationRowsResult.error;
    if (translationRowsResult.error) throw translationRowsResult.error;

    const populationsRows = (populationRowsResult.data ?? []) as Array<{ id: string }>;
    const translationRows = (translationRowsResult.data ?? []) as Array<{
      population_id: string;
      locale: string;
      label: string;
      population_characteristic: string[] | null;
    }>;

    const translationsById = new Map<string, Array<{ locale: string; label: string; characteristics: string[] }>>();
    for (const row of translationRows) {
      const list = translationsById.get(row.population_id) ?? [];
      list.push({
        locale: row.locale,
        label: row.label,
        characteristics: row.population_characteristic ?? [],
      });
      translationsById.set(row.population_id, list);
    }

    const resolved = populationsRows
      .map((population) => {
        const list = translationsById.get(population.id) ?? [];
        const translation =
          list.find((item) => item.locale === locale) ??
          list.find((item) => item.locale === defaultLocale);

        return translation
          ? {
              id: population.id,
              label: translation.label,
              characteristics: translation.characteristics,
            }
          : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => a.label.localeCompare(b.label));

    const payload = populationCharacteristicsResponseSchema.parse({
      populations: resolved,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch populations', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = populationCharacteristicCreateSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    const normalized = normalizeCharacteristic(payload.value);

    const translation = await ensurePopulationTranslation(payload.populationId, locale);

    if (!translation) {
      return NextResponse.json({ error: 'Population introuvable.' }, { status: 404 });
    }

    const characteristics = Array.from(
      new Set([...(translation.populationCharacteristic ?? []), normalized]),
    );

    await getDb()
      .update(populationTranslations)
      .set({ populationCharacteristic: characteristics })
      .where(eq(populationTranslations.id, translation.id));

    return NextResponse.json({
      populationId: payload.populationId,
      characteristics,
    }, { status: 201 });
  } catch (error) {
    console.error('Create population characteristic error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = populationCharacteristicUpdateSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    const previousValue = normalizeCharacteristic(payload.previousValue);
    const normalized = normalizeCharacteristic(payload.value);

    const translation = await getPopulationTranslation(payload.populationId, locale);
    if (!translation) {
      return NextResponse.json({ error: 'Population introuvable.' }, { status: 404 });
    }

    const characteristics = translation.populationCharacteristic ?? [];
    if (!characteristics.includes(previousValue)) {
      return NextResponse.json({ error: 'Caractéristique introuvable.' }, { status: 404 });
    }

    const updated = Array.from(
      new Set(characteristics.map((value) => (value === previousValue ? normalized : value))),
    );

    await getDb()
      .update(populationTranslations)
      .set({ populationCharacteristic: updated })
      .where(eq(populationTranslations.id, translation.id));

    return NextResponse.json({
      populationId: payload.populationId,
      characteristics: updated,
    }, { status: 200 });
  } catch (error) {
    console.error('Update population characteristic error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = populationCharacteristicDeleteSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    const normalized = normalizeCharacteristic(payload.value);

    const translation = await getPopulationTranslation(payload.populationId, locale);
    if (!translation) {
      return NextResponse.json({ error: 'Population introuvable.' }, { status: 404 });
    }

    const characteristics = (translation.populationCharacteristic ?? []).filter(
      (value) => value !== normalized,
    );

    await getDb()
      .update(populationTranslations)
      .set({ populationCharacteristic: characteristics })
      .where(eq(populationTranslations.id, translation.id));

    return NextResponse.json({
      populationId: payload.populationId,
      characteristics,
    }, { status: 200 });
  } catch (error) {
    console.error('Delete population characteristic error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
