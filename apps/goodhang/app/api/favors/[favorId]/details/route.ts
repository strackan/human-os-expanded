import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

/**
 * GET /api/favors/[favorId]/details
 * Get favor with full negotiation details (proposals, messages)
 */
export async function GET(
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

    // Get favor with details
    const favorService = new FavorService(supabase);
    const favor = await favorService.getFavorWithDetails(favorId, user.id);

    if (!favor) {
      return NextResponse.json({ error: 'Favor not found' }, { status: 404 });
    }

    return NextResponse.json({ favor });
  } catch (error) {
    console.error('Get favor details error:', error);
    return NextResponse.json(
      { error: 'Failed to get favor details' },
      { status: 500 }
    );
  }
}
