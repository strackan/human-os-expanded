import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_AUTH_USER_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';

async function check() {
  // Check human_os.users table
  console.log('=== human_os.users table ===');
  const { data: humanOsUsers, error: hoErr } = await supabase
    .from('human_os_users')  // might be exposed as this
    .select('*')
    .limit(5);

  if (hoErr) {
    console.log('Error querying human_os_users:', hoErr.message);

    // Try direct schema access
    const { data: users2, error: err2 } = await supabase
      .schema('human_os')
      .from('users')
      .select('*')
      .limit(5);

    if (err2) {
      console.log('Error with schema access:', err2.message);
    } else {
      console.log('human_os.users records:', users2);
    }
  } else {
    console.log('Records:', humanOsUsers);
  }

  // Check if Scott has a record by auth_user_id
  console.log('\n=== Looking for Scott ===');
  const { data: scottHo, error: scottErr } = await supabase
    .schema('human_os')
    .from('users')
    .select('*')
    .eq('auth_user_id', SCOTT_AUTH_USER_ID)
    .single();

  if (scottErr) {
    console.log('Scott not found in human_os.users:', scottErr.message);
  } else {
    console.log('Scott human_os record:', scottHo);
  }

  // Check activation_keys table structure
  console.log('\n=== activation_keys columns ===');
  const { data: key } = await supabase
    .from('activation_keys')
    .select('*')
    .eq('code', 'B744-DD4D-6D47')
    .single();

  console.log('Key columns:', Object.keys(key || {}));
  console.log('Full key:', key);
}

check().catch(console.error);
