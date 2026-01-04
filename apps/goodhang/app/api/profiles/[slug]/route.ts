// GET /api/profiles/[slug]
// Get individual published profile by slug (public endpoint, no auth required)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PublicProfile } from '@/lib/assessment/types';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createClient();

    // Validate slug format
    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid profile slug' },
        { status: 400 }
      );
    }

    // Fetch profile by slug
    const { data: profile, error } = await supabase
      .from('public_profiles')
      .select('*')
      .eq('profile_slug', slug)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Privacy layer: Hide scores if show_scores is false
    const sanitizedProfile: PublicProfile = {
      ...profile,
      overall_score: profile.show_scores ? profile.overall_score : null,
      category_scores: profile.show_scores ? profile.category_scores : null,
    };

    // Hide email if not explicitly set (already handled by publish API, but double-check)
    if (!sanitizedProfile.email) {
      const { email: _removedEmail, ...profileWithoutEmail } = sanitizedProfile;
      return NextResponse.json(profileWithoutEmail);
    }

    return NextResponse.json(sanitizedProfile);
  } catch (error) {
    console.error('Error in /api/profiles/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
