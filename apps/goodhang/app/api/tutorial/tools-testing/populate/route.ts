/**
 * POST /api/tutorial/tools-testing/populate
 *
 * Insert confirmed entities into the database:
 * - Tasks -> founder_os.tasks
 * - People -> founder_os.relationships
 * - Projects -> founder_os.projects
 * - Goals -> founder_os.tasks (with context_tag 'goal')
 * - Parking Lot -> founder_os.tasks (with context_tag 'parking_lot' and status 'todo')
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { v4 as uuidv4, validate as isValidUuid } from 'uuid';

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
  brain_dump_text?: string; // Raw brain dump for transcript storage
}

export async function POST(request: NextRequest) {
  const errors: string[] = [];

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
      contexts_added: 0,
      projects_added: 0,
      goals_added: 0,
      parking_lot_items: 0,
      transcript_id: null as string | null,
      entity_ids: [] as string[],
      errors: [] as string[],
    };

    // 0. Create transcript record for the brain dump (if provided)
    let transcriptId: string | null = null;
    if (body.brain_dump_text && isValidUuid(user_id)) {
      const { data: transcript, error: transcriptError } = await supabase
        .schema('founder_os')
        .from('transcripts')
        .insert({
          user_id,
          source: 'brain_dump',
          status: 'completed',
          word_count: body.brain_dump_text.split(/\s+/).length,
          session_id: session_id,
          storage_path: `${user_id}/transcripts/${new Date().toISOString().split('T')[0]}/${session_id}.json`,
          processed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (transcript && !transcriptError) {
        transcriptId = transcript.id;
        results.transcript_id = transcriptId;
        console.log(`[tools-testing/populate] Created transcript ${transcriptId}`);
      } else if (transcriptError) {
        console.warn(`[tools-testing/populate] Failed to create transcript:`, transcriptError);
        // Non-fatal, continue without transcript link
      }
    }

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
          })
          .select('id')
          .single();

        if (!error && data) {
          results.tasks_created++;
          results.entity_ids.push(data.id);
        } else if (error) {
          console.error(`[tools-testing/populate] Task insert error:`, error);
          errors.push(`Task "${task.title}": ${error.message}`);
        }
      }
    }

    // 2. Insert People into founder_os.relationships + add context
    // Note: dream() can later check entities table to map to opportunities and merge contexts
    if (entities.people && entities.people.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.people.length} people to relationships`);

      // Validate user_id is a valid UUID (required for founder_os.relationships)
      if (!isValidUuid(user_id)) {
        console.error(`[tools-testing/populate] user_id "${user_id}" is not a valid UUID, skipping relationships`);
        errors.push(`People: user_id must be a valid UUID (got "${user_id}")`);
      } else {
        for (const person of entities.people) {
          // Check if relationship already exists by name
          const { data: existingRel } = await supabase
            .schema('founder_os')
            .from('relationships')
            .select('id')
            .eq('user_id', user_id)
            .ilike('name', person.name)
            .maybeSingle();

          let relationshipId: string;

          if (existingRel) {
            // Relationship exists - we'll just add context to it
            relationshipId = existingRel.id;
          } else {
            // Create new relationship
            // Map relationship_type to valid values
            const relationshipMap: Record<string, string> = {
              colleague: 'colleague',
              friend: 'friend',
              family: 'family',
              mentor: 'mentor',
              client: 'client',
              partner: 'partner',
              report: 'report',
              vendor: 'vendor',
              investor: 'investor_prospect',
              other: 'other',
            };
            const relationship = relationshipMap[person.relationship_type || 'other'] || 'other';

            const { data, error } = await supabase
              .schema('founder_os')
              .from('relationships')
              .insert({
                user_id,
                name: person.name,
                relationship,
                notes: person.context,
                sentiment: person.confidence >= 0.8 ? 'positive' : 'neutral',
              })
              .select('id')
              .single();

            if (!error && data) {
              relationshipId = data.id;
              results.relationships_created++;
              results.entity_ids.push(data.id);
            } else {
              console.error(`[tools-testing/populate] Relationship insert error:`, error);
              errors.push(`Person "${person.name}": ${error?.message}`);
              continue; // Skip context if relationship creation failed
            }
          }

          // Add context to the relationship_contexts log
          if (person.context) {
            const { error: contextError } = await supabase
              .schema('founder_os')
              .from('relationship_contexts')
              .insert({
                relationship_id: relationshipId,
                context_type: 'general',
                context_details: person.context,
                source: 'brain_dump',
                transcript_id: transcriptId,
              });

            if (!contextError) {
              results.contexts_added++;
            } else {
              console.warn(`[tools-testing/populate] Context insert warning:`, contextError);
              // Non-fatal - relationship was still created
            }
          }
        }
      }
    }

    // 3. Projects - match existing or insert if user has none
    if (entities.projects && entities.projects.length > 0) {
      console.log(`[tools-testing/populate] Processing ${entities.projects.length} projects`);

      // Get ALL existing projects for this user
      const { data: allUserProjects, error: projQueryError } = await supabase
        .schema('founder_os')
        .from('projects')
        .select('id, name, slug')
        .eq('user_id', user_id);

      if (projQueryError) {
        console.error(`[tools-testing/populate] Failed to query projects:`, projQueryError);
        errors.push(`Projects query failed: ${projQueryError.message}`);
      } else {
        const existingProjects = allUserProjects || [];
        console.log(`[tools-testing/populate] User has ${existingProjects.length} existing projects`);

        // Build lookup maps for matching
        const bySlug = new Map(existingProjects.map((p) => [p.slug, p]));
        const byNameLower = new Map(existingProjects.map((p) => [p.name.toLowerCase(), p]));

        for (const project of entities.projects) {
          const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const nameLower = project.name.toLowerCase();

          // Try to match existing project by slug or name
          let matchedProject = bySlug.get(slug) || byNameLower.get(nameLower);

          // Also try partial match if no exact match
          if (!matchedProject) {
            for (const existing of existingProjects) {
              if (
                existing.name.toLowerCase().includes(nameLower) ||
                nameLower.includes(existing.name.toLowerCase())
              ) {
                matchedProject = existing;
                break;
              }
            }
          }

          if (matchedProject) {
            // Existing project - add context only
            console.log(`[tools-testing/populate] Matched "${project.name}" to existing "${matchedProject.name}"`);
            if (project.description) {
              const { error: contextError } = await supabase
                .schema('founder_os')
                .from('project_contexts')
                .insert({
                  project_id: matchedProject.id,
                  context_type: 'general',
                  context_details: project.description,
                  source: 'brain_dump',
                  transcript_id: transcriptId,
                });

              if (!contextError) {
                results.contexts_added++;
              } else {
                console.warn(`[tools-testing/populate] Project context warning:`, contextError);
              }
            }
          } else if (existingProjects.length === 0) {
            // Only insert new projects if user has ZERO projects
            const statusMap: Record<string, string> = {
              active: 'active',
              planning: 'planning',
              on_hold: 'on_hold',
              completed: 'completed',
            };
            const status = statusMap[project.status] || 'active';

            const { data, error } = await supabase
              .schema('founder_os')
              .from('projects')
              .insert({
                user_id,
                name: project.name,
                slug,
                description: project.description,
                status,
                metadata: { source: 'tutorial_brain_dump' },
              })
              .select('id')
              .single();

            if (!error && data) {
              results.projects_added++;
              results.entity_ids.push(data.id);
              // Add to lookup so subsequent projects in same batch can match
              existingProjects.push({ id: data.id, name: project.name, slug });
              bySlug.set(slug, { id: data.id, name: project.name, slug });
              byNameLower.set(nameLower, { id: data.id, name: project.name, slug });
            } else if (error) {
              console.error(`[tools-testing/populate] Project insert error:`, error);
              errors.push(`Project "${project.name}": ${error.message}`);
            }
          } else {
            // User has projects but no match - capture as a task with potential_project tag
            console.log(`[tools-testing/populate] No match for "${project.name}", creating task`);
            const { data: taskData, error: taskError } = await supabase
              .schema('founder_os')
              .from('tasks')
              .insert({
                user_id,
                title: `Project idea: ${project.name}`,
                description: project.description || null,
                priority: 'medium',
                context_tags: ['potential_project'],
                status: 'todo',
              })
              .select('id')
              .single();

            if (!taskError && taskData) {
              results.tasks_created++;
              results.entity_ids.push(taskData.id);
            } else if (taskError) {
              console.warn(`[tools-testing/populate] Failed to create task for unmatched project:`, taskError);
            }
          }
        }
      }
    }

    // 4. Insert Goals as tasks with 'goal' context_tag
    if (entities.goals && entities.goals.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.goals.length} goals as tasks`);

      for (const goal of entities.goals) {
        const tags = ['goal'];
        if (goal.timeframe) {
          tags.push(goal.timeframe.replace(/\s+/g, '_'));
        }

        const { data, error } = await supabase
          .schema('founder_os')
          .from('tasks')
          .insert({
            user_id,
            title: goal.title,
            description: goal.timeframe ? `Timeframe: ${goal.timeframe}` : null,
            priority: 'medium',
            context_tags: tags,
            status: 'todo',
          })
          .select('id')
          .single();

        if (!error && data) {
          results.goals_added++;
          results.entity_ids.push(data.id);
        } else if (error) {
          console.error(`[tools-testing/populate] Goal insert error:`, error);
          errors.push(`Goal "${goal.title}": ${error.message}`);
        }
      }
    }

    // 5. Insert Parking Lot items as tasks with 'parking_lot' tag
    if (entities.parking_lot && entities.parking_lot.length > 0) {
      console.log(`[tools-testing/populate] Adding ${entities.parking_lot.length} parking lot items as tasks`);

      for (const item of entities.parking_lot) {
        const tags = ['parking_lot', item.capture_mode];

        const { data, error } = await supabase
          .schema('founder_os')
          .from('tasks')
          .insert({
            user_id,
            title: item.cleaned_text.substring(0, 200), // Title has max length
            description: item.raw_input !== item.cleaned_text ? `Original: ${item.raw_input}` : null,
            priority: 'low',
            context_tags: tags,
            status: 'todo',
          })
          .select('id')
          .single();

        if (!error && data) {
          results.parking_lot_items++;
          results.entity_ids.push(data.id);
        } else if (error) {
          console.error(`[tools-testing/populate] Parking lot insert error:`, error);
          errors.push(`Parking lot: ${error.message}`);
        }
      }
    }

    results.errors = errors;
    console.log(`[tools-testing/populate] Complete:`, results);

    return NextResponse.json(results, { headers: corsHeaders });
  } catch (error) {
    console.error('[tools-testing/populate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: corsHeaders }
    );
  }
}
