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
    let localUser: { id: string; email: string | null; user_metadata?: { full_name?: string } } | null = null;

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
        .select('*')
        .eq('id', resolvedUserId)
        .single();

      if (profile) {
        result.found = true;
        result.user = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
        };

        // Get most recent assessment session
        const { data: assessment } = await localDb
          .from('cs_assessment_sessions')
          .select('*')
          .eq('user_id', resolvedUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (assessment) {
          result.products.goodhang = {
            enabled: true,
            assessment: {
              completed: assessment.status === 'completed',
              status: assessment.status,
              tier: assessment.tier,
              archetype: assessment.archetype,
              overall_score: assessment.overall_score,
              dimensions: assessment.dimensions,
              badges: assessment.badges,
              session_id: assessment.id,
            },
          };

          // Update recommended action based on assessment
          if (assessment.status === 'completed') {
            result.recommended_action = 'view_assessment';
          } else if (assessment.status === 'in_progress') {
            result.recommended_action = 'complete_assessment';
          }
        }
      }
    }

    // Get Human OS data (Founder OS, Voice OS) if configured
    if (isHumanOsConfigured()) {
      try {
        const humanOsDb = getHumanOsClient();

        // Try to get user status from Human OS
        const queryParams: { p_user_id?: string; p_user_slug?: string } = {};
        if (resolvedUserId) queryParams.p_user_id = resolvedUserId;
        if (userSlug) queryParams.p_user_slug = userSlug;

        const { data: humanOsStatus, error } = await humanOsDb.rpc(
          'get_user_status',
          queryParams
        );

        if (!error && humanOsStatus && humanOsStatus.found) {
          // Merge Human OS data into result
          result.found = true;

          if (!result.user && humanOsStatus.user) {
            result.user = humanOsStatus.user;
          }

          // Founder OS status
          if (humanOsStatus.products?.founder_os) {
            result.products.founder_os = {
              enabled: humanOsStatus.products.founder_os.enabled || false,
              sculptor: humanOsStatus.products.founder_os.sculptor || null,
              identity_profile: humanOsStatus.products.founder_os.identity_profile || null,
            };
          }

          // Voice OS status
          if (humanOsStatus.products?.voice_os) {
            result.products.voice_os = {
              enabled: humanOsStatus.products.voice_os.enabled || false,
              context_files_count: humanOsStatus.products.voice_os.context_files_count || 0,
            };
          }

          // Entities
          if (humanOsStatus.entities) {
            result.entities = {
              count: humanOsStatus.entities.count || 0,
              has_entity: humanOsStatus.entities.has_entity || false,
            };
          }

          // Contexts
          if (humanOsStatus.contexts) {
            result.contexts = {
              available: humanOsStatus.contexts.available || [],
              active: humanOsStatus.contexts.active || null,
            };
          }

          // Update recommended action based on Founder OS status
          if (result.products.founder_os.enabled) {
            const sculptor = result.products.founder_os.sculptor;
            const identity = result.products.founder_os.identity_profile;

            if (sculptor?.completed || identity?.completed) {
              result.recommended_action = 'continue_context';
            } else if (sculptor && !sculptor.completed) {
              result.recommended_action = 'start_onboarding';
            }
          }
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
