import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOTT_AUTH_USER_ID = '083591d4-7008-4538-a929-c1e7d0c9bfb0';
const SCOTT_HUMAN_OS_USER_ID = '4841b64f-4f76-40af-bb10-5fba5061e5b3';

async function link() {
  console.log('Linking Scott human_os.users to auth account...');

  const { error } = await supabase
    .schema('human_os')
    .from('users')
    .update({ auth_id: SCOTT_AUTH_USER_ID })
    .eq('id', SCOTT_HUMAN_OS_USER_ID);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  // Verify
  const { data: user } = await supabase
    .schema('human_os')
    .from('users')
    .select('id, display_name, email, auth_id')
    .eq('id', SCOTT_HUMAN_OS_USER_ID)
    .single();

  console.log('\nUpdated human_os.users record:');
  console.log(user);
  console.log('\nauth_id now matches auth.users:', user?.auth_id === SCOTT_AUTH_USER_ID);
}

link().catch(console.error);
