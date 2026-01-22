import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';
const SCOTT_USER_ID = '4841b64f-4f76-40af-bb10-5fba5061e5b3'; // human_os user id

async function run() {
  console.log('=== Adding user_id to sculptor_sessions ===\n');

  // First, add the column if it doesn't exist (via raw SQL)
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE sculptor_sessions
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_user_id
      ON sculptor_sessions(user_id);
    `
  });

  if (alterError) {
    console.log('Note: Could not add column via RPC (may already exist or need manual migration)');
    console.log('Error:', alterError.message);
  }

  // Update Scott's session with his user_id
  const { error: updateError } = await supabase
    .from('sculptor_sessions')
    .update({ user_id: SCOTT_USER_ID })
    .eq('id', SCOTT_SESSION_ID);

  if (updateError) {
    console.log('Update error:', updateError.message);
    return;
  }

  console.log('Updated Scott session with user_id:', SCOTT_USER_ID);

  // Verify
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('id, entity_slug, status, user_id')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  console.log('\nVerified session:', session);
}

run().catch(console.error);
