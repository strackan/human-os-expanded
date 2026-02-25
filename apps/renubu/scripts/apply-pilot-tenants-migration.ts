/**
 * Apply pilot_tenants migration to staging database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`Connecting to: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Read the migration file
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260208000000_pilot_tenants_system.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (rough split on semicolons)
  // We need to be careful with function bodies that contain semicolons
  const statements = splitSqlStatements(sql);

  console.log(`Found ${statements.length} SQL statements to execute`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt || stmt.startsWith('--')) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // Try direct query if rpc doesn't exist
        const { error: error2 } = await supabase.from('_exec').select().limit(0);
        if (error2) {
          console.log(`Statement ${i + 1}: Using REST fallback...`);
        }
        throw error;
      }

      success++;
      process.stdout.write('.');
    } catch {
      // For DDL statements, we need to use the management API or SQL editor
      console.log(`\nStatement ${i + 1} needs manual execution (DDL)`);
      failed++;
    }
  }

  console.log(`\n\nCompleted: ${success} succeeded, ${failed} need manual execution`);

  if (failed > 0) {
    console.log('\n========================================');
    console.log('MANUAL STEPS REQUIRED');
    console.log('========================================');
    console.log('Please run the migration SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/sql/new');
    console.log('\nCopy the contents of:');
    console.log('supabase/migrations/20260208000000_pilot_tenants_system.sql');
    console.log('========================================\n');
  }
}

function splitSqlStatements(sql: string): string[] {
  // This is a simplified split that handles function bodies
  const statements: string[] = [];
  let current = '';
  let inFunction = false;
  let dollarQuoteTag = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    // Check for dollar-quoted string start/end (for function bodies)
    const dollarMatch = line.match(/\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$/g);
    if (dollarMatch) {
      for (const match of dollarMatch) {
        if (!inFunction) {
          inFunction = true;
          dollarQuoteTag = match;
        } else if (match === dollarQuoteTag) {
          inFunction = false;
          dollarQuoteTag = '';
        }
      }
    }

    current += line + '\n';

    // If we're not in a function and line ends with semicolon, it's a statement boundary
    if (!inFunction && line.trim().endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s && !s.match(/^--.*$/));
}

main().catch(console.error);
