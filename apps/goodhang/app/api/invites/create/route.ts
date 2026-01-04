import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/invites/create
 * Creates a new pending invite and generates an invite code
 * Requires admin or ambassador role
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role and region from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role, region_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Check permissions
    const isAdmin = profile.user_role === 'admin';
    const isAmbassador = profile.user_role === 'ambassador';

    if (!isAdmin && !isAmbassador) {
      return NextResponse.json(
        { error: 'Only admins and ambassadors can create invites' },
        { status: 403 }
      );
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Create pending invite (invite_code auto-generates via database trigger)
    const { data: invite, error: insertError } = await supabase
      .from('pending_invites')
      .insert({
        name,
        email,
        created_by: user.id,
      })
      .select('id, name, email, invite_code')
      .single();

    if (insertError) {
      console.error('Error creating invite:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invite', details: insertError.message },
        { status: 500 }
      );
    }

    if (!invite) {
      console.error('Invite created but not returned - possible RLS issue');
      return NextResponse.json(
        { error: 'Failed to retrieve invite after creation. Please check RLS policies.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        name: invite.name,
        email: invite.email,
        invite_code: invite.invite_code,
        invite_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'}/assessment/start?code=${invite.invite_code}`,
      },
      message: 'Invite created successfully',
    });
  } catch (error: unknown) {
    console.error('Create invite error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
