// GET /api/questions/:questionSetSlug
// Returns questions for a question set, optionally filtered by entity

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionSetSlug: string }> }
) {
  const { questionSetSlug } = await params;
  const entitySlug = request.nextUrl.searchParams.get('entity');
  const unansweredOnly = request.nextUrl.searchParams.get('unanswered') === 'true';

  try {
    const supabase = getHumanOSAdminClient();

    // If entity is provided and we want unanswered only, use the database function
    if (entitySlug && unansweredOnly) {
      const { data, error } = await supabase.rpc('get_unanswered_questions', {
        p_entity_slug: entitySlug,
        p_question_set_slug: questionSetSlug,
      });

      if (error) {
        console.error('Error calling get_unanswered_questions:', error);
        return NextResponse.json({ error: 'Failed to get unanswered questions' }, { status: 500 });
      }

      return NextResponse.json({
        questions: data || [],
        metadata: {
          question_set_slug: questionSetSlug,
          entity_slug: entitySlug,
          unanswered_only: true,
          total_questions: data?.length || 0,
        },
      });
    }

    // Otherwise, get all questions for the set
    const { data: questionSet, error: setError } = await supabase
      .from('question_sets')
      .select('id, slug, name, domain, target, description')
      .eq('slug', questionSetSlug)
      .single();

    if (setError || !questionSet) {
      return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
    }

    // Get questions linked to this set
    const { data: questions, error: questionsError } = await supabase
      .from('question_set_questions')
      .select(
        `
        display_order,
        questions:question_id (
          id,
          slug,
          text,
          question_type,
          category,
          subcategory,
          description,
          options,
          maps_to_output
        )
      `
      )
      .eq('question_set_id', questionSet.id)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Transform the nested data - use 'any' to handle Supabase's dynamic join types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedQuestions = (questions || []).map((q: any) => ({
      ...q.questions,
      display_order: q.display_order,
    }));

    // If entity is provided, also get their existing answers
    let answers: Record<string, unknown> = {};
    if (entitySlug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questionIds = formattedQuestions.map((q: any) => q.id);
      const { data: answerData } = await supabase
        .from('entity_answers')
        .select('question_id, value_text, value_choice, value_numeric, answered')
        .eq('entity_slug', entitySlug)
        .in('question_id', questionIds);

      if (answerData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answers = answerData.reduce((acc: Record<string, unknown>, a: any) => {
          acc[a.question_id] = a;
          return acc;
        }, {});
      }
    }

    return NextResponse.json({
      questions: formattedQuestions,
      answers: entitySlug ? answers : undefined,
      metadata: {
        question_set: questionSet,
        entity_slug: entitySlug || null,
        total_questions: formattedQuestions.length,
      },
    });
  } catch (error) {
    console.error('Error in /api/questions/[questionSetSlug]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
