// POST /api/questions/answer
// Saves an answer for an entity using the upsert_entity_answer database function

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';

interface AnswerRequest {
  entity_slug: string;
  question_slug: string;
  value_text?: string | null;
  value_choice?: string | null;
  value_numeric?: number | null;
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnswerRequest = await request.json();
    const { entity_slug, question_slug, value_text, value_choice, value_numeric, source = 'thick-client' } = body;

    if (!entity_slug || !question_slug) {
      return NextResponse.json(
        { error: 'entity_slug and question_slug are required' },
        { status: 400 }
      );
    }

    // At least one value should be provided
    if (value_text === undefined && value_choice === undefined && value_numeric === undefined) {
      return NextResponse.json(
        { error: 'At least one of value_text, value_choice, or value_numeric is required' },
        { status: 400 }
      );
    }

    const supabase = getHumanOSAdminClient();

    // Use the database function to upsert the answer
    const { data, error } = await supabase.rpc('upsert_entity_answer', {
      p_entity_slug: entity_slug,
      p_question_slug: question_slug,
      p_value_text: value_text || null,
      p_value_choice: value_choice || null,
      p_value_numeric: value_numeric || null,
      p_source: source,
    });

    if (error) {
      console.error('Error upserting answer:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to save answer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer_id: data,
      entity_slug,
      question_slug,
    });
  } catch (error) {
    console.error('Error in /api/questions/answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
