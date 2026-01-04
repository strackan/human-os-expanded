import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FavorTokenService } from '@/lib/services/FavorTokenService';

interface RouteParams {
  params: Promise<{ tokenId: string }>;
}

/**
 * GET /api/favors/tokens/[tokenId]
 * Get token details with history
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { tokenId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenService = new FavorTokenService(supabase);
    const token = await tokenService.getTokenById(tokenId);

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error in GET /api/favors/tokens/[tokenId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
