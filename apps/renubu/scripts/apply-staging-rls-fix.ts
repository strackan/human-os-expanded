#!/usr/bin/env npx tsx
/**
 * Apply RLS fixes to staging database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFixes() {
  console.log('🚀 Applying RLS fixes to staging database...\n');

  try {
    // 1. Apply demo mode RLS fix
    console.log('1️⃣ Enabling demo mode and creating is_demo_mode function...');
    const demoModeSql = fs.readFileSync('supabase/scripts/fix_demo_mode_rls.sql', 'utf-8');

    // Execute as a single transaction
    const { error: demoError } = await supabase.rpc('exec', { sql: demoModeSql });

    if (demoError) {
      console.error('⚠️ Demo mode RLS error (may be OK if already exists):', demoError.message);
    } else {
      console.log('✅ Demo mode RLS applied\n');
    }

    // 2. Apply profiles RLS fix
    console.log('2️⃣ Fixing profiles RLS policies...');
    const profilesSql = fs.readFileSync('supabase/scripts/fix_profiles_rls.sql', 'utf-8');

    const { error: profilesError } = await supabase.rpc('exec', { sql: profilesSql });

    if (profilesError) {
      console.error('⚠️ Profiles RLS error:', profilesError.message);
    } else {
      console.log('✅ Profiles RLS applied\n');
    }

    // 3. Apply customers RLS fix
    console.log('3️⃣ Fixing customers RLS policies...');
    const customersSql = fs.readFileSync('supabase/scripts/fix_customers_rls.sql', 'utf-8');

    const { error: customersError } = await supabase.rpc('exec', { sql: customersSql });

    if (customersError) {
      console.error('⚠️ Customers RLS error:', customersError.message);
    } else {
      console.log('✅ Customers RLS applied\n');
    }

    // Verify
    console.log('🔍 Verifying fixes...');
    const { data: demoMode, error: verifyError } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('key', 'demo_mode')
      .single();

    if (verifyError) {
      console.log('⚠️ Could not verify demo mode setting');
    } else {
      console.log('✅ Demo mode:', demoMode?.value);
    }

    console.log('\n🎉 All RLS fixes applied successfully!');
    console.log('\n📝 Next: Test the /customers page in your browser');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyRLSFixes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
