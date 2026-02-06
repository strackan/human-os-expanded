/**
 * GET /api/tutorial/tools-testing/verify
 *
 * Verify that entities were inserted correctly and return dashboard data.
 * Uses actual database schema:
 * - founder_os.tasks (including goals with 'goal' tag and parking_lot items with 'parking_lot' tag)
 * - founder_os.projects
 * - public.entities (for people)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');

    // Validate required fields
    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'session_id and user_id are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[tools-testing/verify] Verifying data for session ${sessionId}, user ${userId}`);

    // Use service client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Gather verification data in parallel
    const [tasksResult, peopleResult, projectsResult, goalsResult, parkingLotResult] = await Promise.all([
      // 1. Tasks (excluding goals and parking lot)
      (async () => {
        const { data: allTasks, count } = await supabase
          .schema('founder_os')
          .from('tasks')
          .select('id, title, due_date, priority, status, context_tags', { count: 'exact' })
          .eq('user_id', userId)
          .in('status', ['todo', 'in_progress'])
          .not('context_tags', 'cs', '{"goal"}')
          .not('context_tags', 'cs', '{"parking_lot"}')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(10);

        // Filter for urgent tasks (due today or overdue)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const urgent = (allTasks || []).filter((t) => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= today;
        });

        return {
          count: count || 0,
          urgent,
          preview: allTasks || [],
        };
      })(),

      // 2. Relationships (from founder_os.relationships)
      (async () => {
        const { data: relationships, count } = await supabase
          .schema('founder_os')
          .from('relationships')
          .select('id, name, relationship_type', { count: 'exact' })
          .eq('user_id', userId)
          .limit(10);

        return {
          count: count || 0,
          names: (relationships || []).map((r) => r.name),
        };
      })(),

      // 3. Projects from founder_os.projects
      (async () => {
        const { data: projects, count } = await supabase
          .schema('founder_os')
          .from('projects')
          .select('id, name, status', { count: 'exact' })
          .eq('user_id', userId)
          .in('status', ['active', 'planning'])
          .limit(10);

        return {
          count: count || 0,
          items: (projects || []).map((p) => p.name),
        };
      })(),

      // 4. Goals (tasks with 'goal' tag)
      (async () => {
        const { data: goals, count } = await supabase
          .schema('founder_os')
          .from('tasks')
          .select('id, title, context_tags', { count: 'exact' })
          .eq('user_id', userId)
          .contains('context_tags', ['goal'])
          .in('status', ['todo', 'in_progress'])
          .limit(10);

        return {
          count: count || 0,
          items: (goals || []).map((g) => g.title),
        };
      })(),

      // 5. Parking Lot (tasks with 'parking_lot' tag)
      (async () => {
        const { data: items, count } = await supabase
          .schema('founder_os')
          .from('tasks')
          .select('id, title, context_tags', { count: 'exact' })
          .eq('user_id', userId)
          .contains('context_tags', ['parking_lot'])
          .order('created_at', { ascending: false })
          .limit(10);

        return {
          count: count || 0,
          items: (items || []).map((i) => i.title),
        };
      })(),
    ]);

    const result = {
      tasks: tasksResult,
      relationships: peopleResult, // Keep name for backward compat
      work_context: {
        projects: projectsResult.items,
        goals: goalsResult.items,
      },
      parking_lot: parkingLotResult,
    };

    console.log(`[tools-testing/verify] Verification complete:`, {
      tasks: result.tasks.count,
      people: result.relationships.count,
      projects: projectsResult.count,
      goals: goalsResult.count,
      parking_lot: result.parking_lot.count,
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('[tools-testing/verify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
