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
  console.log('=== SCOTT STATUS CHECK ===\n');

  // 1. Check profiles table
  console.log('1. Profiles table:');
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', SCOTT_AUTH_USER_ID)
    .single();

  if (profileErr) {
    console.log('   NOT FOUND:', profileErr.message);
  } else {
    console.log('   Found:', profile);
  }

  // 2. Check activation_keys
  console.log('\n2. Activation key:');
  const { data: key } = await supabase
    .from('activation_keys')
    .select('*')
    .eq('code', 'B744-DD4D-6D47')
    .single();

  console.log('   Product:', key?.product);
  console.log('   user_id:', key?.user_id);
  console.log('   human_os_user_id:', key?.human_os_user_id);
  console.log('   redeemed_at:', key?.redeemed_at);

  // 3. Check human_os.users
  console.log('\n3. human_os.users:');
  const { data: hoUser, error: hoErr } = await supabase
    .schema('human_os')
    .from('users')
    .select('*')
    .eq('auth_id', SCOTT_AUTH_USER_ID)
    .single();

  if (hoErr) {
    console.log('   NOT FOUND by auth_id:', hoErr.message);
  } else {
    console.log('   Found:', hoUser);
  }

  // 4. Check user_products
  console.log('\n4. human_os.user_products:');
  const { data: products, error: prodErr } = await supabase
    .schema('human_os')
    .from('user_products')
    .select('*')
    .eq('user_id', key?.human_os_user_id);

  if (prodErr) {
    console.log('   Error:', prodErr.message);
  } else if (!products || products.length === 0) {
    console.log('   No products found');
  } else {
    console.log('   Products:', products);
  }

  // 5. Check sculptor_sessions for Scott
  console.log('\n5. Sculptor sessions:');
  const { data: sessions } = await supabase
    .from('sculptor_sessions')
    .select('id, entity_name, entity_slug, status, access_code')
    .or(`entity_slug.eq.scott-leese,entity_name.ilike.%scott%`);

  if (!sessions || sessions.length === 0) {
    console.log('   No sessions found');
  } else {
    console.log('   Sessions:', sessions);
  }

  console.log('\n=== DIAGNOSIS ===');
  if (!profile) {
    console.log('- Missing profiles record - user status will return found: false');
  }
  if (key?.product === 'founder_os') {
    console.log('- Product is founder_os - should route to /founder-os/onboarding');
  }
  if (!hoUser) {
    console.log('- No human_os.users record linked by auth_id');
  }
}

check().catch(console.error);
