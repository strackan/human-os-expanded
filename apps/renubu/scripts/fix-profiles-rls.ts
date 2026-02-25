import { config } from 'dotenv';

config({ path: '.env.local' });

async function fixProfilesRLS() {
  console.log('🔧 Fixing profiles RLS policy via SQL...\n');

  // Execute SQL directly
  const sql = `
    -- Drop existing policy
    DROP POLICY IF EXISTS "Authenticated users can access profiles" ON public.profiles;

    -- Recreate with service role bypass to prevent recursion
    CREATE POLICY "Authenticated users can access profiles" ON public.profiles
        FOR ALL
        USING (
            -- Service role has full access (bypasses RLS)
            auth.jwt()->>'role' = 'service_role'
            OR
            -- Authenticated users can access all profiles in demo mode
            (auth.role() = 'authenticated')
        );
  `;

  console.log('Executing SQL...');
  console.log(sql);
  console.log('\n⚠️  Please run this SQL in Supabase SQL Editor manually.\n');
}

fixProfilesRLS();
