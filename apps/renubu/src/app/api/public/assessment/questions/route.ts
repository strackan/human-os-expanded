// GET /api/public/assessment/questions
// Returns all assessment questions (alternative to including in /start response)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadAssessmentConfig } from '@/lib/assessment/question-loader';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load assessment configuration
    const assessmentConfig = loadAssessmentConfig();

    return NextResponse.json({
      assessment: assessmentConfig,
    });
  } catch (error: any) {
    console.error('Error loading questions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Enable CORS for GoodHang
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.GOODHANG_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}
