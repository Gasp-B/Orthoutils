import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { clinicalProfileTranslations, clinicalProfiles } from '@/lib/db/schema';
import {
  clinicalProfileCreateSchema,
  clinicalProfileDeleteSchema,
  clinicalProfileUpdateSchema,
  clinicalProfilesResponseSchema,
} from '@/lib/validation/clinical-profiles';

function normalizeProfile(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Profil clinique invalide.');
  }
  return normalized;
}

async function loadClinicalProfiles(locale: Locale) {
  const rows = await getDb()
    .select({
      locale: clinicalProfileTranslations.locale,
      label: clinicalProfileTranslations.label,
    })
    .from(clinicalProfileTranslations)
    .where(inArray(clinicalProfileTranslations.locale, [locale, defaultLocale]));

  const localeRows = rows.filter((row) => row.locale === locale);
  const fallbackRows = rows.filter((row) => row.locale === defaultLocale);
  const sourceRows = localeRows.length > 0 ? localeRows : fallbackRows;

  return Array.from(new Set(sourceRows.map((row) => row.label))).sort((a, b) => a.localeCompare(b));
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

    const profiles = await loadClinicalProfiles(locale);

    const payload = clinicalProfilesResponseSchema.parse({
      profiles,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch clinical profiles', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = clinicalProfileCreateSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    const normalized = normalizeProfile(payload.value);

    const existing = await getDb()
      .select({ id: clinicalProfileTranslations.id })
      .from(clinicalProfileTranslations)
      .where(
        and(
          eq(clinicalProfileTranslations.locale, locale),
          eq(clinicalProfileTranslations.label, normalized),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Profil clinique déjà existant.' }, { status: 409 });
    }

    const [profile] = await getDb()
      .insert(clinicalProfiles)
      .values({})
      .returning({ id: clinicalProfiles.id });

    await getDb()
      .insert(clinicalProfileTranslations)
      .values({
        clinicalProfileId: profile.id,
        locale,
        label: normalized,
      });

    const profiles = await loadClinicalProfiles(locale);
    return NextResponse.json({ profiles }, { status: 201 });
  } catch (error) {
    console.error('Create clinical profile error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = clinicalProfileUpdateSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    const previousValue = normalizeProfile(payload.previousValue);
    const normalized = normalizeProfile(payload.value);

    const updated = await getDb()
      .update(clinicalProfileTranslations)
      .set({ label: normalized })
      .where(
        and(
          eq(clinicalProfileTranslations.locale, locale),
          eq(clinicalProfileTranslations.label, previousValue),
        ),
      )
      .returning({ id: clinicalProfileTranslations.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Profil clinique introuvable.' }, { status: 404 });
    }

    const profiles = await loadClinicalProfiles(locale);
    return NextResponse.json({ profiles }, { status: 200 });
  } catch (error) {
    console.error('Update clinical profile error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = clinicalProfileDeleteSchema.parse(await request.json());
    const locale = payload.locale ?? defaultLocale;
    const normalized = normalizeProfile(payload.value);

    const removed = await getDb()
      .delete(clinicalProfileTranslations)
      .where(
        and(
          eq(clinicalProfileTranslations.locale, locale),
          eq(clinicalProfileTranslations.label, normalized),
        ),
      )
      .returning({ clinicalProfileId: clinicalProfileTranslations.clinicalProfileId });

    if (removed.length === 0) {
      return NextResponse.json({ error: 'Profil clinique introuvable.' }, { status: 404 });
    }

    const removedIds = removed.map((row) => row.clinicalProfileId);
    const orphaned = await getDb()
      .select({ id: clinicalProfiles.id })
      .from(clinicalProfiles)
      .leftJoin(
        clinicalProfileTranslations,
        eq(clinicalProfileTranslations.clinicalProfileId, clinicalProfiles.id),
      )
      .where(and(inArray(clinicalProfiles.id, removedIds), isNull(clinicalProfileTranslations.id)));

    if (orphaned.length > 0) {
      await getDb()
        .delete(clinicalProfiles)
        .where(inArray(clinicalProfiles.id, orphaned.map((row) => row.id)));
    }

    const profiles = await loadClinicalProfiles(locale);
    return NextResponse.json({ profiles }, { status: 200 });
  } catch (error) {
    console.error('Delete clinical profile error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
