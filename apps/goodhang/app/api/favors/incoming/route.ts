import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorService } from '@/lib/services/FavorService';

/**
 * GET /api/favors/incoming
 * Get incoming favor requests for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorService = new FavorService(supabase);
    const favors = await favorService.getIncomingFavors(user.id);

    return NextResponse.json({
      success: true,
      favors,
    });
  } catch (error) {
    console.error('Error in GET /api/favors/incoming:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
