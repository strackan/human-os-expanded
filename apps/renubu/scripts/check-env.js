#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * 
 * This script validates that all required environment variables are set
 * and provides helpful information about the current configuration.
 */

require('dotenv').config({ path: '.env.local' });


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

// Required environment variables
const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
  'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID': 'Google OAuth client ID',
  'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET': 'Google OAuth client secret'
};

// Optional but recommended environment variables
const optionalEnvVars = {
  'NODE_ENV': 'Node environment (development/production)',
  'NEXT_PUBLIC_APP_URL': 'Application URL for OAuth callbacks',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (for admin operations)'
};

// Check if .env file exists
function checkEnvFile() {
  logSection('Checking Environment Files');
  
  const envFiles = [
    '.env.local',
    '.env',
    '.env.example'
  ];
  
  let envFileFound = false;
  
  envFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} exists`);
      envFileFound = true;
      
      // Check if .env.local has sensitive data
      if (file === '.env.local') {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET')) {
            logWarning(`${file} contains sensitive OAuth secrets`);
            logInfo('  Ensure this file is in .gitignore');
          }
        } catch (error) {
          logError(`Error reading ${file}: ${error.message}`);
        }
      }
    } else {
      log(`  ${file} not found`, 'blue');
    }
  });
  
  if (!envFileFound) {
    logError('No environment files found');
    logInfo('Create .env.local with your configuration');
  }
  
  return envFileFound;
}

// Check required environment variables
function checkRequiredEnvVars() {
  logSection('Checking Required Environment Variables');
  
  let allRequiredSet = true;
  
  Object.entries(requiredEnvVars).forEach(([key, description]) => {
    const value = process.env[key];
    
    if (value) {
      // Mask sensitive values
      const displayValue = key.includes('SECRET') || key.includes('KEY') 
        ? `${value.substring(0, 8)}...` 
        : value;
      
      logSuccess(`${key} is set: ${displayValue}`);
      
      // Validate Supabase URL format
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (value.includes('127.0.0.1') || value.includes('localhost')) {
          logInfo('  Local development mode detected');
        } else if (value.includes('supabase.co')) {
          logInfo('  Production Supabase instance detected');
        } else {
          logWarning('  Unexpected Supabase URL format');
        }
      }
    } else {
      logError(`${key} is not set: ${description}`);
      allRequiredSet = false;
    }
  });
  
  return allRequiredSet;
}

// Check optional environment variables
function checkOptionalEnvVars() {
  logSection('Checking Optional Environment Variables');
  
  Object.entries(optionalEnvVars).forEach(([key, description]) => {
    const value = process.env[key];
    
    if (value) {
      logSuccess(`${key} is set: ${value}`);
    } else {
      logWarning(`${key} is not set: ${description}`);
    }
  });
}

// Check Supabase configuration
function checkSupabaseConfig() {
  logSection('Checking Supabase Configuration');
  
  const configPath = path.join(__dirname, '../supabase/config.toml');
  
  if (fs.existsSync(configPath)) {
    logSuccess('Supabase config.toml exists');
    
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      
      // Check for OAuth configuration
      if (content.includes('[auth.external.google]')) {
        logSuccess('Google OAuth is configured in Supabase');
        
        if (content.includes('enabled = true')) {
          logSuccess('Google OAuth is enabled');
        } else {
          logWarning('Google OAuth is configured but may not be enabled');
        }
      } else {
        logWarning('Google OAuth configuration not found in Supabase config');
      }
      
      // Check for local development settings
      if (content.includes('127.0.0.1') || content.includes('localhost')) {
        logInfo('Local development configuration detected');
      }
      
    } catch (error) {
      logError(`Error reading Supabase config: ${error.message}`);
    }
  } else {
    logError('Supabase config.toml not found');
    logInfo('Run: npx supabase init to create configuration');
  }
}

// Check for common configuration issues
function checkCommonIssues() {
  logSection('Checking for Common Issues');
  
  let issuesFound = false;
  
  // Check if running in development mode
  if (process.env.NODE_ENV === 'production') {
    logWarning('Running in production mode');
    logInfo('Ensure all production environment variables are set');
  } else {
    logSuccess('Running in development mode');
  }
  
  // Check Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    if (supabaseUrl.includes('127.0.0.1:54321')) {
      logInfo('Using local Supabase instance');
      logInfo('Ensure Supabase is running: npx supabase status');
    } else if (supabaseUrl.includes('supabase.co')) {
      logInfo('Using remote Supabase instance');
    } else {
      logWarning('Unexpected Supabase URL format');
      issuesFound = true;
    }
  }
  
  // Check for conflicting configurations
  const isLocal = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost');
  const hasGoogleSecret = process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET;
  
  if (isLocal && hasGoogleSecret) {
    logWarning('Local development with OAuth secrets detected');
    logInfo('Ensure Google OAuth redirect URIs include localhost:3000');
  }
  
  if (!issuesFound) {
    logSuccess('No common configuration issues found');
  }
  
  return !issuesFound;
}

// Provide setup instructions
function provideSetupInstructions() {
  logSection('Setup Instructions');
  
  logInfo('To set up your environment:');
  log('  1. Copy .env.example to .env.local', 'blue');
  log('  2. Fill in your Supabase credentials', 'blue');
  log('  3. Configure Google OAuth in Google Console', 'blue');
  log('  4. Update Supabase config.toml with OAuth settings', 'blue');
  log('  5. Run: npx supabase start (for local development)', 'blue');
  
  logInfo('For OAuth setup:');
  log('  - Add http://127.0.0.1:54321/auth/v1/callback to Google OAuth', 'blue');
  log('  - Add http://localhost:3000/api/auth/callback for local development', 'blue');
}

// Main validation function
function checkEnvironment() {
  logHeader('RENUBU ENVIRONMENT CHECK');
  
  let allChecksPassed = true;
  
  // Run all checks
  const checks = [
    checkEnvFile,
    checkRequiredEnvVars,
    checkOptionalEnvVars,
    checkSupabaseConfig,
    checkCommonIssues
  ];
  
  checks.forEach(check => {
    try {
      if (check() === false) {
        allChecksPassed = false;
      }
    } catch (error) {
      logError(`Error in ${check.name}: ${error.message}`);
      allChecksPassed = false;
    }
  });
  
  // Summary
  logHeader('ENVIRONMENT CHECK SUMMARY');
  
  if (allChecksPassed) {
    logSuccess('Environment configuration is valid!');
    logInfo('Your application should be ready to run.');
  } else {
    logError('Some environment checks failed.');
    logInfo('Please review the issues above and fix them before proceeding.');
    provideSetupInstructions();
  }
  
  return allChecksPassed;
}

// Run check if called directly
if (require.main === module) {
  const success = checkEnvironment();
  process.exit(success ? 0 : 1);
}

module.exports = { checkEnvironment }; 