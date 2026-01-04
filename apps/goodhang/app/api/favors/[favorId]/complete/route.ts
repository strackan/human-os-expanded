import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

interface RouteParams {
  params: Promise<{ favorId: string }>;
}

/**
 * POST /api/favors/[favorId]/complete
 * Mark a favor as complete (recipient only)
 *
 * Body:
 * - completion_note?: string (optional note about what was done)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { favorId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { completion_note } = body;

    const favorService = new FavorService(supabase);
    const result = await favorService.markComplete(favorId, user.id, completion_note);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      favor: result.favor,
    });
  } catch (error) {
    console.error('Error in POST /api/favors/[favorId]/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
