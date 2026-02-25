/**
 * Onboarding Session API
 *
 * GET  /api/onboarding/session — Get active session + completion status
 * POST /api/onboarding/session — Create a new session
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OnboardingService } from '@/lib/services/OnboardingService';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new OnboardingService(supabase);

    const [session, hasCompleted] = await Promise.all([
      service.getActiveSession(user.id),
      service.hasCompletedOnboarding(user.id),
    ]);

    return NextResponse.json({ session, hasCompleted });
  } catch (error) {
    console.error('[Onboarding Session API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new OnboardingService(supabase);
    const session = await service.createSession(user.id);

    return NextResponse.json({ session });
  } catch (error) {
    console.error('[Onboarding Session API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
