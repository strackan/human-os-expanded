/**
 * Test script for queue processing
 * Adds different types of queue items and processes them
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Justin's user UUID from the users table
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const FOUNDER_OS_SCHEMA = 'founder_os';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addQueueItem(intentType, payload, notes) {
  const { data, error } = await supabase
    .schema(FOUNDER_OS_SCHEMA)
    .from('claude_queue')
    .insert({
      user_id: TEST_USER_ID,
      intent_type: intentType,
      payload: payload,
      notes: notes || null,
      session_id: `test-${Date.now()}`,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to queue: ${error.message}`);
  return data;
}

async function processQueue() {
  // Get pending items
  const { data: pending, error: fetchError } = await supabase
    .schema(FOUNDER_OS_SCHEMA)
    .from('claude_queue')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (fetchError) throw new Error(`Failed to fetch: ${fetchError.message}`);

  const results = { processed: 0, failed: [] };

  for (const item of pending || []) {
    try {
      await routeAndInsert(item);
      await markProcessed(item.id);
      results.processed++;
    } catch (err) {
      await markFailed(item.id, err.message);
      results.failed.push({ id: item.id, type: item.intent_type, error: err.message });
    }
  }

  return results;
}

async function routeAndInsert(item) {
  const payload = item.payload || {};

  switch (item.intent_type) {
    case 'task': {
      if (!payload.title) throw new Error('Task requires a title');

      const { error } = await supabase
        .schema(FOUNDER_OS_SCHEMA)
        .from('tasks')
        .insert({
          user_id: item.user_id,
          title: payload.title,
          context_tags: payload.context_tags || [],
          priority: payload.priority || 'medium',
          due_date: payload.due_date || null,
          description: payload.description || payload.notes || item.notes || null,
          status: 'todo',
        });

      if (error) throw new Error(`Failed to create task: ${error.message}`);
      break;
    }

    case 'note':
    case 'event': {
      const content = payload.content || item.notes;
      if (!content) throw new Error('Note/event requires content');

      const { error } = await supabase.from('interactions').insert({
        owner_id: item.user_id,
        layer: 'founder:justin',
        interaction_type: payload.interaction_type || 'note',
        content: content,
        occurred_at: payload.occurred_at || new Date().toISOString(),
        sentiment: payload.sentiment || null,
      });

      if (error) throw new Error(`Failed to create interaction: ${error.message}`);
      break;
    }

    case 'decision': {
      if (!payload.decision) throw new Error('Decision requires a decision field');

      const decisionContent = `Decision: ${payload.decision}${
        payload.context ? ` (Context: ${payload.context})` : ''
      }${payload.outcome ? ` → Outcome: ${payload.outcome}` : ''}`;

      const { error } = await supabase.from('interactions').insert({
        owner_id: item.user_id,
        layer: 'founder:justin',
        interaction_type: 'note',
        content: decisionContent,
        occurred_at: new Date().toISOString(),
      });

      if (error) throw new Error(`Failed to log decision: ${error.message}`);
      break;
    }

    default:
      throw new Error(`Unknown intent_type: ${item.intent_type}`);
  }
}

async function markProcessed(itemId) {
  await supabase
    .schema(FOUNDER_OS_SCHEMA)
    .from('claude_queue')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('id', itemId);
}

async function markFailed(itemId, errorMessage) {
  await supabase
    .schema(FOUNDER_OS_SCHEMA)
    .from('claude_queue')
    .update({ status: 'failed', error_message: errorMessage, processed_at: new Date().toISOString() })
    .eq('id', itemId);
}

async function main() {
  console.log('=== Testing Queue System ===\n');

  // 1. Add a task item
  console.log('1. Adding task to queue...');
  const task = await addQueueItem('task', {
    title: 'Review Q1 metrics dashboard',
    priority: 'high',
    context_tags: ['renubu', 'metrics'],
    description: 'Check the new metrics dashboard and verify data accuracy',
  });
  console.log('   Queued task:', task.id);

  // 2. Add a note item with content in payload
  console.log('2. Adding note (payload.content) to queue...');
  const note1 = await addQueueItem('note', {
    content: 'Had a great call with the Acme team - they are interested in enterprise features',
    interaction_type: 'note',
  });
  console.log('   Queued note:', note1.id);

  // 3. Add a note item with content in notes field (testing fallback)
  console.log('3. Adding note (notes field fallback) to queue...');
  const note2 = await addQueueItem('note', {}, 'Quick thought: need to follow up with Sarah about the partnership proposal');
  console.log('   Queued note:', note2.id);

  // 4. Add a decision item
  console.log('4. Adding decision to queue...');
  const decision = await addQueueItem('decision', {
    decision: 'Approved the new pricing tier structure',
    context: 'After reviewing competitor analysis and customer feedback',
    outcome: 'Will implement in next sprint',
  });
  console.log('   Queued decision:', decision.id);

  // 5. Process all pending items
  console.log('\n5. Processing all pending items...');
  const results = await processQueue();
  console.log('   Processed:', results.processed);
  console.log('   Failed:', results.failed.length);

  if (results.failed.length > 0) {
    console.log('\n   Failed items:');
    for (const item of results.failed) {
      console.log(`   - [${item.type}] ${item.error}`);
    }
  }

  // 6. Verify task was created
  console.log('\n6. Verifying created task...');
  const { data: tasks } = await supabase
    .schema(FOUNDER_OS_SCHEMA)
    .from('tasks')
    .select('id, title, priority, description')
    .eq('title', 'Review Q1 metrics dashboard')
    .order('created_at', { ascending: false })
    .limit(1);

  if (tasks?.length > 0) {
    console.log('   Task created:', tasks[0].title);
  } else {
    console.log('   WARNING: Task not found!');
  }

  // 7. Verify interactions were created
  console.log('\n7. Verifying created interactions...');
  const { data: interactions } = await supabase
    .from('interactions')
    .select('id, interaction_type, content')
    .eq('owner_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(3);

  if (interactions?.length > 0) {
    console.log('   Recent interactions:');
    for (const int of interactions) {
      console.log(`   - [${int.interaction_type}] ${int.content?.substring(0, 50)}...`);
    }
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
