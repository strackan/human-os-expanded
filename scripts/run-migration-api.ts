/**
 * Run migration via Supabase Management API
 */

import { readFileSync } from 'fs';

const SUPABASE_PROJECT_REF = 'amugmkrihnjsxlpwdzcy';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function runMigration() {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error('SUPABASE_ACCESS_TOKEN environment variable required');
    console.log('\nTo get your access token:');
    console.log('1. Go to https://supabase.com/dashboard/account/tokens');
    console.log('2. Create a new access token');
    console.log('3. Run: SUPABASE_ACCESS_TOKEN=<your-token> npx tsx scripts/run-migration-api.ts');
    process.exit(1);
  }

  const sql = readFileSync('supabase/migrations/20260103220000_claude_conversations.sql', 'utf-8');

  console.log('Running migration via Supabase Management API...');

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Migration failed:', response.status, error);
    process.exit(1);
  }

  const result = await response.json();
  console.log('Migration completed successfully!');
  console.log('Result:', JSON.stringify(result, null, 2));
}

runMigration();
