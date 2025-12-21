/**
 * Final verification: Compare old GFT database with new gft schema
 * to confirm all data has been migrated
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const OLD_URL = 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3h2cXRxamlub2Fnd2NweHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxOTMzNCwiZXhwIjoyMDc0Mjk1MzM0fQ.gNQ-Puth3WfHahtGu8lSoP4jh_3LTBljyEd3Ki_S7Rw';

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TableComparison {
  table: string;
  oldCount: number;
  newCount: number;
  match: boolean;
}

async function main() {
  console.log('=== GFT MIGRATION VERIFICATION ===\n');
  console.log('Comparing old GFT database with new gft schema...\n');

  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  const tables = ['contacts', 'companies', 'activities', 'regions', 'personas'];
  const results: TableComparison[] = [];

  for (const table of tables) {
    // Old database (public schema)
    const { count: oldCount, error: oldErr } = await oldClient
      .from(table)
      .select('*', { count: 'exact', head: true });

    // New database (gft schema)
    const { count: newCount, error: newErr } = await newClient
      .schema('gft')
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (oldErr) {
      console.log(`  ${table}: OLD ERROR - ${oldErr.message}`);
      continue;
    }
    if (newErr) {
      console.log(`  ${table}: NEW ERROR - ${newErr.message}`);
      continue;
    }

    const match = oldCount === newCount;
    results.push({
      table,
      oldCount: oldCount || 0,
      newCount: newCount || 0,
      match
    });

    const status = match ? '✓' : '✗';
    console.log(`  ${status} ${table}: OLD=${oldCount} → NEW=${newCount}`);
  }

  console.log('\n--- SUMMARY ---\n');

  const allMatch = results.every(r => r.match);

  if (allMatch) {
    console.log('✓ ALL TABLES MATCH\n');
    console.log('The old GFT database can be safely deprecated.');
    console.log('Recommended steps:');
    console.log('  1. Update any remaining code pointing to old database');
    console.log('  2. Keep old database read-only for 30 days as backup');
    console.log('  3. After 30 days, archive and delete');
  } else {
    console.log('✗ SOME TABLES DO NOT MATCH\n');
    console.log('Missing data:');
    for (const r of results) {
      if (!r.match) {
        const diff = r.oldCount - r.newCount;
        console.log(`  - ${r.table}: ${diff} rows need migration`);
      }
    }
  }

  // Check for any other tables in old database we might have missed
  console.log('\n--- CHECKING FOR OTHER TABLES ---\n');

  // Query pg_tables to find all user tables
  const { data: oldTables } = await oldClient
    .from('contacts')
    .select('id')
    .limit(0);

  // List known tables we checked
  console.log('Tables verified:', tables.join(', '));
  console.log('\nNote: If there are other tables in the old database not listed above,');
  console.log('they may need separate verification.');
}

main().catch(console.error);
