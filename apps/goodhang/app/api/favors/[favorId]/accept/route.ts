import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

interface RouteParams {
  params: Promise<{ favorId: string }>;
}

/**
 * POST /api/favors/[favorId]/accept
 * Accept a favor request (recipient only)
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    const favorService = new FavorService(supabase);
    const result = await favorService.acceptFavor(favorId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      favor: result.favor,
    });
  } catch (error) {
    console.error('Error in POST /api/favors/[favorId]/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
