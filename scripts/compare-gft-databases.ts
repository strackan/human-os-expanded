/**
 * Compare GFT (Guy For That) schema between old and new databases
 *
 * OLD DB (assxvqtqjinoagwcpxpo): Uses PUBLIC schema
 * NEW DB (zulowgscotdrqlccomht): Uses GFT schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// Old GFT database - uses PUBLIC schema
const OLD_URL = 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3h2cXRxamlub2Fnd2NweHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxOTMzNCwiZXhwIjoyMDc0Mjk1MzM0fQ.gNQ-Puth3WfHahtGu8lSoP4jh_3LTBljyEd3Ki_S7Rw';

// New database (human project) - uses GFT schema
const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TableResult {
  count: number;
  data?: unknown[];
  columns?: string[];
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
      .select('*', { count: 'exact', head: false })
      .limit(100);

    if (error) {
      return { count: 0, error: error.message };
    }

    // Get column names from first row
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    return {
      count: count ?? data?.length ?? 0,
      data: data ?? [],
      columns
    };
  } catch (e) {
    return { count: 0, error: String(e) };
  }
}

async function listAllTables(
  client: ReturnType<typeof createClient>,
  schema: string
): Promise<string[]> {
  // Use RPC to get table names - this is a workaround since we can't query pg_tables directly
  // We'll try common table names instead
  const commonTables = [
    // GFT core tables
    'contacts', 'companies', 'interactions', 'tags', 'contact_tags',
    'users', 'profiles', 'accounts',
    // Location tables
    'locations', 'regions', 'cities', 'states', 'countries', 'metros', 'metro_areas',
    'location_regions', 'region_mappings',
    // CRM tables
    'deals', 'opportunities', 'pipelines', 'stages',
    'activities', 'notes', 'tasks', 'events',
    // Lists and segments
    'lists', 'list_members', 'segments', 'segment_rules',
    // Import/export
    'imports', 'import_mappings', 'exports',
    // Settings
    'settings', 'preferences', 'integrations',
    // Enrichment
    'enrichment_jobs', 'enrichment_results',
    // Analytics
    'analytics', 'events', 'pageviews',
    // Search
    'search_index', 'search_queries',
    // Misc
    'webhooks', 'api_keys', 'audit_logs',
    'files', 'attachments', 'documents',
    // LinkedIn specific
    'linkedin_profiles', 'linkedin_connections', 'linkedin_messages',
    // Email
    'emails', 'email_templates', 'email_campaigns',
    // Calendar
    'calendar_events', 'meetings', 'availability',
  ];

  const foundTables: string[] = [];

  for (const table of commonTables) {
    const result = await getTableData(client, schema, table);
    if (!result.error || !result.error.includes('does not exist')) {
      foundTables.push(table);
    }
  }

  return foundTables;
}

async function main() {
  console.log('Comparing OLD GFT (public) vs NEW (gft schema) databases...\n');

  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  // First, discover all tables in OLD database
  console.log('Discovering tables in OLD GFT database...');
  const oldTables = await listAllTables(oldClient, 'public');
  console.log(`Found ${oldTables.length} tables in OLD database\n`);

  // Discover tables in NEW database
  console.log('Discovering tables in NEW GFT schema...');
  const newTables = await listAllTables(newClient, 'gft');
  console.log(`Found ${newTables.length} tables in NEW database\n`);

  // Get all unique tables
  const allTables = [...new Set([...oldTables, ...newTables])].sort();

  console.log('=== GFT DATABASE COMPARISON ===\n');
  console.log('Table                    | OLD  | NEW  | OLD Columns | Status');
  console.log('-------------------------|------|------|-------------|--------');

  const tableDetails: Array<{
    table: string;
    oldCount: number;
    newCount: number;
    oldColumns: string[];
    sample?: unknown;
    status: string;
  }> = [];

  for (const table of allTables) {
    const oldResult = await getTableData(oldClient, 'public', table);
    const newResult = await getTableData(newClient, 'gft', table);

    const oldCount = oldResult.error ? 0 : oldResult.count;
    const newCount = newResult.error ? 0 : newResult.count;
    const oldStr = oldResult.error ? ' N/A' : String(oldCount).padStart(4);
    const newStr = newResult.error ? ' N/A' : String(newCount).padStart(4);

    let status = '';
    if (oldResult.error && newResult.error) {
      continue; // Skip tables that don't exist in either
    } else if (oldResult.error) {
      status = 'NEW ONLY';
    } else if (newResult.error) {
      status = oldCount > 0 ? 'NEEDS MIGRATION' : 'OLD ONLY (empty)';
    } else if (oldCount === 0 && newCount === 0) {
      status = 'EMPTY';
    } else if (oldCount === newCount) {
      status = 'COUNTS MATCH';
    } else if (oldCount > newCount) {
      status = 'OLD HAS MORE';
    } else {
      status = 'NEW HAS MORE';
    }

    const colList = oldResult.columns?.slice(0, 3).join(', ') || '';
    const colStr = colList.length > 10 ? colList.substring(0, 10) + '...' : colList.padEnd(11);

    console.log(`${table.padEnd(24)} | ${oldStr} | ${newStr} | ${colStr} | ${status}`);

    if (!oldResult.error && oldCount > 0) {
      tableDetails.push({
        table,
        oldCount,
        newCount,
        oldColumns: oldResult.columns || [],
        sample: oldResult.data?.[0],
        status
      });
    }
  }

  // Show detailed info for tables with data in OLD
  console.log('\n=== TABLES WITH DATA IN OLD DATABASE ===\n');

  for (const detail of tableDetails.sort((a, b) => b.oldCount - a.oldCount)) {
    console.log(`📦 ${detail.table} (${detail.oldCount} rows) - ${detail.status}`);
    console.log(`   Columns: ${detail.oldColumns.join(', ')}`);
    if (detail.sample) {
      const sampleStr = JSON.stringify(detail.sample, null, 2)
        .split('\n')
        .slice(0, 8)
        .join('\n');
      console.log(`   Sample:\n${sampleStr.split('\n').map(l => '   ' + l).join('\n')}`);
    }
    console.log('');
  }

  // Summary
  console.log('=== SUMMARY ===\n');
  const needsMigration = tableDetails.filter(t => t.status === 'NEEDS MIGRATION' || t.status === 'OLD HAS MORE');
  const withData = tableDetails.filter(t => t.oldCount > 0);

  console.log(`Tables with data in OLD: ${withData.length}`);
  console.log(`Tables needing migration: ${needsMigration.length}`);

  if (needsMigration.length > 0) {
    console.log('\nTables to migrate:');
    needsMigration.forEach(t => console.log(`  - ${t.table}: ${t.oldCount} rows`));
  }

  console.log('\nDone!');
}

main().catch(console.error);
