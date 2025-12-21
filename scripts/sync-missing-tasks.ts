/**
 * Find and sync missing tasks from OLD to NEW database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const OLD_URL = 'https://dokaliwfnptcwhywjltp.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRva2FsaXdmbnB0Y3doeXdqbHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNjc2OCwiZXhwIjoyMDc5NDAyNzY4fQ.5CHb_R02BTjizZ5A0Xw-RwVmpBBqyHO2SSTWFp2zckU';

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  // Get all task IDs from both databases
  console.log('Fetching task IDs from OLD database...');
  const { data: oldTasks, error: oldErr } = await oldClient
    .from('founder_tasks')
    .select('id, title, created_at');

  if (oldErr) {
    console.error('Error fetching old tasks:', oldErr);
    return;
  }

  console.log('Fetching task IDs from NEW database...');
  const { data: newTasks, error: newErr } = await newClient
    .schema('founder_os')
    .from('tasks')
    .select('id');

  if (newErr) {
    console.error('Error fetching new tasks:', newErr);
    return;
  }

  const oldIds = new Set(oldTasks?.map(t => t.id) ?? []);
  const newIds = new Set(newTasks?.map(t => t.id) ?? []);

  // Find IDs in OLD but not in NEW
  const missingIds: string[] = [];
  for (const id of oldIds) {
    if (!newIds.has(id)) {
      missingIds.push(id);
    }
  }

  console.log(`\nOLD has ${oldIds.size} tasks`);
  console.log(`NEW has ${newIds.size} tasks`);
  console.log(`Missing in NEW: ${missingIds.length} tasks\n`);

  if (missingIds.length === 0) {
    console.log('No missing tasks!');
    return;
  }

  // Get full details of missing tasks
  console.log('Missing tasks:');
  for (const id of missingIds) {
    const task = oldTasks?.find(t => t.id === id);
    console.log(`  - ${id}: ${task?.title} (created: ${task?.created_at})`);
  }

  // Fetch full task data for migration
  console.log('\nFetching full task data for migration...');
  const { data: fullTasks, error: fetchErr } = await oldClient
    .from('founder_tasks')
    .select('*')
    .in('id', missingIds);

  if (fetchErr) {
    console.error('Error fetching full tasks:', fetchErr);
    return;
  }

  console.log('\nFull task data:');
  console.log(JSON.stringify(fullTasks, null, 2));

  // Ask for confirmation
  console.log('\n--- To sync these tasks to the new database, run with --sync flag ---');

  if (process.argv.includes('--sync')) {
    console.log('\nSyncing tasks to NEW database...');

    // Remove any columns that don't exist in new schema
    const tasksToInsert = fullTasks?.map(task => {
      // The new schema has project_id and milestone_id columns
      // but they should be null for migrated tasks
      return {
        ...task,
        project_id: null,
        milestone_id: null,
      };
    });

    const { data: inserted, error: insertErr } = await newClient
      .schema('founder_os')
      .from('tasks')
      .insert(tasksToInsert!)
      .select();

    if (insertErr) {
      console.error('Error inserting tasks:', insertErr);
      return;
    }

    console.log(`Successfully synced ${inserted?.length} tasks!`);
  }
}

main().catch(console.error);
