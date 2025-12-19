import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { tests, testsTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'fr';

  try {
    const results = await db
      .select({
        id: tests.id,
        name: testsTranslations.name,
        slug: testsTranslations.slug,
        publisher: testsTranslations.publisher,
      })
      .from(tests)
      .innerJoin(testsTranslations, eq(tests.id, testsTranslations.testId))
      .where(
        and(
          eq(testsTranslations.locale, locale),
          eq(tests.status, 'published')
        )
      );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch catalogue" }, { status: 500 });
  }
}
