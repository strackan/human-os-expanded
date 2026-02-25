require('dotenv').config({ path: '.env.production.check' });
const { createClient } = require('@supabase/supabase-js');

// Production Supabase credentials
const supabaseUrl = 'https://uuvdjjclwwulvyeboavk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmRqamNsd3d1bHZ5ZWJvYXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NjIzNzQsImV4cCI6MjA2NTMzODM3NH0.VO30vhbEelllMrf6ok3ZqWqsq-LkRcmBD3lAysS6Kwo';

console.log('Testing production Supabase Google OAuth configuration...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOAuth() {
  try {
    console.log('\n1. Attempting to get OAuth URL for Google provider...');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://renubu.com/auth/callback',
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
        console.error('\n   🔴 FINDING: Google OAuth is NOT enabled on production Supabase instance!');
      }
    } else {
      console.log('   ✅ OAuth URL generated successfully');
      console.log('   OAuth URL:', data.url);
      console.log('\n   🟢 FINDING: Google OAuth IS enabled on production Supabase instance');
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
