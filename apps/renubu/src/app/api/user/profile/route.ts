/**
 * User Profile API
 *
 * GET /api/user/profile
 * - Returns current user's profile information
 * - Includes firstName derived from full_name or email
 *
 * This endpoint removes the need for direct Supabase access
 * from components like WelcomeMessage.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// Types
// =====================================================

interface UserProfileResponse {
  id: string;
  firstName: string;
  fullName: string | null;
  email: string;
  role: string | null;
  companyId: string | null;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract first name from various sources
 */
function extractFirstName(
  fullName: string | null | undefined,
  userMetadata: Record<string, unknown> | undefined,
  email: string | undefined
): string {
  // Try full_name from profile
  if (fullName) {
    const firstName = fullName.split(' ')[0];
    if (firstName) return firstName;
  }

  // Try user metadata name
  if (userMetadata?.name && typeof userMetadata.name === 'string') {
    const firstName = userMetadata.name.split(' ')[0];
    if (firstName) return firstName;
  }

  // Try user metadata full_name
  if (userMetadata?.full_name && typeof userMetadata.full_name === 'string') {
    const firstName = userMetadata.full_name.split(' ')[0];
    if (firstName) return firstName;
  }

  // Last resort: use email prefix
  if (email) {
    const emailPrefix = email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  return 'User';
}

// =====================================================
// GET - Get User Profile
// =====================================================

export async function GET() {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';

    // Always use server client for auth check first
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use appropriate client for database queries
    const supabase = (demoMode || authBypassEnabled)
      ? createServiceRoleClient()
      : authSupabase;

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Extract first name using fallback logic
    const firstName = extractFirstName(
      profile?.full_name,
      user.user_metadata,
      user.email
    );

    // Build response
    const response: UserProfileResponse = {
      id: user.id,
      firstName,
      fullName: profile?.full_name || null,
      email: user.email || '',
      role: profile?.role || null,
      companyId: profile?.company_id || null,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in get user profile API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
