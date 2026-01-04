import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

/**
 * POST /api/favors/[favorId]/accept-proposal
 * Accept the current proposal - both parties agree on terms
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ favorId: string }> }
) {
  try {
    const { favorId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Accept the proposal
    const favorService = new FavorService(supabase);
    const result = await favorService.acceptProposal(favorId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      favor: result.favor,
    });
  } catch (error) {
    console.error('Accept proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to accept proposal' },
      { status: 500 }
    );
  }
}
