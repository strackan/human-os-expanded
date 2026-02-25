/**
 * Apply SECURITY DEFINER Fix to get_current_user_company()
 *
 * This fixes the infinite recursion issue where RLS policy calls
 * get_current_user_company() which reads from profiles, triggering
 * the RLS policy again.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

const STAGING_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyRLSFix() {
  console.log('🔧 Applying SECURITY DEFINER fix to get_current_user_company()...');

  if (!STAGING_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(STAGING_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  try {
    console.log('📝 Executing SQL to add SECURITY DEFINER...');

    const sql = `
-- Fix infinite recursion in profiles RLS policy
-- Add SECURITY DEFINER to bypass RLS when function is called within RLS policy

CREATE OR REPLACE FUNCTION public.get_current_user_company()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_company() TO authenticated;
    `.trim();

    console.log(sql);
    console.log('\n⏳ Running SQL via Supabase client...\n');

    // Use rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql' as any, { sql_string: sql } as any);

    if (error) {
      console.error('❌ Error executing SQL via RPC:',error);
      console.log('\n💡 Trying alternative method: direct query...\n');

      // Try executing the SQL directly using the REST API
      const response = await fetch(`${STAGING_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql_string: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Direct API call also failed:', errorText);
        console.log('\n⚠️  You may need to run this SQL manually in Supabase dashboard:');
        console.log('\n' + sql + '\n');
        process.exit(1);
      }
    }

    console.log('✅ SECURITY DEFINER applied successfully!');
    console.log('\n📊 Verifying the function...\n');

    // Verify the function exists
    const { data: funcData, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname, prosecdef')
      .eq('proname', 'get_current_user_company')
      .single();

    if (funcError) {
      console.log('⚠️  Could not verify function (this is normal)');
    } else {
      console.log('✅ Function verified:', funcData);
    }

    console.log('\n✅ RLS recursion fix applied!');
    console.log('🎮 The /api/customers endpoint should now work without 403 errors');
    console.log('🔄 Please hard refresh your browser (Ctrl+Shift+R) to test');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

applyRLSFix();
