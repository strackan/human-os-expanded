/**
 * Phase 1 Validation Script
 * Purpose: Verify ACO demo schema migration was applied successfully
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validatePhase1Schema() {
  console.log('🔍 Validating Phase 1 Schema Migration...\n');

  let allTestsPassed = true;

  // Test 1: Check demo_operations table exists
  console.log('✓ Test 1: Checking demo_operations table...');
  const { data: operations, error: opsError } = await supabase
    .from('demo_operations')
    .select('*')
    .limit(1);

  if (opsError) {
    console.log(`  ❌ FAILED: ${opsError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: demo_operations table exists');
  }

  // Test 2: Check demo_support_tickets table exists
  console.log('✓ Test 2: Checking demo_support_tickets table...');
  const { data: tickets, error: ticketsError } = await supabase
    .from('demo_support_tickets')
    .select('*')
    .limit(1);

  if (ticketsError) {
    console.log(`  ❌ FAILED: ${ticketsError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: demo_support_tickets table exists');
  }

  // Test 3: Check demo_strategic_plans table exists
  console.log('✓ Test 3: Checking demo_strategic_plans table...');
  const { data: plans, error: plansError } = await supabase
    .from('demo_strategic_plans')
    .select('*')
    .limit(1);

  if (plansError) {
    console.log(`  ❌ FAILED: ${plansError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: demo_strategic_plans table exists');
  }

  // Test 4: Check customers table has is_demo column
  console.log('✓ Test 4: Checking customers.is_demo column...');
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('is_demo')
    .limit(1);

  if (customersError) {
    console.log(`  ❌ FAILED: ${customersError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: customers.is_demo column exists');
  }

  // Test 5: Check profiles table has demo_godmode column
  console.log('✓ Test 5: Checking profiles.demo_godmode column...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('demo_godmode')
    .limit(1);

  if (profilesError) {
    console.log(`  ❌ FAILED: ${profilesError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: profiles.demo_godmode column exists');
  }

  // Test 6: Check justin@renubu.com has demo_godmode
  console.log('✓ Test 6: Checking justin@renubu.com demo_godmode...');
  const { data: justinProfile, error: justinError } = await supabase
    .from('profiles')
    .select('email, demo_godmode')
    .eq('email', 'justin@renubu.com')
    .single();

  if (justinError) {
    console.log(`  ⚠️  WARNING: ${justinError.message}`);
    console.log('     (User may not exist yet - this is okay)');
  } else if (justinProfile && justinProfile.demo_godmode) {
    console.log('  ✅ PASSED: justin@renubu.com has demo_godmode = true');
  } else {
    console.log('  ⚠️  WARNING: justin@renubu.com exists but demo_godmode = false');
    console.log('     (Will be set when user logs in)');
  }

  // Test 7: Check reset_aco_demo function exists
  console.log('✓ Test 7: Checking reset_aco_demo() function...');
  const { data: resetTest, error: resetError } = await supabase
    .rpc('reset_aco_demo');

  if (resetError) {
    console.log(`  ❌ FAILED: ${resetError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: reset_aco_demo() function exists and runs');
    console.log(`     Deleted: ${resetTest[0]?.customers_deleted || 0} customers, ${resetTest[0]?.operations_deleted || 0} operations`);
  }

  // Test 8: Check workflow_executions has renewal_id column
  console.log('✓ Test 8: Checking workflow_executions.renewal_id column...');
  const { data: workflows, error: workflowsError } = await supabase
    .from('workflow_executions')
    .select('renewal_id')
    .limit(1);

  if (workflowsError) {
    console.log(`  ❌ FAILED: ${workflowsError.message}`);
    allTestsPassed = false;
  } else {
    console.log('  ✅ PASSED: workflow_executions.renewal_id column exists');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED - Phase 1 migration successful!');
    console.log('\nNext steps:');
    console.log('  1. Proceed to Phase 2: Data Seeding');
    console.log('  2. Coordinate with FE on API contracts');
  } else {
    console.log('❌ SOME TESTS FAILED - Review errors above');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allTestsPassed ? 0 : 1);
}

validatePhase1Schema().catch(console.error);
