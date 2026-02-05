/**
 * GET /api/tutorial/gap-final
 *
 * Returns outstanding Question E list from GAP_ANALYSIS_FINAL.md
 * Used by thick client to determine which E01-E24 questions to ask
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

// Question E definitions (E01-E24 from GAP_ANALYSIS.md)
const QUESTION_E_DEFINITIONS: Record<string, { section: string; text: string }> = {
  E01: {
    section: 'decision-making',
    text: "When you're facing a big decision and feeling overwhelmed, what does that look like for you?",
  },
  E02: {
    section: 'decision-making',
    text: "When you have too many options, what's your default response?",
  },
  E03: {
    section: 'decision-making',
    text: 'Do you prefer someone to present options, make recommendations, or just make the call?',
  },
  E04: {
    section: 'decision-making',
    text: 'What kinds of decisions drain you the most? What kinds energize you?',
  },
  E05: {
    section: 'energy-cognitive',
    text: "When are you at your best? Time of day, conditions, context?",
  },
  E06: {
    section: 'energy-cognitive',
    text: 'What drains you faster than people might expect?',
  },
  E07: {
    section: 'energy-cognitive',
    text: "How do you know when you're avoiding something? What does that look like?",
  },
  E08: {
    section: 'energy-cognitive',
    text: 'What does your "overwhelm spiral" look like?',
  },
  E09: {
    section: 'energy-cognitive',
    text: 'Do you have any neurodivergent patterns that affect how you work?',
  },
  E10: {
    section: 'energy-cognitive',
    text: 'What kind of structure helps you? What kind feels constraining?',
  },
  E11: {
    section: 'communication',
    text: 'When working with someone, do you prefer direct recommendations, facilitated thinking, or minimal check-ins?',
  },
  E12: {
    section: 'communication',
    text: 'What kind of input feels helpful vs. annoying?',
  },
  E13: {
    section: 'communication',
    text: "How should someone push back on you if they think you're wrong?",
  },
  E14: {
    section: 'communication',
    text: "When you're not feeling great, how should that change how people interact with you?",
  },
  E15: {
    section: 'crisis-recovery',
    text: 'What does "stuck" look like for you? How do you know when you\'re there?',
  },
  E16: {
    section: 'crisis-recovery',
    text: "What helps you get unstuck? What's worked in the past?",
  },
  E17: {
    section: 'crisis-recovery',
    text: "What makes things worse when you're struggling? What should people NOT do?",
  },
  E18: {
    section: 'crisis-recovery',
    text: 'How does chronic pain (or health issues) affect your availability and focus?',
  },
  E19: {
    section: 'crisis-recovery',
    text: "When you're in crisis mode, do you want space, help carrying the load, or distraction?",
  },
  E20: {
    section: 'work-style',
    text: 'How do you like to be helped? What does good support look like?',
  },
  E21: {
    section: 'work-style',
    text: 'How should priorities be presented to you?',
  },
  E22: {
    section: 'work-style',
    text: "What's your relationship with time? Are deadlines helpful pressure or unhelpful stress?",
  },
  E23: {
    section: 'work-style',
    text: 'What does "done enough" look like for you?',
  },
  E24: {
    section: 'work-style',
    text: 'Is there anything else about how you work that would be helpful to know?',
  },
};

interface GapFinalResponse {
  outstanding_questions: Array<{
    id: string;
    section: string;
    text: string;
  }>;
  questions_answered: number;
  questions_total: number;
  has_gap_final: boolean;
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

    // Try to load GAP_ANALYSIS_FINAL.md from storage
    let gapFinalContent: string | null = null;
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

    if (effectiveEntitySlug) {
      const filePath = `contexts/${effectiveEntitySlug}/GAP_ANALYSIS_FINAL.md`;

      const { data, error } = await supabase.storage
        .from('human-os')
        .download(filePath);

      if (!error && data) {
        gapFinalContent = await data.text();
      }
    }

    // If no GAP_ANALYSIS_FINAL.md found, return all questions as outstanding
    if (!gapFinalContent) {
      const allQuestions = Object.entries(QUESTION_E_DEFINITIONS).map(([id, def]) => ({
        id,
        section: def.section,
        text: def.text,
      }));

      const response: GapFinalResponse = {
        outstanding_questions: allQuestions,
        questions_answered: 0,
        questions_total: Object.keys(QUESTION_E_DEFINITIONS).length,
        has_gap_final: false,
      };

      return NextResponse.json(response, { headers: corsHeaders });
    }

    // Parse GAP_ANALYSIS_FINAL.md to extract outstanding questions
    const outstandingIds = parseOutstandingQuestions(gapFinalContent);

    const outstandingQuestions = outstandingIds
      .filter((id) => QUESTION_E_DEFINITIONS[id])
      .map((id) => ({
        id,
        section: QUESTION_E_DEFINITIONS[id].section,
        text: QUESTION_E_DEFINITIONS[id].text,
      }));

    const totalQuestions = Object.keys(QUESTION_E_DEFINITIONS).length;

    const response: GapFinalResponse = {
      outstanding_questions: outstandingQuestions,
      questions_answered: totalQuestions - outstandingQuestions.length,
      questions_total: totalQuestions,
      has_gap_final: true,
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

/**
 * Parse GAP_ANALYSIS_FINAL.md to extract list of outstanding question IDs
 *
 * Expected format in the markdown:
 * ## Outstanding Questions
 * - E15
 * - E16
 * - E19
 *
 * Or YAML frontmatter:
 * ---
 * outstanding_questions: [E15, E16, E19]
 * ---
 */
function parseOutstandingQuestions(content: string): string[] {
  const outstandingIds: string[] = [];

  // Try YAML frontmatter first
  const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const frontmatter = yamlMatch[1];
    // Look for outstanding_questions array
    const arrayMatch = frontmatter.match(/outstanding_questions:\s*\[(.*?)\]/);
    if (arrayMatch) {
      const ids = arrayMatch[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
      outstandingIds.push(...ids.filter((id) => id.match(/^E\d{2}$/)));
    }
    // Also check for YAML list format
    const listMatch = frontmatter.match(/outstanding_questions:\s*\n((?:\s*-\s*E\d{2}\s*\n?)+)/);
    if (listMatch) {
      const ids = listMatch[1].match(/E\d{2}/g) || [];
      outstandingIds.push(...ids);
    }
  }

  // Also scan the body for "Outstanding Questions" section
  const sectionMatch = content.match(/##\s*Outstanding Questions[\s\S]*?(?=##|$)/i);
  if (sectionMatch) {
    const ids = sectionMatch[0].match(/E\d{2}/g) || [];
    for (const id of ids) {
      if (!outstandingIds.includes(id)) {
        outstandingIds.push(id);
      }
    }
  }

  // Scan for any E## mentions in "still missing" or "gaps" sections
  const gapSections = content.match(/(missing|gap|outstanding|unanswered)[\s\S]*?(?=##|$)/gi) || [];
  for (const section of gapSections) {
    const ids = section.match(/E\d{2}/g) || [];
    for (const id of ids) {
      if (!outstandingIds.includes(id)) {
        outstandingIds.push(id);
      }
    }
  }

  return outstandingIds;
}
