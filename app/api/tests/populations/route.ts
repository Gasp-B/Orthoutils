import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { populations, populationTranslations } from '@/lib/db/schema';
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

async function ensurePopulationTranslations(locale: Locale) {
  const db = getDb();
  const populationRows = await db.select({ id: populations.id }).from(populations);
  if (populationRows.length === 0) return;

  const localeRows = await db
    .select({ populationId: populationTranslations.populationId })
    .from(populationTranslations)
    .where(eq(populationTranslations.locale, locale));
  const existing = new Set(localeRows.map((row) => row.populationId));

  const missingIds = populationRows
    .map((row) => row.id)
    .filter((id) => !existing.has(id));

  if (missingIds.length === 0) return;

  const fallbackRows = await db
    .select({
      populationId: populationTranslations.populationId,
      label: populationTranslations.label,
    })
    .from(populationTranslations)
    .where(
      and(
        inArray(populationTranslations.populationId, missingIds),
        eq(populationTranslations.locale, defaultLocale),
      ),
    );

  const labelByPopulation = new Map(
    fallbackRows.map((row) => [row.populationId, row.label]),
  );

  const insertValues = missingIds
    .map((id) => {
      const label = labelByPopulation.get(id);
      if (!label) return null;
      return {
        populationId: id,
        locale,
        label,
        populationCharacteristic: [],
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  if (insertValues.length > 0) {
    await db.insert(populationTranslations).values(insertValues);
  }
}

async function loadCharacteristics(locale: Locale) {
  const db = getDb();
  const rows = await db
    .select({
      locale: populationTranslations.locale,
      characteristics: populationTranslations.populationCharacteristic,
    })
    .from(populationTranslations)
    .where(inArray(populationTranslations.locale, [locale, defaultLocale]));

  const localeRows = rows.filter((row) => row.locale === locale);
  const fallbackRows = rows.filter((row) => row.locale === defaultLocale);
  const sourceRows = localeRows.length > 0 ? localeRows : fallbackRows;

  const characteristics = Array.from(
    new Set(sourceRows.flatMap((row) => row.characteristics ?? [])),
  ).sort((a, b) => a.localeCompare(b));

  return characteristics;
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

    const characteristics = await loadCharacteristics(locale);

    const payload = populationCharacteristicsResponseSchema.parse({
      characteristics,
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

    await ensurePopulationTranslations(locale);
    const current = await loadCharacteristics(locale);
    const characteristics = Array.from(new Set([...current, normalized])).sort((a, b) => a.localeCompare(b));

    await getDb()
      .update(populationTranslations)
      .set({ populationCharacteristic: characteristics })
      .where(eq(populationTranslations.locale, locale));

    return NextResponse.json({ characteristics }, { status: 201 });
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

    await ensurePopulationTranslations(locale);
    const current = await loadCharacteristics(locale);

    if (!current.includes(previousValue)) {
      return NextResponse.json({ error: 'Caractéristique introuvable.' }, { status: 404 });
    }

    const updated = Array.from(
      new Set(current.map((value) => (value === previousValue ? normalized : value))),
    ).sort((a, b) => a.localeCompare(b));

    await getDb()
      .update(populationTranslations)
      .set({ populationCharacteristic: updated })
      .where(eq(populationTranslations.locale, locale));

    return NextResponse.json({ characteristics: updated }, { status: 200 });
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

    await ensurePopulationTranslations(locale);
    const current = await loadCharacteristics(locale);
    if (!current.includes(normalized)) {
      return NextResponse.json({ error: 'Caractéristique introuvable.' }, { status: 404 });
    }

    const characteristics = current.filter((value) => value !== normalized);

    await getDb()
      .update(populationTranslations)
      .set({ populationCharacteristic: characteristics })
      .where(eq(populationTranslations.locale, locale));

    return NextResponse.json({ characteristics }, { status: 200 });
  } catch (error) {
    console.error('Delete population characteristic error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
