/**
 * GET /api/tutorial/gap-final
 *
 * Returns outstanding Question E list from E_QUESTIONS_OUTSTANDING.json.
 * This is a simple JSON file generated post-Sculptor that lists which
 * E01-E24 questions still need to be asked.
 *
 * If no file exists, returns all 24 questions as outstanding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Question E definitions (E01-E24) - fallback if no file exists
const QUESTION_E_DEFINITIONS: Record<string, { section: string; text: string }> = {
  E01: { section: 'decision-making', text: "When you're facing a big decision and feeling overwhelmed, what does that look like for you?" },
  E02: { section: 'decision-making', text: "When you have too many options, what's your default response?" },
  E03: { section: 'decision-making', text: 'Do you prefer someone to present options, make recommendations, or just make the call?' },
  E04: { section: 'decision-making', text: 'What kinds of decisions drain you the most? What kinds energize you?' },
  E05: { section: 'energy-cognitive', text: "When are you at your best? Time of day, conditions, context?" },
  E06: { section: 'energy-cognitive', text: 'What drains you faster than people might expect?' },
  E07: { section: 'energy-cognitive', text: "How do you know when you're avoiding something? What does that look like?" },
  E08: { section: 'energy-cognitive', text: 'What does your "overwhelm spiral" look like?' },
  E09: { section: 'energy-cognitive', text: 'Do you have any neurodivergent patterns that affect how you work?' },
  E10: { section: 'energy-cognitive', text: 'What kind of structure helps you? What kind feels constraining?' },
  E11: { section: 'communication', text: 'When working with someone, do you prefer direct recommendations, facilitated thinking, or minimal check-ins?' },
  E12: { section: 'communication', text: 'What kind of input feels helpful vs. annoying?' },
  E13: { section: 'communication', text: "How should someone push back on you if they think you're wrong?" },
  E14: { section: 'communication', text: "When you're not feeling great, how should that change how people interact with you?" },
  E15: { section: 'crisis-recovery', text: 'What does "stuck" look like for you? How do you know when you\'re there?' },
  E16: { section: 'crisis-recovery', text: "What helps you get unstuck? What's worked in the past?" },
  E17: { section: 'crisis-recovery', text: "What makes things worse when you're struggling? What should people NOT do?" },
  E18: { section: 'crisis-recovery', text: 'How does chronic pain (or health issues) affect your availability and focus?' },
  E19: { section: 'crisis-recovery', text: "When you're in crisis mode, do you want space, help carrying the load, or distraction?" },
  E20: { section: 'work-style', text: 'How do you like to be helped? What does good support look like?' },
  E21: { section: 'work-style', text: 'How should priorities be presented to you?' },
  E22: { section: 'work-style', text: "What's your relationship with time? Are deadlines helpful pressure or unhelpful stress?" },
  E23: { section: 'work-style', text: 'What does "done enough" look like for you?' },
  E24: { section: 'work-style', text: 'Is there anything else about how you work that would be helpful to know?' },
};

interface OutstandingQuestion {
  id: string;
  section: string;
  text: string;
}

interface EQuestionsFile {
  entity: string;
  generated: string;
  total_questions: number;
  questions_answered: number;
  questions_outstanding: number;
  outstanding: OutstandingQuestion[];
}

interface GapFinalResponse {
  outstanding_questions: OutstandingQuestion[];
  questions_answered: number;
  questions_total: number;
  has_file: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entitySlug = searchParams.get('entity_slug');
    const sessionId = searchParams.get('session_id');

    if (!entitySlug && !sessionId) {
      return NextResponse.json(
        { error: 'entity_slug or session_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use service client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let effectiveEntitySlug = entitySlug;

    // If we have a session_id but no entity_slug, look up the entity from the session
    if (sessionId && !entitySlug) {
      const { data: session } = await supabase
        .from('sculptor_sessions')
        .select('entity_slug')
        .eq('id', sessionId)
        .single();

      if (session?.entity_slug) {
        effectiveEntitySlug = session.entity_slug;
      }
    }

    // Try to load E_QUESTIONS_OUTSTANDING.json from storage
    if (effectiveEntitySlug) {
      const filePath = `contexts/${effectiveEntitySlug}/E_QUESTIONS_OUTSTANDING.json`;

      const { data, error } = await supabase.storage
        .from('human-os')
        .download(filePath);

      if (!error && data) {
        const content = await data.text();
        const eQuestions: EQuestionsFile = JSON.parse(content);

        const response: GapFinalResponse = {
          outstanding_questions: eQuestions.outstanding,
          questions_answered: eQuestions.questions_answered,
          questions_total: eQuestions.total_questions,
          has_file: true,
        };

        return NextResponse.json(response, { headers: corsHeaders });
      }
    }

    // No file found - return all questions as outstanding
    const allQuestions = Object.entries(QUESTION_E_DEFINITIONS).map(([id, def]) => ({
      id,
      section: def.section,
      text: def.text,
    }));

    const response: GapFinalResponse = {
      outstanding_questions: allQuestions,
      questions_answered: 0,
      questions_total: Object.keys(QUESTION_E_DEFINITIONS).length,
      has_file: false,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in /api/tutorial/gap-final:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
