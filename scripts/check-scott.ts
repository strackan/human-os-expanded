import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const authId = '083591d4-7008-4538-a929-c1e7d0c9bfb0';
  
  console.log('=== Checking Scott\'s records ===\n');
  
  // Check profiles table (local GoodHang)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authId)
    .single();
  console.log('1. profiles table:', profile ? 'FOUND' : 'NOT FOUND');
  if (profileError) console.log('   Error:', profileError.message);
  if (profile) console.log('   Data:', profile);
  
  // Check human_os.users
  const { data: humanOsUser, error: humanOsError } = await supabase
    .schema('human_os')
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();
  console.log('\n2. human_os.users:', humanOsUser ? 'FOUND' : 'NOT FOUND');
  if (humanOsError) console.log('   Error:', humanOsError.message);
  if (humanOsUser) console.log('   Data:', humanOsUser);
  
  // Check sculptor_sessions
  if (humanOsUser) {
    const { data: sculptor, error: sculptorError } = await supabase
      .from('sculptor_sessions')
      .select('id, status, user_id, entity_slug')
      .eq('user_id', humanOsUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    console.log('\n3. sculptor_sessions (by human_os user_id):', sculptor ? 'FOUND' : 'NOT FOUND');
    if (sculptorError) console.log('   Error:', sculptorError.message);
    if (sculptor) console.log('   Data:', sculptor);
  }
  
  // Check sculptor_sessions by auth_id directly
  const { data: sculptorByAuth, error: sculptorAuthError } = await supabase
    .from('sculptor_sessions')
    .select('id, status, user_id, entity_slug')
    .eq('user_id', authId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  console.log('\n4. sculptor_sessions (by auth_id):', sculptorByAuth ? 'FOUND' : 'NOT FOUND');
  if (sculptorAuthError) console.log('   Error:', sculptorAuthError.message);
  if (sculptorByAuth) console.log('   Data:', sculptorByAuth);
  
  // Check activation_keys
  const { data: key, error: keyError } = await supabase
    .from('activation_keys')
    .select('code, user_id, human_os_user_id, redeemed_at, session_id')
    .eq('code', 'B744-DD4D-6D47')
    .single();
  console.log('\n5. activation_keys:', key ? 'FOUND' : 'NOT FOUND');
  if (keyError) console.log('   Error:', keyError.message);
  if (key) console.log('   Data:', key);
}

check();
