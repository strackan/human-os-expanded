import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

/**
 * POST /api/favors/request
 * Create a new favor request
 *
 * Body:
 * - token_id: string (required)
 * - recipient_id: string (required)
 * - description: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token_id, recipient_id, description } = body;

    // Validate required fields
    if (!token_id || !recipient_id || !description) {
      return NextResponse.json(
        { error: 'token_id, recipient_id, and description are required' },
        { status: 400 }
      );
    }

    // Cannot request favor from yourself
    if (recipient_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot request a favor from yourself' },
        { status: 400 }
      );
    }

    const favorService = new FavorService(supabase);
    const result = await favorService.requestFavor({
      tokenId: token_id,
      requesterId: user.id,
      recipientId: recipient_id,
      description,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      favor: result.favor,
    });
  } catch (error) {
    console.error('Error in POST /api/favors/request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
