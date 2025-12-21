/**
 * Compare founder_os schema between old and new databases
 *
 * OLD DB (dokaliwfnptcwhywjltp): Uses PUBLIC schema with founder_ prefixed tables
 * NEW DB (zulowgscotdrqlccomht): Uses FOUNDER_OS schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env
config();

// Old database (Founder OS project) - uses PUBLIC schema
const OLD_URL = 'https://dokaliwfnptcwhywjltp.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRva2FsaXdmbnB0Y3doeXdqbHRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNjc2OCwiZXhwIjoyMDc5NDAyNzY4fQ.5CHb_R02BTjizZ5A0Xw-RwVmpBBqyHO2SSTWFp2zckU';

// New database (human project) - uses FOUNDER_OS schema
const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Table mapping: OLD (public.founder_*) -> NEW (founder_os.*)
const TABLE_MAPPING = [
  { oldTable: 'founder_contexts', newTable: 'contexts' },
  { oldTable: 'founder_goals', newTable: 'goals' },
  { oldTable: 'founder_tasks', newTable: 'tasks' },
  { oldTable: 'founder_task_goal_links', newTable: 'task_goal_links' },
  { oldTable: 'founder_daily_plans', newTable: 'daily_plans' },
  { oldTable: 'founder_relationships', newTable: 'relationships' },
  { oldTable: 'founder_check_ins', newTable: 'check_ins' },
  { oldTable: 'founder_claude_queue', newTable: 'claude_queue' },
  // New tables (may not exist in old DB)
  { oldTable: 'founder_projects', newTable: 'projects' },
  { oldTable: 'founder_milestones', newTable: 'milestones' },
  { oldTable: 'founder_project_members', newTable: 'project_members' },
  { oldTable: 'founder_project_links', newTable: 'project_links' },
];

interface TableResult {
  count: number;
  data?: unknown[];
  error?: string;
}

async function getTableData(
  client: ReturnType<typeof createClient>,
  schema: string,
  table: string
): Promise<TableResult> {
  try {
    const query = schema === 'public'
      ? client.from(table)
      : client.schema(schema).from(table);

    const { data, error, count } = await query
      .select('*', { count: 'exact', head: false });

    if (error) {
      return { count: 0, error: error.message };
    }
    return {
      count: count ?? data?.length ?? 0,
      data: data ?? []
    };
  } catch (e) {
    return { count: 0, error: String(e) };
  }
}

async function main() {
  console.log('Comparing OLD (public) vs NEW (founder_os) databases...\n');

  // Create clients
  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  console.log('Fetching data from both databases...\n');

  // Print comparison
  console.log('=== FOUNDER_OS MIGRATION STATUS ===\n');
  console.log('OLD Table (public)       | NEW Table (founder_os)   | OLD  | NEW  | Status');
  console.log('-------------------------|--------------------------|------|------|--------');

  const needsMigration: Array<{ oldTable: string; newTable: string; oldData: unknown[] }> = [];

  for (const { oldTable, newTable } of TABLE_MAPPING) {
    const oldResult = await getTableData(oldClient, 'public', oldTable);
    const newResult = await getTableData(newClient, 'founder_os', newTable);

    const oldStr = oldResult.error ? ' ERR' : String(oldResult.count).padStart(4);
    const newStr = newResult.error ? ' ERR' : String(newResult.count).padStart(4);

    let status = '';
    if (oldResult.error && !oldResult.error.includes('does not exist')) {
      status = `OLD ERR`;
    } else if (newResult.error) {
      status = `NEW ERR: ${newResult.error.substring(0, 20)}`;
    } else if (oldResult.count === 0 && newResult.count === 0) {
      status = 'EMPTY';
    } else if (oldResult.count > 0 && newResult.count === 0) {
      status = 'NEEDS MIGRATION';
      needsMigration.push({ oldTable, newTable, oldData: oldResult.data! });
    } else if (oldResult.count === 0 && newResult.count > 0) {
      status = 'NEW ONLY';
    } else if (oldResult.count === newResult.count) {
      status = 'COUNTS MATCH';
    } else if (oldResult.count > newResult.count) {
      status = 'OLD HAS MORE';
      needsMigration.push({ oldTable, newTable, oldData: oldResult.data! });
    } else {
      status = 'NEW HAS MORE';
    }

    console.log(`${oldTable.padEnd(24)} | ${newTable.padEnd(24)} | ${oldStr} | ${newStr} | ${status}`);
  }

  // Show migration details
  if (needsMigration.length > 0) {
    console.log('\n=== TABLES NEEDING MIGRATION ===\n');
    for (const { oldTable, newTable, oldData } of needsMigration) {
      console.log(`${oldTable} -> ${newTable} (${oldData.length} rows)`);
      if (oldData.length > 0) {
        console.log('  Sample:', JSON.stringify(oldData[0], null, 2).substring(0, 400));
      }
      console.log('');
    }
  } else {
    console.log('\n✓ No migration needed - all data is in the new database!\n');
  }

  console.log('Done!');
}

main().catch(console.error);
