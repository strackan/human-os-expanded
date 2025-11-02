require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Staging Supabase credentials
const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1Nzk2OTcsImV4cCI6MjA0NDE1NTY5N30.hZdtqNVmPhP0kZ67EjPnmQ_7ykWRaAoT9tZNEXM26GQ';

console.log('Testing staging Supabase Google OAuth configuration...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOAuth() {
  try {
    console.log('\n1. Attempting to get OAuth URL for Google provider...');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://renubu-staging.vercel.app/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('   ❌ OAuth Error:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);

      if (error.message?.includes('not enabled') || error.message?.includes('Unsupported provider')) {
        console.error('\n   🔴 FINDING: Google OAuth is NOT enabled on staging Supabase instance!');
      }
    } else {
      console.log('   ✅ OAuth URL generated successfully');
      console.log('   OAuth URL:', data.url);
      console.log('\n   🟢 FINDING: Google OAuth IS enabled on staging Supabase instance');
    }

  } catch (error) {
    console.error('\n❌ Caught error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testOAuth().then(() => {
  console.log('\nTest complete');
  process.exit(0);
});
