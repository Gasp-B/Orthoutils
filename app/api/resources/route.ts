import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { createResourceWithRelations, updateResourceWithRelations } from '@/lib/resources/mutations';
import { getResourcesWithMetadata } from '@/lib/resources/queries';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;

    const resources = await getResourcesWithMetadata(locale);

    return NextResponse.json({ resources }, { status: 200 });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Créer une ressource
export async function POST(request: NextRequest) {
  try {
    // Vérification Auth
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();
    const resource = await createResourceWithRelations(payload);

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PATCH: Mettre à jour une ressource
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await request.json();
    const resource = await updateResourceWithRelations(payload);

    return NextResponse.json({ resource }, { status: 200 });
  } catch (error) {
    console.error('Error updating resource:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}