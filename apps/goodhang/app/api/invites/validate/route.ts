import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/invites/validate
 * Validates an invite code and returns contact information
 * Public endpoint (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    const { invite_code } = await request.json();

    if (!invite_code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Look up pending invite by invite code
    const { data: invite, error } = await supabase
      .from('pending_invites')
      .select('id, name, email, used_at')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Note: We don't check used_at here because the signup endpoint
    // will allow the same email to reuse their invite if signup failed previously

    return NextResponse.json({
      valid: true,
      contact: {
        id: invite.id,
        name: invite.name,
        email: invite.email,
      },
    });
  } catch (error: unknown) {
    console.error('Validate invite error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
