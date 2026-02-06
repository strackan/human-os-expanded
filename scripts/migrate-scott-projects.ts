import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AUTH_USER_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';
const HUMAN_OS_USER_ID = '4841b64f-4f76-40af-bb10-5fba5061e5b3';

async function migrate() {
  console.log('=== MIGRATING SCOTT PROJECTS ===\n');
  console.log(`From auth user_id: ${AUTH_USER_ID}`);
  console.log(`To human_os user_id: ${HUMAN_OS_USER_ID}\n`);

  // Check current projects
  const { data: before } = await supabase
    .schema('founder_os')
    .from('projects')
    .select('id, name, user_id')
    .eq('user_id', AUTH_USER_ID);

  console.log('Projects to migrate:', before?.length || 0);
  before?.forEach(p => console.log(`  - ${p.name}`));

  if (!before || before.length === 0) {
    console.log('\nNo projects to migrate.');
    return;
  }

  // Update projects
  const { data: updated, error } = await supabase
    .schema('founder_os')
    .from('projects')
    .update({ user_id: HUMAN_OS_USER_ID })
    .eq('user_id', AUTH_USER_ID)
    .select('id, name');

  if (error) {
    console.error('\nError:', error.message);
    return;
  }

  console.log('\nMigrated successfully:', updated?.length || 0, 'projects');

  // Verify
  const { data: after } = await supabase
    .schema('founder_os')
    .from('projects')
    .select('id, name, user_id')
    .eq('user_id', HUMAN_OS_USER_ID);

  console.log('\nProjects now under human_os user_id:', after?.length || 0);
}

migrate().catch(console.error);
