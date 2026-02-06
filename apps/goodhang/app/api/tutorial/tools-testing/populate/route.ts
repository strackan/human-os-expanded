/**
 * POST /api/tutorial/tools-testing/populate
 *
 * Insert confirmed entities into the database:
 * - Tasks -> founder_os.tasks
 * - People -> entities + human_os.relationships
 * - Projects -> user_work_context (context_type: 'active_projects')
 * - Goals -> user_work_context (context_type: 'goals')
 * - Parking Lot -> parking_lot_items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface ExtractedPerson {
  name: string;
  relationship_type?: string;
  context: string;
  confidence: number;
}

interface ExtractedTask {
  title: string;
  description?: string;
  due_date?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  context_tags: string[];
}

interface ExtractedProject {
  name: string;
  description: string;
  status: string;
}

interface ExtractedGoal {
  title: string;
  timeframe?: string;
}

interface ExtractedParkingLot {
  raw_input: string;
  cleaned_text: string;
  capture_mode: 'project' | 'brainstorm' | 'expand' | 'passive';
}

interface PopulateRequest {
  entities: {
    people: ExtractedPerson[];
    tasks: ExtractedTask[];
    projects: ExtractedProject[];
    goals: ExtractedGoal[];
    parking_lot: ExtractedParkingLot[];
  };
  session_id: string;
  user_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PopulateRequest = await request.json();
    const { entities, session_id, user_id } = body;

    // Validate required fields
    if (!entities || !session_id || !user_id) {
      return NextResponse.json(
        { error: 'entities, session_id, and user_id are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[tools-testing/populate] Populating entities for session ${session_id}, user ${user_id}`);

    // Use service client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = {
      tasks_created: 0,
      relationships_created: 0,
      projects_added: 0,
      goals_added: 0,
      parking_lot_items: 0,
      entity_ids: [] as string[],
    };

    // 1. Insert Tasks into founder_os.tasks
    if (entities.tasks && entities.tasks.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.tasks.length} tasks`);

      for (const task of entities.tasks) {
        const { data, error } = await supabase
          .schema('founder_os')
          .from('tasks')
          .insert({
            user_id,
            title: task.title,
            description: task.description || null,
            due_date: task.due_date || null,
            priority: task.priority || 'medium',
            context_tags: task.context_tags || [],
            status: 'todo',
            source: 'tutorial_brain_dump',
          })
          .select('id')
          .single();

        if (!error && data) {
          results.tasks_created++;
          results.entity_ids.push(data.id);
        } else if (error) {
          console.error(`[tools-testing/populate] Task insert error:`, error);
        }
      }
    }

    // 2. Insert People into entities + create relationships
    if (entities.people && entities.people.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.people.length} people`);

      for (const person of entities.people) {
        // First, find or create the entity
        const { data: existingEntity } = await supabase
          .from('entities')
          .select('id')
          .eq('owner_id', user_id)
          .eq('entity_type', 'person')
          .ilike('name', person.name)
          .single();

        let entityId = existingEntity?.id;

        if (!entityId) {
          // Create new entity
          const { data: newEntity, error: entityError } = await supabase
            .from('entities')
            .insert({
              id: uuidv4(),
              entity_type: 'person',
              name: person.name,
              metadata: {
                relationship_type: person.relationship_type,
                context: person.context,
                confidence: person.confidence,
              },
              source_system: 'tutorial_brain_dump',
              owner_id: user_id,
              privacy_scope: 'private',
            })
            .select('id')
            .single();

          if (!entityError && newEntity) {
            entityId = newEntity.id;
            results.entity_ids.push(entityId);
          } else if (entityError) {
            console.error(`[tools-testing/populate] Entity insert error:`, entityError);
            continue;
          }
        }

        // Create relationship in human_os.relationships
        if (entityId) {
          const { error: relError } = await supabase
            .schema('human_os')
            .from('relationships')
            .insert({
              id: uuidv4(),
              user_id,
              entity_id: entityId,
              relationship_type: person.relationship_type || 'other',
              context: person.context,
              strength: Math.round(person.confidence * 10), // Convert 0-1 to 0-10
              status: 'active',
              source: 'tutorial_brain_dump',
            });

          if (!relError) {
            results.relationships_created++;
          } else {
            console.error(`[tools-testing/populate] Relationship insert error:`, relError);
          }
        }
      }
    }

    // 3. Insert Projects into user_work_context
    if (entities.projects && entities.projects.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.projects.length} projects`);

      // Get existing work context or create new
      const { data: existingContext } = await supabase
        .from('user_work_context')
        .select('id, data')
        .eq('user_id', user_id)
        .eq('context_type', 'active_projects')
        .single();

      const existingProjects = existingContext?.data?.projects || [];
      const newProjects = entities.projects.map((p) => ({
        name: p.name,
        description: p.description,
        status: p.status,
        added_at: new Date().toISOString(),
        source: 'tutorial_brain_dump',
      }));

      const mergedProjects = [...existingProjects, ...newProjects];

      if (existingContext) {
        await supabase
          .from('user_work_context')
          .update({
            data: { projects: mergedProjects },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContext.id);
      } else {
        await supabase
          .from('user_work_context')
          .insert({
            user_id,
            context_type: 'active_projects',
            data: { projects: mergedProjects },
          });
      }

      results.projects_added = entities.projects.length;
    }

    // 4. Insert Goals into user_work_context
    if (entities.goals && entities.goals.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.goals.length} goals`);

      const { data: existingContext } = await supabase
        .from('user_work_context')
        .select('id, data')
        .eq('user_id', user_id)
        .eq('context_type', 'goals')
        .single();

      const existingGoals = existingContext?.data?.goals || [];
      const newGoals = entities.goals.map((g) => ({
        title: g.title,
        timeframe: g.timeframe || null,
        added_at: new Date().toISOString(),
        source: 'tutorial_brain_dump',
      }));

      const mergedGoals = [...existingGoals, ...newGoals];

      if (existingContext) {
        await supabase
          .from('user_work_context')
          .update({
            data: { goals: mergedGoals },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContext.id);
      } else {
        await supabase
          .from('user_work_context')
          .insert({
            user_id,
            context_type: 'goals',
            data: { goals: mergedGoals },
          });
      }

      results.goals_added = entities.goals.length;
    }

    // 5. Insert Parking Lot items
    if (entities.parking_lot && entities.parking_lot.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.parking_lot.length} parking lot items`);

      for (const item of entities.parking_lot) {
        const { error } = await supabase
          .from('parking_lot_items')
          .insert({
            user_id,
            raw_input: item.raw_input,
            cleaned_text: item.cleaned_text,
            capture_mode: item.capture_mode,
            status: 'captured',
            source: 'tutorial_brain_dump',
          });

        if (!error) {
          results.parking_lot_items++;
        } else {
          console.error(`[tools-testing/populate] Parking lot insert error:`, error);
        }
      }
    }

    console.log(`[tools-testing/populate] Complete:`, results);

    return NextResponse.json(results, { headers: corsHeaders });
  } catch (error) {
    console.error('[tools-testing/populate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
