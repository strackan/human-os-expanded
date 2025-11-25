// GET /api/public/assessment/[candidateId]/results
// Retrieves the scored results for a completed assessment

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CandidateService } from '@/lib/services/CandidateService';

export async function GET(_request: NextRequest, { params }: { params: { candidateId: string } }) {
  try {
    const supabase = await createClient();
    const candidateId = params.candidateId;

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get candidate
    const candidate = await CandidateService.getCandidateById(candidateId, supabase);

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Verify user owns this candidate
    if (candidate.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - candidate ownership mismatch' }, { status: 403 });
    }

    // Check if analysis exists
    if (!candidate.analysis) {
      return NextResponse.json({ error: 'Assessment not yet completed or scored' }, { status: 400 });
    }

    // Return results
    return NextResponse.json({
      candidate_id: candidateId,
      name: candidate.name,
      email: candidate.email,
      status: candidate.status,
      tier: candidate.tier,
      overall_score: candidate.overall_score,
      archetype: candidate.archetype,
      archetype_confidence: candidate.analysis.archetype_confidence,
      dimensions: candidate.dimensions,
      flags: candidate.flags,
      recommendation: candidate.analysis.recommendation,
      best_fit_roles: candidate.analysis.best_fit_roles,
      analyzed_at: candidate.analysis.analyzed_at,
    });
  } catch (error: any) {
    console.error('Error retrieving results:', error);
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
