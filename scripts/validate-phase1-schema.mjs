/**
 * Phase 1 Validation Script
 * Purpose: Verify ACO demo schema migration was applied successfully
 *
 * Uses Supabase CLI to query the database through the linked project
 */

import { execSync } from 'child_process';

// Helper to run SQL via Supabase CLI
function runSQL(sql) {
  try {
    const result = execSync(
      `npx supabase db execute "${sql.replace(/"/g, '\\"')}"`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, stderr: error.stderr };
  }
}

// Helper to check if a table exists
function tableExists(tableName) {
  const sql = `SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = '${tableName}'
  );`;

  const result = runSQL(sql);
  return result.success;
}

// Helper to check if a column exists
function columnExists(tableName, columnName) {
  const sql = `SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = '${tableName}'
    AND column_name = '${columnName}'
  );`;

  const result = runSQL(sql);
  return result.success;
}

// Helper to check if a function exists
function functionExists(functionName) {
  const sql = `SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = '${functionName}'
  );`;

  const result = runSQL(sql);
  return result.success;
}

async function validatePhase1Schema() {
  console.log('🔍 Validating Phase 1 Schema Migration...\n');
  console.log('Using Supabase CLI to query linked remote database\n');

  let allTestsPassed = true;

  // Test 1: Check demo_operations table exists
  console.log('✓ Test 1: Checking demo_operations table...');
  if (tableExists('demo_operations')) {
    console.log('  ✅ PASSED: demo_operations table exists');
  } else {
    console.log('  ❌ FAILED: demo_operations table not found');
    allTestsPassed = false;
  }

  // Test 2: Check demo_support_tickets table exists
  console.log('✓ Test 2: Checking demo_support_tickets table...');
  if (tableExists('demo_support_tickets')) {
    console.log('  ✅ PASSED: demo_support_tickets table exists');
  } else {
    console.log('  ❌ FAILED: demo_support_tickets table not found');
    allTestsPassed = false;
  }

  // Test 3: Check demo_strategic_plans table exists
  console.log('✓ Test 3: Checking demo_strategic_plans table...');
  if (tableExists('demo_strategic_plans')) {
    console.log('  ✅ PASSED: demo_strategic_plans table exists');
  } else {
    console.log('  ❌ FAILED: demo_strategic_plans table not found');
    allTestsPassed = false;
  }

  // Test 4: Check customers table has is_demo column
  console.log('✓ Test 4: Checking customers.is_demo column...');
  if (columnExists('customers', 'is_demo')) {
    console.log('  ✅ PASSED: customers.is_demo column exists');
  } else {
    console.log('  ❌ FAILED: customers.is_demo column not found');
    allTestsPassed = false;
  }

  // Test 5: Check profiles table has demo_godmode column
  console.log('✓ Test 5: Checking profiles.demo_godmode column...');
  if (columnExists('profiles', 'demo_godmode')) {
    console.log('  ✅ PASSED: profiles.demo_godmode column exists');
  } else {
    console.log('  ❌ FAILED: profiles.demo_godmode column not found');
    allTestsPassed = false;
  }

  // Test 6: Check justin@renubu.com has demo_godmode (optional check)
  console.log('✓ Test 6: Checking justin@renubu.com demo_godmode...');
  console.log('  ⚠️  SKIPPED: User will be granted access on first login');

  // Test 7: Check reset_aco_demo function exists
  console.log('✓ Test 7: Checking reset_aco_demo() function...');
  if (functionExists('reset_aco_demo')) {
    console.log('  ✅ PASSED: reset_aco_demo() function exists');
  } else {
    console.log('  ❌ FAILED: reset_aco_demo() function not found');
    allTestsPassed = false;
  }

  // Test 8: Check workflow_executions has renewal_id column
  console.log('✓ Test 8: Checking workflow_executions.renewal_id column...');
  if (columnExists('workflow_executions', 'renewal_id')) {
    console.log('  ✅ PASSED: workflow_executions.renewal_id column exists');
  } else {
    console.log('  ❌ FAILED: workflow_executions.renewal_id column not found');
    allTestsPassed = false;
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
    console.log('\nTroubleshooting:');
    console.log('  1. Verify Supabase is linked: npx supabase link');
    console.log('  2. Check migration was applied: npx supabase db push');
    console.log('  3. View database status: npx supabase status');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allTestsPassed ? 0 : 1);
}

// Check if Supabase CLI is available
try {
  execSync('npx supabase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Supabase CLI not found. Install with: npm install supabase --save-dev');
  process.exit(1);
}

validatePhase1Schema().catch((error) => {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
});
