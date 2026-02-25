import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyGrace() {
  console.log('🔍 Checking Grace user...\n');

  // Try to get user by email
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  const grace = users.users.find(u => u.email === 'grace@inhersight.com');

  if (!grace) {
    console.log('❌ Grace user NOT found!');
    console.log('Available users:', users.users.map(u => u.email));
    return;
  }

  console.log('✅ Grace user found!');
  console.log('   ID:', grace.id);
  console.log('   Email:', grace.email);
  console.log('   Email confirmed:', grace.email_confirmed_at ? 'Yes' : 'No');
  console.log('   Created:', grace.created_at);
  console.log('   Last sign in:', grace.last_sign_in_at || 'Never');
  
  // Check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', grace.id)
    .single();

  if (profile) {
    console.log('\n✅ Profile found:');
    console.log('   Company ID:', profile.company_id);
    console.log('   Status:', profile.status);
  } else {
    console.log('\n⚠️  No profile found');
  }

  // Try test login
  console.log('\n🔐 Testing login with password...');
  const testClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
    email: 'grace@inhersight.com',
    password: 'Demo123!@#'
  });

  if (signInError) {
    console.log('❌ Login failed:', signInError.message);
  } else {
    console.log('✅ Login successful!');
    console.log('   User ID:', signInData.user?.id);
    console.log('   Session expires:', signInData.session?.expires_at);
  }
}

verifyGrace();
