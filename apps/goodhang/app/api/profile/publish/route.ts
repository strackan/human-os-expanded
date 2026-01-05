// POST /api/profile/publish
// Publishes assessment results to public profile

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get session ID from request body
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Fetch the assessment session
    const { data: session, error: sessionError } = await supabase
      .from('cs_assessment_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Assessment session not found' },
        { status: 404 }
      );
    }

    // Check if assessment is completed
    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Assessment must be completed before publishing' },
        { status: 400 }
      );
    }

    // Check if already published
    if (session.is_published) {
      return NextResponse.json(
        { error: 'Profile already published', slug: session.id },
        { status: 400 }
      );
    }

    // Get user profile for display name
    const { error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // Create public profile entry in public_profiles table (if exists)
    // For now, we'll just mark the session as published
    // In Phase 3, you can add a separate public_profiles table

    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update({
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error publishing profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to publish profile' },
        { status: 500 }
      );
    }

    // Generate shareable URL (using session ID as slug)
    const profileSlug = session_id;
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/${profileSlug}`;

    return NextResponse.json({
      success: true,
      slug: profileSlug,
      url: profileUrl,
      message: 'Profile published successfully',
    });
  } catch (error) {
    console.error('Error in /api/profile/publish:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/publish
// Unpublishes assessment results (makes private)
export async function DELETE(request: NextRequest) {
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

    // Get session ID from request body
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Verify ownership and update
    const { error: updateError } = await supabase
      .from('cs_assessment_sessions')
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error unpublishing profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to unpublish profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile unpublished successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/profile/publish:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
