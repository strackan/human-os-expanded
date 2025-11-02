require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Staging Supabase credentials
const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1Nzk2OTcsImV4cCI6MjA0NDE1NTY5N30.hZdtqNVmPhP0kZ67EjPnmQ_7ykWRaAoT9tZNEXM26GQ';

console.log('Testing OAuth code exchange process on staging...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGetSession() {
  try {
    console.log('\n1. Testing getSession() call (this is what hangs in AuthProvider)...');
    const start1 = Date.now();

    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout after 10 seconds')), 10000)
    );

    const { data: { session }, error: sessionError } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]);

    const duration1 = Date.now() - start1;
    console.log(`   getSession() took ${duration1}ms`);

    if (sessionError) {
      console.error('   ❌ Session error:', sessionError);
      return;
    }

    if (!session) {
      console.log('   ✅ No active session (as expected for unauthenticated test)');
    } else {
      console.log('   ✅ Session found:', session.user?.email);

      // If we have a session, try to query the profiles table
      console.log('\n2. Testing profiles table query with active session...');
      const start2 = Date.now();

      const profilePromise = supabase
        .from('profiles')
        .select('company_id, is_admin, status')
        .eq('id', session.user.id)
        .single();

      const profileTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('profiles query timeout after 10 seconds')), 10000)
      );

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        profileTimeoutPromise
      ]);

      const duration2 = Date.now() - start2;
      console.log(`   profiles query took ${duration2}ms`);

      if (profileError) {
        console.error('   ❌ Profile query error:', profileError);
        console.error('   This could indicate an RLS policy issue!');
      } else {
        console.log('   ✅ Profile data:', profile);
      }
    }

  } catch (error) {
    console.error('\n❌ Caught error:', error.message);

    if (error.message.includes('timeout')) {
      console.error('\n🔴 FINDING: The hanging is reproducible in this test!');
      console.error('   This suggests the issue is with the Supabase client or database configuration,');
      console.error('   not specifically with the OAuth code exchange.');
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n3. Testing direct database query (bypassing auth)...');
  const start = Date.now();

  try {
    const queryPromise = supabase
      .from('workflow_definitions')
      .select('id, name')
      .limit(1);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('query timeout')), 10000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    const duration = Date.now() - start;
    console.log(`   Query took ${duration}ms`);

    if (error) {
      console.error('   ❌ Query error:', error);
    } else {
      console.log('   ✅ Database connection works, got ${data?.length || 0} results');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

async function runAllTests() {
  await testGetSession();
  await testDatabaseConnection();
  console.log('\n=== Test Summary ===');
  console.log('If getSession() hangs, the issue is likely:');
  console.log('1. RLS policies causing circular dependency');
  console.log('2. Supabase client configuration issue');
  console.log('3. Network/DNS issue with Supabase');
  console.log('\nNext step: Apply RLS fix to staging database');
}

runAllTests().then(() => {
  console.log('\nTest complete');
  process.exit(0);
});
