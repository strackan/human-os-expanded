require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing profile query...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileQuery() {
  try {
    console.log('\n1. Testing getUser() call...');
    const start1 = Date.now();
    const { data: { user }, error: userError } = await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('getUser timeout')), 10000))
    ]);
    console.log(`   getUser() took ${Date.now() - start1}ms`);

    if (userError) {
      console.error('   Error:', userError);
      return;
    }

    if (!user) {
      console.log('   No user found - need to sign in first');
      return;
    }

    console.log('   User found:', user.email, 'ID:', user.id);

    console.log('\n2. Testing profiles table query...');
    const start2 = Date.now();
    const { data: profile, error: profileError } = await Promise.race([
      supabase.from('profiles').select('company_id, is_admin, status').eq('id', user.id).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('profiles query timeout')), 10000))
    ]);
    console.log(`   profiles query took ${Date.now() - start2}ms`);

    if (profileError) {
      console.error('   Profile query error:', profileError);
      console.error('   Error code:', profileError.code);
      console.error('   Error message:', profileError.message);
    } else {
      console.log('   Profile data:', profile);
    }

  } catch (error) {
    console.error('\nCaught error:', error.message);
  }
}

testProfileQuery().then(() => {
  console.log('\nTest complete');
  process.exit(0);
});
