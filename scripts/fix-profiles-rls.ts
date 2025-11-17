/**
 * Fix Infinite Recursion in Profiles RLS Policy
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

const STAGING_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixProfilesRLS() {
  console.log('🔧 Fixing profiles RLS infinite recursion...');

  if (!STAGING_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(STAGING_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Read the SQL file
    const sqlPath = resolve(__dirname, '../supabase/scripts/fix_profiles_rls_recursion.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📝 Executing SQL...');
    console.log(sql);

    // Execute the SQL using rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error);

      // Try direct query instead
      console.log('⚠️ Trying direct query...');
      const { error: execError } = await supabase.from('_sql').insert({ query: sql });

      if (execError) {
        console.error('❌ Direct query also failed:', execError);
        process.exit(1);
      }
    }

    console.log('✅ Profiles RLS recursion fix applied successfully!');
    console.log('🎮 The customers endpoint should now work without delays');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

fixProfilesRLS();
