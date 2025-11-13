import { NextRequest, NextResponse } from 'next/server';
import { CandidateService } from '@/lib/services/CandidateService';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/talent/candidates
 *
 * Public endpoint for creating candidate records from the /join landing page.
 * Uses service role client to bypass RLS since candidates can self-register.
 *
 * Release 1.5: Talent Orchestration System - Sprint 1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, linkedin_url, referral_source } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Use service role client for public candidate creation
    const supabase = createServiceRoleClient();

    // System user ID for public candidates
    // All self-registered candidates are initially associated with the talent system user
    const TALENT_SYSTEM_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID || '2d703ec3-a55e-4dd9-8921-ee6663858ff3';

    // Check if candidate already exists
    const existingCandidate = await CandidateService.getCandidateByEmail(
      email,
      TALENT_SYSTEM_USER_ID,
      supabase
    );

    if (existingCandidate) {
      // Return existing candidate instead of creating duplicate
      return NextResponse.json(
        {
          candidate: existingCandidate,
          message: 'Welcome back! Continuing your application.'
        },
        { status: 200 }
      );
    }

    // Create new candidate
    const candidate = await CandidateService.createCandidate(
      {
        name,
        email,
        linkedin_url: linkedin_url || undefined,
        referral_source: referral_source || undefined,
      },
      TALENT_SYSTEM_USER_ID,
      supabase
    );

    console.log('✅ Created new candidate:', { id: candidate.id, email: candidate.email });

    return NextResponse.json(
      {
        candidate,
        message: 'Candidate created successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating candidate:', error);

    // Handle specific error cases
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A candidate with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to create candidate',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
