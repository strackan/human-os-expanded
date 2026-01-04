import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/invite-code - Validate and use an invite code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 400 }
      );
    }

    // Call the database function to validate and use the code
    const { data: success, error } = await supabase.rpc('use_invite_code', {
      code_text: code.toUpperCase().trim(),
      user_id: user.id,
    });

    if (error) {
      console.error('Error using invite code:', error);
      return NextResponse.json(
        { error: 'Failed to validate invite code' },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invite code applied successfully',
    });
  } catch (error) {
    console.error('Error in /api/invite-code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/invite-code/validate - Check if code is valid without using it
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'No code provided' },
        { status: 400 }
      );
    }

    // Check if code exists and is available
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .select('id, is_active, expires_at, used_by')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !inviteCode) {
      return NextResponse.json({ valid: false });
    }

    const isValid =
      inviteCode.is_active &&
      !inviteCode.used_by &&
      (!inviteCode.expires_at || new Date(inviteCode.expires_at) > new Date());

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json({ valid: false });
  }
}
