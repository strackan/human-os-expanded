import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/invites/send-magic-link
 * Sends a magic link to the user's email for verification
 * After clicking the link, user will be authenticated and can set their password
 * Public endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { invite_code, email, name } = await request.json();

    if (!invite_code || !email || !name) {
      return NextResponse.json(
        { error: 'Invite code, email, and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify invite exists
    const { data: invite, error: inviteError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Update invite with latest email/name in case they edited it
    await supabase
      .from('pending_invites')
      .update({ email, name })
      .eq('id', invite.id);

    // Send magic link using Supabase OTP
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        data: {
          invite_code,
          name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'}/auth/callback?next=/auth/set-password`,
      },
    });

    if (magicLinkError) {
      console.error('Error sending magic link:', magicLinkError);
      return NextResponse.json(
        { error: 'Failed to send magic link', details: magicLinkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  } catch (error: unknown) {
    console.error('Send magic link error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
