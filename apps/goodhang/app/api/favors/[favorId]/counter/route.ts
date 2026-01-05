import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

/**
 * POST /api/favors/[favorId]/counter
 * Submit a counter-proposal with different terms
 */
export async function POST(
  request: NextRequest,
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

    // Parse request body
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required for counter-proposal' },
        { status: 400 }
      );
    }

    // Submit counter-proposal
    const favorService = new FavorService(supabase);
    const result = await favorService.counterPropose(favorId, user.id, description.trim());

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      favor: result.favor,
    });
  } catch (error) {
    console.error('Counter-proposal error:', error);
    return NextResponse.json(
      { error: 'Failed to submit counter-proposal' },
      { status: 500 }
    );
  }
}
