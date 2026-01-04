/**
 * Candidate Email Lookup API
 *
 * POST /api/candidates/lookup
 *
 * Allows returning candidates to retrieve their session history by email
 * Part of Release 1.6: Return Visit System
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
          errorCode: 'MISSING_EMAIL',
        },
        { status: 400 }
      );
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          errorCode: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    // Use service role client to lookup candidate
    const supabase = createServiceRoleClient();

    // Find candidate by email
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        company_id,
        intelligence_file,
        check_in_count,
        last_check_in,
        relationship_strength,
        created_at,
        updated_at
      `)
      .eq('email', normalizedEmail)
      .single();

    if (candidateError || !candidate) {
      // Candidate not found - this is not an error, just means they're new
      return NextResponse.json(
        {
          success: true,
          found: false,
          message: 'No previous sessions found for this email',
        },
        { status: 200 }
      );
    }

    // Fetch session history for this candidate
    const { data: sessions, error: sessionsError } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        session_type,
        status,
        position_id,
        started_at,
        completed_at,
        created_at
      `)
      .eq('candidate_id', candidate.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('[Candidate Lookup] Error fetching sessions:', sessionsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch session history',
          errorCode: 'SESSION_ERROR',
        },
        { status: 500 }
      );
    }

    // Return candidate data and session history
    return NextResponse.json(
      {
        success: true,
        found: true,
        candidate: {
          id: candidate.id,
          email: candidate.email,
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          phone: candidate.phone,
          companyId: candidate.company_id,
          intelligenceFile: candidate.intelligence_file,
          checkInCount: candidate.check_in_count || 0,
          lastCheckIn: candidate.last_check_in,
          relationshipStrength: candidate.relationship_strength || 'cold',
          createdAt: candidate.created_at,
          updatedAt: candidate.updated_at,
        },
        sessions: sessions || [],
        sessionCount: sessions?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Candidate Lookup API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        errorCode: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidates/lookup
 *
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: '/api/candidates/lookup',
      method: 'POST',
      description: 'Look up candidate by email to retrieve session history',
      requestBody: {
        email: 'string (required) - Candidate email address',
      },
      response: {
        success: 'boolean',
        found: 'boolean - true if candidate exists',
        candidate: {
          id: 'string - UUID',
          email: 'string',
          firstName: 'string',
          lastName: 'string',
          phone: 'string',
          companyId: 'string - UUID',
          intelligenceFile: 'object - Synthesized profile',
          checkInCount: 'number - Number of check-in sessions',
          lastCheckIn: 'ISO 8601 date',
          relationshipStrength: 'string - cold | warm | hot',
        },
        sessions: 'array - List of interview sessions',
        sessionCount: 'number - Total sessions',
        error: 'string (if success = false)',
        errorCode: 'string (if success = false)',
      },
      errorCodes: {
        MISSING_EMAIL: 'Email not provided',
        INVALID_EMAIL: 'Email format invalid',
        SESSION_ERROR: 'Failed to fetch sessions',
        UNKNOWN_ERROR: 'Unexpected error',
      },
    },
    { status: 200 }
  );
}
