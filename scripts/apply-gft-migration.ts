/**
 * Apply GFT Schema Migration
 *
 * Runs the 024_gft_schema.sql migration against Human OS Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zulowgscotdrqlccomht.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function main() {
  console.log('Applying GFT schema migration...\n');

  if (!SUPABASE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/024_gft_schema.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (rough split on semicolons not in strings)
  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`Found ${statements.length} SQL statements\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        // Try direct query for DDL statements
        const { error: directError } = await supabase.from('_exec').select().limit(0);

        if (directError && directError.message.includes('does not exist')) {
          // Expected - no exec table, we need to use pg_query or similar
          console.log(`[${i + 1}] Skipped (needs direct DB access): ${preview}...`);
        } else {
          console.log(`[${i + 1}] Error: ${error.message}`);
          errors++;
        }
      } else {
        console.log(`[${i + 1}] OK: ${preview}...`);
        success++;
      }
    } catch (err) {
      console.log(`[${i + 1}] Exception: ${err}`);
      errors++;
    }
  }

  console.log(`\nDone: ${success} succeeded, ${errors} errors`);
  console.log('\nNote: DDL statements (CREATE TABLE, etc.) need to be run directly in Supabase SQL Editor.');
}

main().catch(console.error);
