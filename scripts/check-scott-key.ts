import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Get activation key
  const { data: key, error: keyErr } = await supabase
    .from('activation_keys')
    .select('*')
    .eq('code', 'B744-DD4D-6D47')
    .single();

  console.log('=== ACTIVATION KEY ===');
  console.log('user_id on key:', key?.user_id);
  console.log('session_id:', key?.session_id);
  console.log('entity_id:', key?.entity_id);
  if (keyErr) console.log('Error:', keyErr.message);

  // Get Scott's auth user
  const { data: users } = await supabase.auth.admin.listUsers();
  const scott = users?.users?.find(u => u.email === 'scott.leese@gmail.com');

  console.log('\n=== SCOTT AUTH USER ===');
  console.log('auth user id:', scott?.id);
  console.log('email:', scott?.email);

  console.log('\n=== COMPARISON ===');
  console.log('Key user_id:', key?.user_id);
  console.log('Scott user_id:', scott?.id);
  console.log('MATCH:', key?.user_id === scott?.id);

  if (key?.user_id !== scott?.id) {
    console.log('\n!!! MISMATCH - Need to update activation key !!!');
  }
}

check().catch(console.error);
