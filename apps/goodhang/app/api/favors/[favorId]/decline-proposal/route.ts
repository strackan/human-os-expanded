import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

/**
 * POST /api/favors/[favorId]/decline-proposal
 * Decline the current proposal - ends the negotiation
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

    // Decline the proposal
    const favorService = new FavorService(supabase);
    const result = await favorService.declineProposal(favorId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      favor: result.favor,
    });
  } catch (error) {
    console.error('Decline proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to decline proposal' },
      { status: 500 }
    );
  }
}
