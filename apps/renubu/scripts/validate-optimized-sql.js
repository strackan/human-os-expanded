#!/usr/bin/env node

/**
 * Simple Optimized SQL Validation Script
 * 
 * This script validates the updated optimized SQL file to ensure it:
 * 1. Has all required tables and functions
 * 2. Maintains compatibility with existing seed data
 * 3. Includes all functionality from recent migrations
 */

const fs = require('fs');
const path = require('path');

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

// Main validation function
function validateOptimizedSQL() {
  logHeader('OPTIMIZED SQL VALIDATION');
  
  const optimizedPath = path.join(__dirname, '../supabase/migrations/20250101000099_optimized_public_schema_consolidation.sql');
  
  if (!fs.existsSync(optimizedPath)) {
    logError(`Optimized SQL file not found: ${optimizedPath}`);
    return false;
  }
  
  const content = fs.readFileSync(optimizedPath, 'utf8');
  const stats = fs.statSync(optimizedPath);
  const sizeKB = Math.round(stats.size / 1024);
  
  logSuccess(`Optimized SQL file found: ${sizeKB} KB`);
  
  // Check for required tables
  logSection('Checking Required Tables');
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
  
  // Check for required functions
  logSection('Checking Required Functions');
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
  
  // Check for key features
  logSection('Checking Key Features');
  const keyFeatures = [
    { name: 'Local Authentication Support', pattern: /auth_type TEXT DEFAULT 'oauth'/ },
    { name: 'Multi-tenant Support', pattern: /company_id UUID REFERENCES public\.companies/ },
    { name: 'Action Scoring System', pattern: /action_score DECIMAL DEFAULT 0/ },
    { name: 'Customer Name Unique Constraint', pattern: /customers_name_unique UNIQUE/ },
    { name: 'Contact Email Required', pattern: /email TEXT NOT NULL/ },
    { name: 'RLS Policies', pattern: /CREATE POLICY/ },
    { name: 'Performance Indexes', pattern: /CREATE INDEX IF NOT EXISTS/ },
    { name: 'Task Templates', pattern: /task_templates/ },
    { name: 'Workflow Conversations', pattern: /workflow_conversations/ }
  ];
  
  let allFeaturesFound = true;
  keyFeatures.forEach(feature => {
    if (content.match(feature.pattern)) {
      logSuccess(`${feature.name} found`);
    } else {
      logError(`${feature.name} missing`);
      allFeaturesFound = false;
    }
  });
  
  // Check for potential issues
  logSection('Checking for Potential Issues');
  const potentialIssues = [
    { name: 'MVP Schema References (in code)', pattern: /(?<!-{2,}.*)mvp\./g, shouldNotExist: true },
    { name: 'Constraint Management', pattern: /DROP CONSTRAINT IF EXISTS/g, shouldExist: true },
    { name: 'Proper Foreign Keys', pattern: /REFERENCES public\./g, shouldExist: true }
  ];
  
  let noIssuesFound = true;
  potentialIssues.forEach(issue => {
    let matches = content.match(issue.pattern);
    let count = matches ? matches.length : 0;
    
    // Special handling for MVP references - exclude comments
    if (issue.name.includes('MVP Schema References')) {
      const lines = content.split('\n');
      count = 0;
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('mvp.') && !trimmedLine.startsWith('--')) {
          count++;
        }
      }
    }
    
    if (issue.shouldNotExist && count > 0) {
      logError(`${issue.name}: ${count} found (should not exist)`);
      noIssuesFound = false;
    } else if (issue.shouldExist && count === 0) {
      logError(`${issue.name}: not found (should exist)`);
      noIssuesFound = false;
    } else if (issue.shouldExist && count > 0) {
      logSuccess(`${issue.name}: ${count} found`);
    } else {
      logSuccess(`${issue.name}: none found (good)`);
    }
  });
  
  // Summary
  logHeader('VALIDATION SUMMARY');
  
  const allChecksPassed = allTablesFound && allFunctionsFound && allFeaturesFound && noIssuesFound;
  
  if (allChecksPassed) {
    logSuccess('All validation checks passed!');
    logInfo('The optimized SQL file is ready for testing.');
    logInfo('');
    logInfo('Next steps:');
    logInfo('1. Test the migration in a clean environment');
    logInfo('2. Verify all functionality works correctly');
    logInfo('3. Test with seed data');
    logInfo('4. Deploy to production when ready');
  } else {
    logError('Some validation checks failed.');
    logInfo('Please review the issues above before proceeding.');
  }
  
  // Statistics
  logSection('File Statistics');
  const tableCount = (content.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
  const functionCount = (content.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
  const indexCount = (content.match(/CREATE INDEX IF NOT EXISTS/g) || []).length;
  const policyCount = (content.match(/CREATE POLICY/g) || []).length;
  
  logInfo(`Tables: ${tableCount}`);
  logInfo(`Functions: ${functionCount}`);
  logInfo(`Indexes: ${indexCount}`);
  logInfo(`Policies: ${policyCount}`);
  logInfo(`File size: ${sizeKB} KB`);
  
  return allChecksPassed;
}

// Run validation if called directly
if (require.main === module) {
  const success = validateOptimizedSQL();
  process.exit(success ? 0 : 1);
}

module.exports = { validateOptimizedSQL };
