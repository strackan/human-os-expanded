// POST /api/public/assessment/[candidateId]/answer
// Submits an answer to a specific question in the assessment

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CandidateService } from '@/lib/services/CandidateService';
import { InterviewMessage } from '@/types/talent';

export async function POST(request: NextRequest, { params }: { params: Promise<{ candidateId: string }> }) {
  try {
    // Verify API key from GoodHang
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.GOODHANG_API_KEY;

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
    }

    const supabase = await createClient();
    const { candidateId } = await params;

    // Parse request body
    const body = await request.json();
    const { question_id, question_text, answer } = body;

    // Validate required fields
    if (!question_id || !question_text || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields: question_id, question_text, answer' },
        { status: 400 }
      );
    }

    // Get candidate and existing transcript
    const candidate = await CandidateService.getCandidateById(candidateId, supabase);

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Build new transcript entries
    const existingTranscript = (candidate.interview_transcript as InterviewMessage[]) || [];

    const questionMessage: InterviewMessage = {
      role: 'assistant',
      content: question_text,
      timestamp: new Date().toISOString(),
    };

    const answerMessage: InterviewMessage = {
      role: 'user',
      content: answer,
      timestamp: new Date().toISOString(),
    };

    const updatedTranscript = [...existingTranscript, questionMessage, answerMessage];

    // Update candidate with new transcript
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        interview_transcript: updatedTranscript,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate transcript:', updateError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Answer saved successfully',
      question_id,
    });
  } catch (error: any) {
    console.error('Error saving answer:', error);
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
