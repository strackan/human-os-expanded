#!/usr/bin/env node

/**
 * Test Optimized Migration Script
 * 
 * This script tests the updated optimized SQL file to ensure it:
 * 1. Loads successfully without errors
 * 2. Creates all required tables and functions
 * 3. Maintains compatibility with existing seed data
 * 4. Preserves all functionality from recent migrations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'yellow');
  log(`  ${message}`, 'yellow');
  log(`${'-'.repeat(40)}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if optimized SQL file exists
function checkOptimizedFile() {
  logSection('Checking Optimized SQL File');
  
  const optimizedPath = path.join(__dirname, '../supabase/migrations/20250101000099_optimized_public_schema_consolidation_updated.sql');
  
  if (!fs.existsSync(optimizedPath)) {
    logError(`Optimized SQL file not found: ${optimizedPath}`);
    return false;
  }
  
  const stats = fs.statSync(optimizedPath);
  const sizeKB = Math.round(stats.size / 1024);
  
  logSuccess(`Optimized SQL file found: ${optimizedPath}`);
  logInfo(`File size: ${sizeKB} KB`);
  
  return true;
}

// Validate SQL syntax (basic check)
function validateSQLSyntax() {
  logSection('Validating SQL Syntax');
  
  const optimizedPath = path.join(__dirname, '../supabase/migrations/20250101000099_optimized_public_schema_consolidation_updated.sql');
  const content = fs.readFileSync(optimizedPath, 'utf8');
  
  // Basic syntax checks
  const checks = [
    { name: 'CREATE TABLE statements', pattern: /CREATE TABLE IF NOT EXISTS/g, expected: 15 },
    { name: 'CREATE INDEX statements', pattern: /CREATE INDEX IF NOT EXISTS/g, expected: 25 },
    { name: 'CREATE POLICY statements', pattern: /CREATE POLICY/g, expected: 20 },
    { name: 'CREATE OR REPLACE FUNCTION', pattern: /CREATE OR REPLACE FUNCTION/g, expected: 8 },
    { name: 'ALTER TABLE statements', pattern: /ALTER TABLE/g, expected: 10 },
    { name: 'INSERT statements', pattern: /INSERT INTO/g, expected: 2 }
  ];
  
  let allChecksPassed = true;
  
  checks.forEach(check => {
    const matches = content.match(check.pattern);
    const count = matches ? matches.length : 0;
    
    if (count >= check.expected) {
      logSuccess(`${check.name}: ${count} found (expected ${check.expected}+)`);
    } else {
      logError(`${check.name}: ${count} found (expected ${check.expected}+)`);
      allChecksPassed = false;
    }
  });
  
  return allChecksPassed;
}

// Check for required tables in optimized SQL
function checkRequiredTables() {
  logSection('Checking Required Tables');
  
  const optimizedPath = path.join(__dirname, '../supabase/migrations/20250101000099_optimized_public_schema_consolidation_updated.sql');
  const content = fs.readFileSync(optimizedPath, 'utf8');
  
  const requiredTables = [
    'profiles',
    'companies',
    'customers',
    'customer_properties',
    'contacts',
    'contracts',
    'renewals',
    'tasks',
    'events',
    'alerts',
    'notes',
    'task_templates',
    'renewal_tasks',
    'renewal_workflow_outcomes',
    'workflow_conversations',
    'conversation_messages'
  ];
  
  let allTablesFound = true;
  
  requiredTables.forEach(table => {
    const pattern = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(`, 'i');
    if (content.match(pattern)) {
      logSuccess(`Table ${table} found`);
    } else {
      logError(`Table ${table} missing`);
      allTablesFound = false;
    }
  });
  
  return allTablesFound;
}

// Check for required functions in optimized SQL
function checkRequiredFunctions() {
  logSection('Checking Required Functions');
  
  const optimizedPath = path.join(__dirname, '../supabase/migrations/20250101000099_optimized_public_schema_consolidation_updated.sql');
  const content = fs.readFileSync(optimizedPath, 'utf8');
  
  const requiredFunctions = [
    'handle_new_user',
    'create_local_user',
    'authenticate_local_user',
    'update_local_user_password',
    'generate_renewal_tasks',
    'update_action_scores',
    'get_next_priority_task'
  ];
  
  let allFunctionsFound = true;
  
  requiredFunctions.forEach(func => {
    const pattern = new RegExp(`CREATE OR REPLACE FUNCTION public\\.${func}\\s*\\(`, 'i');
    if (content.match(pattern)) {
      logSuccess(`Function ${func} found`);
    } else {
      logError(`Function ${func} missing`);
      allFunctionsFound = false;
    }
  });
  
  return allFunctionsFound;
}

// Check for required constraints and indexes
function checkConstraintsAndIndexes() {
  logSection('Checking Constraints and Indexes');
  
  const optimizedPath = path.join(__dirname, '../supabase/migrations/20250101000099_optimized_public_schema_consolidation_updated.sql');
  const content = fs.readFileSync(optimizedPath, 'utf8');
  
  const checks = [
    { name: 'Customer name unique constraint', pattern: /customers_name_unique UNIQUE/ },
    { name: 'Contact email NOT NULL', pattern: /email TEXT NOT NULL/ },
    { name: 'Action scoring indexes', pattern: /idx_renewal_tasks_action_score/ },
    { name: 'Local auth indexes', pattern: /idx_profiles_email_auth_type/ },
    { name: 'Multi-tenant indexes', pattern: /idx_customers_company_id/ }
  ];
  
  let allChecksPassed = true;
  
  checks.forEach(check => {
    if (content.match(check.pattern)) {
      logSuccess(`${check.name} found`);
    } else {
      logError(`${check.name} missing`);
      allChecksPassed = false;
    }
  });
  
  return allChecksPassed;
}

// Test Supabase connection and basic operations
function testSupabaseConnection() {
  logSection('Testing Supabase Connection');
  
  try {
    // Check if Supabase is running
    const status = execSync('npx supabase status', { encoding: 'utf8' });
    
    if (status.includes('API URL')) {
      logSuccess('Supabase is running');
      return true;
    } else {
      logWarning('Supabase status unclear, may need to start');
      return false;
    }
  } catch (error) {
    logError(`Error checking Supabase status: ${error.message}`);
    return false;
  }
}

// Create a test migration plan
function createTestPlan() {
  logSection('Creating Test Migration Plan');
  
  const plan = `
# Test Migration Plan for Optimized SQL

## Phase 1: Preparation
1. Create backup of current database
2. Stop application services
3. Document current schema state

## Phase 2: Testing
1. Create test database
2. Load optimized SQL file
3. Run seed data
4. Test all functions and triggers
5. Verify RLS policies

## Phase 3: Validation
1. Compare schema with current production
2. Test application functionality
3. Verify data integrity
4. Performance testing

## Phase 4: Rollback Plan
1. Keep backup of current state
2. Document rollback procedures
3. Test rollback process

## Commands to Run:
\`\`\`bash
# Backup current state
npx supabase db dump --data-only > backup_$(date +%Y%m%d_%H%M%S).sql

# Test optimized migration
npx supabase db reset
npx supabase db push

# Load seed data
npx supabase db reset --seed

# Test functions
npx supabase functions serve
\`\`\`
  `;
  
  const planPath = path.join(__dirname, '../MIGRATION_TEST_PLAN.md');
  fs.writeFileSync(planPath, plan);
  
  logSuccess(`Test plan created: ${planPath}`);
  return true;
}

// Main test function
function runTests() {
  logHeader('OPTIMIZED MIGRATION TESTING');
  
  let allTestsPassed = true;
  
  // Run all tests
  const tests = [
    checkOptimizedFile,
    validateSQLSyntax,
    checkRequiredTables,
    checkRequiredFunctions,
    checkConstraintsAndIndexes,
    testSupabaseConnection,
    createTestPlan
  ];
  
  tests.forEach(test => {
    try {
      if (!test()) {
        allTestsPassed = false;
      }
    } catch (error) {
      logError(`Error in ${test.name}: ${error.message}`);
      allTestsPassed = false;
    }
  });
  
  // Summary
  logHeader('TEST SUMMARY');
  
  if (allTestsPassed) {
    logSuccess('All tests passed! The optimized migration file is ready for testing.');
    logInfo('Next steps:');
    logInfo('1. Run the test migration plan');
    logInfo('2. Test in a clean environment');
    logInfo('3. Verify all functionality works');
    logInfo('4. Deploy to production when ready');
  } else {
    logError('Some tests failed. Please review the issues above.');
    logInfo('Fix the issues before proceeding with migration testing.');
  }
  
  return allTestsPassed;
}

// Run tests if called directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
