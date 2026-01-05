// GET /api/assessment/absurdist/questions
// Returns all absurdist finale questions

import { NextResponse } from 'next/server';
import absurdistQuestions from '@/lib/assessment/absurdist-questions.json';

export async function GET() {
  try {
    // Return all absurdist questions
    // No authentication needed - questions aren't sensitive
    return NextResponse.json({
      questions: absurdistQuestions.questions,
      metadata: {
        version: absurdistQuestions.version,
        title: absurdistQuestions.title,
        description: absurdistQuestions.description,
        total_questions: absurdistQuestions.questions.length,
      },
    });
  } catch (error) {
    console.error('Error in /api/assessment/absurdist/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
