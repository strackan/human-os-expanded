import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorTokenService } from '@/lib/services/FavorTokenService';

/**
 * GET /api/favors/tokens/collection
 * Get current user's earned token collection (tokens received from favors)
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

    const tokenService = new FavorTokenService(supabase);
    const tokens = await tokenService.getCollection(user.id);

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error('Error in GET /api/favors/tokens/collection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
