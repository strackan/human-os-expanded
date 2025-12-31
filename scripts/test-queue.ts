/**
 * Test script for queue processing
 * Adds different types of queue items and processes them
 */

import { createClient } from '@supabase/supabase-js';
import { QueueService, type ServiceContext } from '../packages/services/src/index.js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Justin's user UUID from the users table
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const ctx: ServiceContext = {
    supabase,
    userId: TEST_USER_ID,
    layer: 'founder:justin',
  };

  console.log('=== Testing Queue System ===\n');

  // 1. Add a task item
  console.log('1. Adding task to queue...');
  const taskResult = await QueueService.add(ctx, {
    intent_type: 'task',
    payload: {
      title: 'Review Q1 metrics dashboard',
      priority: 'high',
      context_tags: ['renubu', 'metrics'],
      description: 'Check the new metrics dashboard and verify data accuracy',
    },
    notes: 'Added via test script',
    session_id: `test-${Date.now()}`,
  });
  console.log('   Task result:', taskResult);

  // 2. Add a note item with content in payload
  console.log('\n2. Adding note (payload.content) to queue...');
  const noteResult = await QueueService.add(ctx, {
    intent_type: 'note',
    payload: {
      content: 'Had a great call with the Acme team - they are interested in enterprise features',
      interaction_type: 'note',
    },
    session_id: `test-${Date.now()}`,
  });
  console.log('   Note result:', noteResult);

  // 3. Add a note item with content in notes field (testing fallback)
  console.log('\n3. Adding note (notes field fallback) to queue...');
  const noteFallbackResult = await QueueService.add(ctx, {
    intent_type: 'note',
    payload: {},
    notes: 'Quick thought: need to follow up with Sarah about the partnership proposal',
    session_id: `test-${Date.now()}`,
  });
  console.log('   Note fallback result:', noteFallbackResult);

  // 4. Add a decision item
  console.log('\n4. Adding decision to queue...');
  const decisionResult = await QueueService.add(ctx, {
    intent_type: 'decision',
    payload: {
      decision: 'Approved the new pricing tier structure',
      context: 'After reviewing competitor analysis and customer feedback',
      outcome: 'Will implement in next sprint',
    },
    session_id: `test-${Date.now()}`,
  });
  console.log('   Decision result:', decisionResult);

  // 5. Check pending items
  console.log('\n5. Checking pending items...');
  const pending = await QueueService.getPending(ctx);
  console.log(`   Found ${pending.data?.length || 0} pending items`);

  // 6. Process all pending items
  console.log('\n6. Processing all pending items...');
  const processResult = await QueueService.processAll(ctx);
  console.log('   Process result:', {
    processed: processResult.processed,
    skipped: processResult.skipped,
    failed: processResult.failed.length,
    summary: processResult.summary,
  });

  if (processResult.failed.length > 0) {
    console.log('\n   Failed items:');
    for (const item of processResult.failed) {
      console.log(`   - ${item.intent_type}: ${item.error}`);
    }
  }

  // 7. Verify tasks were created
  console.log('\n7. Verifying created task...');
  const { data: tasks } = await supabase
    .schema('founder_os')
    .from('tasks')
    .select('id, title, priority, description, created_at')
    .eq('title', 'Review Q1 metrics dashboard')
    .order('created_at', { ascending: false })
    .limit(1);

  if (tasks && tasks.length > 0) {
    console.log('   Task created successfully:', tasks[0]);
  } else {
    console.log('   WARNING: Task not found!');
  }

  // 8. Verify interactions were created
  console.log('\n8. Verifying created interactions...');
  const { data: interactions } = await supabase
    .from('interactions')
    .select('id, interaction_type, summary, created_at')
    .eq('owner_id', TEST_USER_ID)
    .order('created_at', { ascending: false })
    .limit(3);

  if (interactions && interactions.length > 0) {
    console.log('   Recent interactions:');
    for (const int of interactions) {
      console.log(`   - [${int.interaction_type}] ${int.summary?.substring(0, 60)}...`);
    }
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
