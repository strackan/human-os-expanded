/**
 * GET /api/user/status
 *
 * Returns comprehensive user status across all products.
 * Called by desktop client after authentication to determine routing.
 *
 * Returns:
 * - products: enabled products with status details
 * - recommended_action: where to route the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getHumanOsClient, isHumanOsConfigured } from '@/lib/supabase/human-os';

// Local Supabase client for GoodHang data
let _localSupabase: ReturnType<typeof createClient> | null = null;
function getLocalSupabase() {
  if (!_localSupabase) {
    _localSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _localSupabase;
}

interface GoodHangAssessment {
  completed: boolean;
  status: string;
  tier: string | null;
  archetype: string | null;
  overall_score: number | null;
  dimensions: Record<string, number> | null;
  badges: string[] | null;
  session_id: string | null;
}

interface UserStatus {
  found: boolean;
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
  products: {
    goodhang: {
      enabled: boolean;
      assessment: GoodHangAssessment | null;
    };
    founder_os: {
      enabled: boolean;
      sculptor: {
        completed: boolean;
        status: string;
        transcript_available: boolean;
      } | null;
      identity_profile: {
        completed: boolean;
        annual_theme: string | null;
        core_values: string[] | null;
      } | null;
    };
    voice_os: {
      enabled: boolean;
      context_files_count: number;
    };
  };
  entities: {
    count: number;
    has_entity: boolean;
  };
  contexts: {
    available: string[];
    active: string | null;
  };
  recommended_action: 'view_assessment' | 'start_onboarding' | 'continue_context' | 'complete_assessment';
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or auth header
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userSlug = searchParams.get('slug');

    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!userId && !userSlug && !token) {
      return NextResponse.json(
        { error: 'User identification required (userId, slug, or auth token)' },
        { status: 400 }
      );
    }

    // Initialize result
    const result: UserStatus = {
      found: false,
      products: {
        goodhang: { enabled: false, assessment: null },
        founder_os: { enabled: false, sculptor: null, identity_profile: null },
        voice_os: { enabled: false, context_files_count: 0 },
      },
      entities: { count: 0, has_entity: false },
      contexts: { available: [], active: null },
      recommended_action: 'start_onboarding',
    };

    // Get local GoodHang data
    const localDb = getLocalSupabase();

    // Try to get user from auth token first
    let localUser: { id: string; email?: string; user_metadata?: { full_name?: string } } | null = null;

    if (token) {
      const { data: { user }, error } = await localDb.auth.getUser(token);
      if (!error && user) {
        localUser = user;
      }
    }

    // Get user profile and assessment
    const resolvedUserId = userId || localUser?.id;

    if (resolvedUserId) {
      // Get profile
      const { data: profile } = await localDb
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', resolvedUserId)
        .single();

      const profileData = profile as { id: string; email: string | null; full_name: string | null } | null;

      if (profileData) {
        result.found = true;
        result.user = {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
        };

        // Get most recent assessment session
        const { data: assessment } = await localDb
          .from('cs_assessment_sessions')
          .select('id, status, tier, archetype, overall_score, dimensions, badges')
          .eq('user_id', resolvedUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        interface AssessmentData {
          id: string;
          status: string;
          tier: string | null;
          archetype: string | null;
          overall_score: number | null;
          dimensions: Record<string, number> | null;
          badges: string[] | null;
        }
        const assessmentData = assessment as AssessmentData | null;

        if (assessmentData) {
          result.products.goodhang = {
            enabled: true,
            assessment: {
              completed: assessmentData.status === 'completed',
              status: assessmentData.status,
              tier: assessmentData.tier,
              archetype: assessmentData.archetype,
              overall_score: assessmentData.overall_score,
              dimensions: assessmentData.dimensions,
              badges: assessmentData.badges,
              session_id: assessmentData.id,
            },
          };

          // Update recommended action based on assessment
          if (assessmentData.status === 'completed') {
            result.recommended_action = 'view_assessment';
          } else if (assessmentData.status === 'in_progress') {
            result.recommended_action = 'complete_assessment';
          }
        }
      }
    }

    // Get Human OS data (Founder OS, Voice OS) via direct queries
    if (isHumanOsConfigured()) {
      try {
        const humanOsDb = getHumanOsClient();
        console.log('[user/status] Human OS configured, resolvedUserId:', resolvedUserId);

        // Get human_os user by auth_id
        let humanOsUserId: string | null = null;

        if (resolvedUserId) {
          // Query human_os schema for users
          const { data: humanOsUser, error: userError } = await humanOsDb
            .schema('human_os')
            .from('users')
            .select('id, slug, display_name, email')
            .eq('auth_id', resolvedUserId)
            .single();

          console.log('[user/status] humanOsUser lookup:', { humanOsUser, error: userError?.message });

          if (humanOsUser) {
            humanOsUserId = humanOsUser.id;
            result.found = true;
            if (!result.user) {
              result.user = {
                id: humanOsUser.id,
                email: humanOsUser.email,
                full_name: humanOsUser.display_name,
              };
            }
          }
        }

        // Check for founder_os product
        if (humanOsUserId) {
          // Query human_os schema for user_products
          const { data: founderOsProduct, error: productError } = await humanOsDb
            .schema('human_os')
            .from('user_products')
            .select('*')
            .eq('user_id', humanOsUserId)
            .eq('product', 'founder_os')
            .single();

          console.log('[user/status] founderOsProduct lookup:', { found: !!founderOsProduct, error: productError?.message });

          if (founderOsProduct) {
            result.products.founder_os.enabled = true;
          }

          // Get sculptor session by user_id (public schema)
          const { data: sculptorSession, error: sculptorError } = await humanOsDb
            .from('sculptor_sessions')
            .select('id, status, entity_slug, metadata')
            .eq('user_id', humanOsUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          console.log('[user/status] sculptorSession lookup by user_id:', {
            found: !!sculptorSession,
            status: sculptorSession?.status,
            id: sculptorSession?.id,
            error: sculptorError?.message
          });

          if (sculptorSession) {
            // If we found a sculptor session, enable founder_os even if product entry is missing
            result.products.founder_os.enabled = true;
            result.products.founder_os.sculptor = {
              completed: sculptorSession.status === 'completed',
              status: sculptorSession.status,
              transcript_available: !!sculptorSession.metadata?.conversation_history,
            };

            // Set active context to sculptor entity slug
            result.contexts.active = sculptorSession.entity_slug;
            result.contexts.available = [sculptorSession.entity_slug];
          }
        }

        // Fallback: If no sculptor session found yet, try searching by auth_id directly
        // This handles cases where sculptor_sessions.user_id stores auth_id instead of human_os user id
        if (!result.products.founder_os.sculptor && resolvedUserId) {
          const { data: sculptorByAuthId, error: authIdError } = await humanOsDb
            .from('sculptor_sessions')
            .select('id, status, entity_slug, metadata')
            .eq('user_id', resolvedUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          console.log('[user/status] sculptorSession lookup by auth_id:', {
            found: !!sculptorByAuthId,
            status: sculptorByAuthId?.status,
            id: sculptorByAuthId?.id,
            error: authIdError?.message
          });

          if (sculptorByAuthId) {
            result.products.founder_os.enabled = true;
            result.products.founder_os.sculptor = {
              completed: sculptorByAuthId.status === 'completed',
              status: sculptorByAuthId.status,
              transcript_available: !!sculptorByAuthId.metadata?.conversation_history,
            };
            result.contexts.active = sculptorByAuthId.entity_slug;
            result.contexts.available = [sculptorByAuthId.entity_slug];
            result.found = true;
          }
        }

        // Update recommended action based on Founder OS status
        const sculptor = result.products.founder_os.sculptor;
        if (sculptor?.completed) {
          result.recommended_action = 'continue_context';
        } else if (sculptor && !sculptor.completed) {
          result.recommended_action = 'start_onboarding';
        }
      } catch (humanOsError) {
        console.warn('Failed to fetch Human OS status:', humanOsError);
        // Continue with local data only
      }
    }

    if (!result.found) {
      return NextResponse.json(
        { error: 'User not found', found: false },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    );
  }
}

// Allow CORS for desktop client
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
