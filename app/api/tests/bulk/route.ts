import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient, createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import {
  archiveTests,
  bulkAddTagsToTests,
  bulkRemoveTagsFromTests,
  bulkUpdateTestsStatus,
} from '@/lib/tests/mutations';
import { bulkTestsActionSchema } from '@/lib/validation/tests';

const PATIENT_ASSESSMENT_TESTS_TABLE = 'patient_assessments_tests';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = bulkTestsActionSchema.parse(await request.json());

    if (payload.action === 'status') {
      const result = await bulkUpdateTestsStatus(payload);
      return NextResponse.json({ updated: result.ids, status: result.status }, { status: 200 });
    }

    if (payload.action === 'tags:add') {
      const result = await bulkAddTagsToTests(payload);
      return NextResponse.json({ updated: result.ids }, { status: 200 });
    }

    if (payload.action === 'tags:remove') {
      const result = await bulkRemoveTagsFromTests(payload);
      return NextResponse.json({ updated: result.ids }, { status: 200 });
    }

    if (payload.action === 'archive') {
      const result = await archiveTests(payload);
      return NextResponse.json({ archived: result.ids }, { status: 200 });
    }

    const adminClient = createSupabaseAdminClient();
    const { data: usageRows, error: usageError } = await adminClient
      .from(PATIENT_ASSESSMENT_TESTS_TABLE)
      .select('test_id')
      .in('test_id', payload.ids)
      .returns<{ test_id: string }[]>();

    if (usageError) {
      throw usageError;
    }

    const usedTestIds = new Set((usageRows ?? []).map((row) => row.test_id));
    const idsToArchive = payload.ids.filter((id) => usedTestIds.has(id));
    const idsToDelete = payload.ids.filter((id) => !usedTestIds.has(id));

    if (idsToArchive.length > 0) {
      await archiveTests({ ids: idsToArchive });
    }

    if (idsToDelete.length > 0) {
      const { error } = await adminClient.from('tests').delete().in('id', idsToDelete);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json(
      { archived: idsToArchive, deleted: idsToDelete },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to run bulk tests operation', error);
    const message = error instanceof Error ? error.message : 'Impossible de traiter la demande';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
