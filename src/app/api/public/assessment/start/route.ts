// POST /api/public/assessment/start
// Creates a new candidate and starts an assessment session

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CandidateService } from '@/lib/services/CandidateService';
import { loadAssessmentConfig } from '@/lib/assessment/question-loader';

export async function POST(request: NextRequest) {
  try {
    // Verify API key from GoodHang
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.GOODHANG_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, source = 'goodhang' } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields: name, email' }, { status: 400 });
    }

    // Get Supabase client (using service role for admin access)
    const supabase = await createClient();

    // Create candidate record (no user_id since we're not managing user accounts)
    const candidate = await CandidateService.createCandidate(supabase, {
      user_id: null, // No user account in Renubu
      name,
      email,
      referral_source: source,
      status: 'pending',
    });

    // Load assessment questions
    const assessmentConfig = loadAssessmentConfig();

    // Return candidate ID and questions
    return NextResponse.json({
      candidate_id: candidate.id,
      assessment: assessmentConfig,
      message: 'Assessment started successfully',
    });
  } catch (error: any) {
    console.error('Error starting assessment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Enable CORS for GoodHang
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.GOODHANG_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
