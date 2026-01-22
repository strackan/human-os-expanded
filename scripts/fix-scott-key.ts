import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_USER_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';
const ACTIVATION_CODE = 'B744-DD4D-6D47';

async function fix() {
  console.log('Updating activation key to use human_os_user_id...');

  // Update human_os_user_id (the column the API actually checks)
  const { error } = await supabase
    .from('activation_keys')
    .update({
      human_os_user_id: SCOTT_USER_ID,
      user_id: SCOTT_USER_ID  // Keep both in sync
    })
    .eq('code', ACTIVATION_CODE);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  // Verify
  const { data: key } = await supabase
    .from('activation_keys')
    .select('code, user_id, human_os_user_id')
    .eq('code', ACTIVATION_CODE)
    .single();

  console.log('\nUpdated activation key:');
  console.log('  user_id:', key?.user_id);
  console.log('  human_os_user_id:', key?.human_os_user_id);
  console.log('\nScott user_id:', SCOTT_USER_ID);
  console.log('Match:', key?.human_os_user_id === SCOTT_USER_ID);
}

fix().catch(console.error);
