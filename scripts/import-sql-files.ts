/**
 * Import SQL files to Human OS Supabase
 *
 * Run: npx tsx scripts/import-sql-files.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const HOS_URL = 'https://zulowgscotdrqlccomht.supabase.co';
const HOS_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o';

const hosClient = createClient(HOS_URL, HOS_KEY);

async function main() {
  const dataDir = path.join(__dirname, 'data');

  // Order matters for foreign key constraints
  const files = [
    'founder_contexts.sql',
    'founder_goals.sql',
    'founder_tasks.sql',
    'founder_daily_plans.sql',
    'founder_relationships.sql',
    'founder_check_ins.sql'
  ];

  console.log('='.repeat(60));
  console.log('📥 Importing SQL to Human OS Supabase');
  console.log('='.repeat(60));

  for (const file of files) {
    const filePath = path.join(dataDir, file);

    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  ${file} - not found, skipping`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    const statements = sql.split('\n').filter(s => s.trim().length > 0);

    console.log(`\n📄 ${file} (${statements.length} statements)`);

    let success = 0;
    let failed = 0;

    for (const statement of statements) {
      try {
        const { error } = await hosClient.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct REST API call to run SQL
          const response = await fetch(`${HOS_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': HOS_KEY,
              'Authorization': `Bearer ${HOS_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql: statement })
          });

          if (!response.ok) {
            failed++;
            console.log(`   ❌ Error: ${error.message}`);
          } else {
            success++;
          }
        } else {
          success++;
        }
      } catch (err) {
        failed++;
        console.log(`   ❌ Error: ${err}`);
      }
    }

    console.log(`   ✅ ${success} succeeded, ❌ ${failed} failed`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Done!');
}

main().catch(console.error);
