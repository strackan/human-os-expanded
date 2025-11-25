// POST /api/public/assessment/[candidateId]/complete
// Completes the assessment and triggers AI scoring

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CandidateService } from '@/lib/services/CandidateService';
import { ScoringService } from '@/lib/services/ScoringService';
import { InterviewMessage } from '@/types/talent';

export async function POST(_request: NextRequest, { params }: { params: { candidateId: string } }) {
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

    // Get candidate to verify ownership and get transcript
    const candidate = await CandidateService.getCandidateById(candidateId, supabase);

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Verify user owns this candidate
    if (candidate.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - candidate ownership mismatch' }, { status: 403 });
    }

    // Verify transcript exists
    if (!candidate.interview_transcript || candidate.interview_transcript.length === 0) {
      return NextResponse.json({ error: 'No interview transcript found' }, { status: 400 });
    }

    // Score assessment using ScoringService
    const scoringResult = await ScoringService.scoreAssessment(
      candidate.interview_transcript as InterviewMessage[]
    );

    if (!scoringResult.success) {
      return NextResponse.json(
        { error: scoringResult.error || 'Failed to score assessment' },
        { status: 500 }
      );
    }

    const { analysis } = scoringResult;

    // Update candidate with analysis
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        analysis,
        archetype: analysis.archetype,
        overall_score: analysis.overall_score,
        dimensions: analysis.dimensions,
        tier: analysis.tier,
        flags: analysis.flags,
        status: analysis.tier === 'passed' ? 'passed' : 'interviewed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate analysis:', updateError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    // If tier is 'benched' or 'top_1', add to talent_bench
    if (analysis.tier === 'benched' || analysis.tier === 'top_1') {
      const { error: benchError } = await supabase.from('talent_bench').insert({
        candidate_id: candidateId,
        archetype_primary: analysis.archetype,
        archetype_confidence: analysis.archetype_confidence,
        best_fit_roles: analysis.best_fit_roles,
        benched_at: new Date().toISOString(),
      });

      if (benchError) {
        console.error('Error adding to talent bench:', benchError);
        // Don't fail the request if bench insert fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment completed and scored successfully',
      candidate_id: candidateId,
      tier: analysis.tier,
      overall_score: analysis.overall_score,
      archetype: analysis.archetype,
    });
  } catch (error: any) {
    console.error('Error completing assessment:', error);
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
