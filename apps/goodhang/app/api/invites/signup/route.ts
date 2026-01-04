import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/invites/signup
 * Creates a new member account with an invite code
 * - Creates auth user
 * - Creates member profile
 * - Marks pending invite as used
 * Public endpoint (no authentication required)
 */
export async function POST(request: NextRequest) {
  try {
    const { invite_code, email, password, name } = await request.json();

    if (!invite_code || !email || !password || !name) {
      return NextResponse.json(
        { error: 'Invite code, email, password, and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify invite code exists
    const { data: invite, error: inviteError } = await supabase
      .from('pending_invites')
      .select('id, name, email, invite_code, used_at, user_id')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      );
    }

    // If invite was used, only allow the same email to use it again
    // This handles cases where signup failed and user needs to retry
    if (invite.used_at && invite.email !== email) {
      return NextResponse.json(
        { error: 'This invite code has already been used by another user' },
        { status: 400 }
      );
    }

    // If invite already has a user_id, account was already created
    // Tell them to log in instead
    if (invite.user_id) {
      return NextResponse.json(
        {
          error: 'Account already exists',
          requiresLogin: true,
          message: 'An account with this invite code already exists. Please log in with your existing credentials.'
        },
        { status: 409 }
      );
    }

    let userId: string;
    let authSession: { access_token: string; refresh_token: string } | null = null;

    {
      // Create auth user - email confirmation required for security
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'}/login`,
        },
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        // If user already exists, that's okay - they're retrying
        if (signupError.message?.includes('already registered')) {
          // Try to get the user by email (won't work without admin privileges)
          // For now, just return an error asking them to log in
          return NextResponse.json(
            { error: 'An account with this email already exists. Please log in instead.' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to create account', details: signupError?.message },
          { status: 500 }
        );
      }

      if (!authData.user) {
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }

      userId = authData.user.id;
      authSession = authData.session;
    }

    // Mark pending invite as used
    const { error: updateInviteError } = await supabase
      .from('pending_invites')
      .update({
        user_id: userId,
        used_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (updateInviteError) {
      console.error('Error marking invite as used:', updateInviteError);
      // Don't fail the signup - just log the error
    }

    // Note: Profile is auto-created by database trigger (handle_new_user)
    // No need to manually create it here

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
      },
      session: authSession, // Include session if auto-confirmed
      message: 'Account created successfully',
    });
  } catch (error: unknown) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
