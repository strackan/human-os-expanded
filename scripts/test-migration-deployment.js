#!/usr/bin/env node

/**
 * Migration Deployment Test Script
 * 
 * This script helps test the optimized migration in a clean environment.
 * It provides step-by-step guidance for testing the migration.
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

function logCommand(command) {
  log(`\n$ ${command}`, 'magenta');
}

// Check if Supabase is running
function checkSupabaseStatus() {
  logSection('Checking Supabase Status');
  
  try {
    const status = execSync('npx supabase status', { encoding: 'utf8' });
    
    if (status.includes('API URL')) {
      logSuccess('Supabase is running');
      return true;
    } else {
      logWarning('Supabase status unclear');
      return false;
    }
  } catch (error) {
    logError(`Error checking Supabase status: ${error.message}`);
    return false;
  }
}

// Create backup
function createBackup() {
  logSection('Creating Database Backup');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup_${timestamp}.sql`;
  
  logInfo(`Creating backup: ${backupFile}`);
  logCommand(`npx supabase db dump --data-only > ${backupFile}`);
  
  try {
    execSync(`npx supabase db dump --data-only > ${backupFile}`, { encoding: 'utf8' });
    logSuccess(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logError(`Failed to create backup: ${error.message}`);
    logWarning('Continuing without backup...');
    return null;
  }
}

// Test migration in clean environment
function testMigration() {
  logSection('Testing Optimized Migration');
  
  logInfo('This will reset the database and apply the optimized migration.');
  logWarning('Make sure you have a backup before proceeding!');
  
  logCommand('npx supabase db reset');
  logCommand('npx supabase db push');
  
  logInfo('After running these commands, check for any errors.');
  logInfo('If successful, proceed to load seed data.');
}

// Load seed data
function loadSeedData() {
  logSection('Loading Seed Data');
  
  logInfo('Loading seed data to test the migration...');
  logCommand('npx supabase db reset --seed');
  
  logInfo('After loading seed data, verify that:');
  logInfo('1. All tables are created correctly');
  logInfo('2. Seed data is loaded properly');
  logInfo('3. No errors in the console');
}

// Test functions
function testFunctions() {
  logSection('Testing Functions');
  
  logInfo('Test the following functions in the Supabase dashboard:');
  
  const functions = [
    'handle_new_user()',
    'create_local_user()',
    'authenticate_local_user()',
    'update_local_user_password()',
    'generate_renewal_tasks()',
    'update_action_scores()',
    'get_next_priority_task()'
  ];
  
  functions.forEach(func => {
    logInfo(`- ${func}`);
  });
  
  logInfo('\nYou can test these in the Supabase SQL Editor.');
}

// Test application functionality
function testApplication() {
  logSection('Testing Application Functionality');
  
  logInfo('Start the application and test:');
  logInfo('1. User authentication (OAuth and local)');
  logInfo('2. Customer management');
  logInfo('3. Renewal workflows');
  logInfo('4. Task management');
  logInfo('5. Action scoring system');
  logInfo('6. Workflow conversations');
  
  logCommand('npm run dev');
  
  logInfo('Check the browser console for any errors.');
  logInfo('Verify all features work as expected.');
}

// Main test function
function runMigrationTest() {
  logHeader('OPTIMIZED MIGRATION DEPLOYMENT TEST');
  
  logInfo('This script will guide you through testing the optimized migration.');
  logInfo('Follow each step carefully and check for errors.');
  
  // Step 1: Check Supabase status
  if (!checkSupabaseStatus()) {
    logError('Supabase is not running. Please start it first.');
    logCommand('npx supabase start');
    return false;
  }
  
  // Step 2: Create backup
  const backupFile = createBackup();
  
  // Step 3: Test migration
  testMigration();
  
  // Step 4: Load seed data
  loadSeedData();
  
  // Step 5: Test functions
  testFunctions();
  
  // Step 6: Test application
  testApplication();
  
  // Summary
  logHeader('TEST SUMMARY');
  
  logSuccess('Migration test steps completed!');
  logInfo('');
  logInfo('Next steps:');
  logInfo('1. Run the commands shown above');
  logInfo('2. Check for any errors at each step');
  logInfo('3. Verify all functionality works');
  logInfo('4. If successful, the migration is ready for production');
  logInfo('');
  
  if (backupFile) {
    logInfo(`Backup file: ${backupFile}`);
    logInfo('Keep this backup until you confirm everything works.');
  }
  
  logWarning('If you encounter any issues, you can restore from the backup.');
  
  return true;
}

// Run test if called directly
if (require.main === module) {
  const success = runMigrationTest();
  process.exit(success ? 0 : 1);
}

module.exports = { runMigrationTest };
