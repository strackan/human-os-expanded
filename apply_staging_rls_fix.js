const { createClient } = require('@supabase/supabase-js');

// Staging database - use service role key to bypass RLS
const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';

// We need the service role key - let's try using the postgres connection directly
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:lYjjq0p76p9h6dFB@db.amugmkrihnjsxlpwdzcy.supabase.co:5432/postgres';

const sql = `
-- Fix RLS policy for profiles table to allow users to read their own profile
-- This prevents the circular dependency where get_current_user_company() needs
-- to read profiles, but the RLS policy prevents reading profiles

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create a more permissive policy that allows:
-- 1. Users to always view their own profile (needed for auth to work)
-- 2. Users to view other profiles in their company
CREATE POLICY "Users can view their own profile and company profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Always allow reading own profile (breaks circular dependency)
    id = auth.uid()
    OR
    -- Allow reading profiles in same company
    company_id = public.get_current_user_company()
  );
`;

async function applyRLSFix() {
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to staging database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('\nApplying RLS policy fix...');
    await client.query(sql);
    console.log('✅ RLS policy fix applied successfully!');

    console.log('\nVerifying policy exists...');
    const result = await client.query(`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'profiles'
      AND policyname = 'Users can view their own profile and company profiles';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Policy verified:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠️  Policy not found - something went wrong');
    }

  } catch (error) {
    console.error('❌ Error applying RLS fix:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await client.end();
    console.log('\nDisconnected from database');
  }
}

applyRLSFix().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
