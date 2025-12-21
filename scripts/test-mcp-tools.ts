/**
 * Test MCP tools against the new database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const USER_ID = 'c553726a-aebe-48ac-a789-2c6a11b8dd0e'; // Justin's user ID

async function main() {
  console.log('Testing MCP tools against NEW database...\n');

  const client = createClient(NEW_URL, NEW_KEY);

  // Test 1: List tasks (simulates list_all_tasks)
  console.log('=== Test 1: List Tasks (todo status) ===');
  const { data: tasks, error: taskErr } = await client
    .schema('founder_os')
    .from('tasks')
    .select('id, title, priority, status, due_date')
    .eq('user_id', USER_ID)
    .eq('status', 'todo')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(5);

  if (taskErr) {
    console.log('  ERROR:', taskErr.message);
  } else {
    console.log(`  Found ${tasks?.length} todo tasks`);
    tasks?.forEach(t => console.log(`    - [${t.priority}] ${t.title}`));
  }

  // Test 2: List projects (simulates list_projects)
  console.log('\n=== Test 2: List Projects ===');
  const { data: projects, error: projErr } = await client
    .schema('founder_os')
    .from('projects')
    .select('id, name, slug, status, priority')
    .eq('user_id', '00000000-0000-0000-0000-000000000001') // Seed data user
    .order('priority', { ascending: true });

  if (projErr) {
    console.log('  ERROR:', projErr.message);
  } else {
    console.log(`  Found ${projects?.length} projects`);
    projects?.forEach(p => console.log(`    - [${p.priority}] ${p.name} (${p.status})`));
  }

  // Test 3: List milestones for Renubu
  console.log('\n=== Test 3: List Milestones (Renubu) ===');
  const { data: milestones, error: msErr } = await client
    .schema('founder_os')
    .from('milestones')
    .select('id, name, status, target_date, order_index, project_id')
    .order('order_index', { ascending: true });

  if (msErr) {
    console.log('  ERROR:', msErr.message);
  } else {
    console.log(`  Found ${milestones?.length} milestones`);
    milestones?.forEach(m => console.log(`    - [${m.status}] ${m.name} (${m.target_date || 'no date'})`));
  }

  // Test 4: Get urgent tasks (simulates get_urgent_tasks)
  console.log('\n=== Test 4: Urgent Tasks ===');
  const today = new Date();
  const { data: urgentTasks, error: urgErr } = await client
    .schema('founder_os')
    .from('tasks')
    .select('id, title, due_date, priority, status')
    .eq('user_id', USER_ID)
    .in('status', ['todo', 'in_progress', 'blocked'])
    .not('due_date', 'is', null)
    .lte('due_date', new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (urgErr) {
    console.log('  ERROR:', urgErr.message);
  } else {
    console.log(`  Found ${urgentTasks?.length} tasks due in next 7 days`);
    urgentTasks?.slice(0, 5).forEach(t => console.log(`    - [${t.due_date}] ${t.title}`));
  }

  // Test 5: List contexts
  console.log('\n=== Test 5: List Contexts ===');
  const { data: contexts, error: ctxErr } = await client
    .schema('founder_os')
    .from('contexts')
    .select('id, name, description, color')
    .eq('user_id', USER_ID);

  if (ctxErr) {
    console.log('  ERROR:', ctxErr.message);
  } else {
    console.log(`  Found ${contexts?.length} contexts`);
    contexts?.forEach(c => console.log(`    - ${c.name}: ${c.description?.substring(0, 50) || 'no description'}`));
  }

  // Test 6: List goals
  console.log('\n=== Test 6: List Goals ===');
  const { data: goals, error: goalErr } = await client
    .schema('founder_os')
    .from('goals')
    .select('id, title, type, timeframe')
    .eq('user_id', USER_ID);

  if (goalErr) {
    console.log('  ERROR:', goalErr.message);
  } else {
    console.log(`  Found ${goals?.length} goals`);
    goals?.slice(0, 5).forEach(g => console.log(`    - [${g.type}/${g.timeframe}] ${g.title}`));
  }

  // Test 7: List relationships
  console.log('\n=== Test 7: List Relationships ===');
  const { data: relationships, error: relErr } = await client
    .schema('founder_os')
    .from('relationships')
    .select('id, name, relationship, last_contact')
    .eq('user_id', USER_ID);

  if (relErr) {
    console.log('  ERROR:', relErr.message);
  } else {
    console.log(`  Found ${relationships?.length} relationships`);
    relationships?.forEach(r => console.log(`    - ${r.name} (${r.relationship})`));
  }

  console.log('\n=== All tests completed! ===');
}

main().catch(console.error);
