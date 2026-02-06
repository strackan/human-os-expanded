/**
 * GET /api/tutorial/tools-testing/verify
 *
 * Verify that entities were inserted correctly and return dashboard data.
 * Returns counts and previews of tasks, relationships, work context, and parking lot items.
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
    const [tasksResult, relationshipsResult, workContextResult, parkingLotResult] = await Promise.all([
      // 1. Tasks - get count, urgent, and preview
      (async () => {
        // Get all active tasks
        const { data: allTasks, count } = await supabase
          .schema('founder_os')
          .from('tasks')
          .select('id, title, due_date, priority, status', { count: 'exact' })
          .eq('user_id', userId)
          .in('status', ['todo', 'in_progress'])
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

      // 2. Relationships - get count and names
      (async () => {
        const { data: relationships, count } = await supabase
          .schema('human_os')
          .from('relationships')
          .select('entity_id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Get entity names for the relationships
        const entityIds = (relationships || []).map((r) => r.entity_id);
        let names: string[] = [];

        if (entityIds.length > 0) {
          const { data: entities } = await supabase
            .from('entities')
            .select('name')
            .in('id', entityIds);

          names = (entities || []).map((e) => e.name);
        }

        return {
          count: count || 0,
          names,
        };
      })(),

      // 3. Work Context - get projects and goals
      (async () => {
        const { data: contexts } = await supabase
          .from('user_work_context')
          .select('context_type, data')
          .eq('user_id', userId)
          .in('context_type', ['active_projects', 'goals']);

        const projects: string[] = [];
        const goals: string[] = [];

        for (const ctx of contexts || []) {
          if (ctx.context_type === 'active_projects' && ctx.data?.projects) {
            for (const p of ctx.data.projects) {
              projects.push(p.name);
            }
          }
          if (ctx.context_type === 'goals' && ctx.data?.goals) {
            for (const g of ctx.data.goals) {
              goals.push(g.title);
            }
          }
        }

        return { projects, goals };
      })(),

      // 4. Parking Lot - get count and items
      (async () => {
        const { data: items, count } = await supabase
          .from('parking_lot_items')
          .select('cleaned_text', { count: 'exact' })
          .eq('user_id', userId)
          .eq('status', 'captured')
          .order('created_at', { ascending: false })
          .limit(10);

        return {
          count: count || 0,
          items: (items || []).map((i) => i.cleaned_text),
        };
      })(),
    ]);

    const result = {
      tasks: tasksResult,
      relationships: relationshipsResult,
      work_context: workContextResult,
      parking_lot: parkingLotResult,
    };

    console.log(`[tools-testing/verify] Verification complete:`, {
      tasks: result.tasks.count,
      relationships: result.relationships.count,
      projects: result.work_context.projects.length,
      goals: result.work_context.goals.length,
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
