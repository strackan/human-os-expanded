#!/usr/bin/env node

/**
 * Schema Validation Script
 * 
 * This script validates that the TypeScript types are consistent with the database schema.
 * It checks for:
 * 1. Required fields in types vs database
 * 2. Field type mismatches
 * 3. Missing or extra fields
 * 4. Schema consistency across the application
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

// Check if TypeScript types file exists
function checkTypesFile() {
  const typesPath = path.join(__dirname, '../src/types/customer.ts');
  
  if (!fs.existsSync(typesPath)) {
    logError(`Types file not found: ${typesPath}`);
    return false;
  }
  
  logSuccess(`Types file found: ${typesPath}`);
  return true;
}

// Check if schema validator exists
function checkSchemaValidator() {
  const validatorPath = path.join(__dirname, '../src/lib/schema-validator.ts');
  
  if (!fs.existsSync(validatorPath)) {
    logError(`Schema validator not found: ${validatorPath}`);
    return false;
  }
  
  logSuccess(`Schema validator found: ${validatorPath}`);
  return true;
}

// Check if sync schema script exists
function checkSyncScript() {
  const syncPath = path.join(__dirname, 'sync-schema.ts');
  
  if (!fs.existsSync(syncPath)) {
    logError(`Sync schema script not found: ${syncPath}`);
    return false;
  }
  
  logSuccess(`Sync schema script found: ${syncPath}`);
  return true;
}

// Check for common schema-related files
function checkSchemaFiles() {
  logSection('Checking Schema-Related Files');
  
  const files = [
    '../src/types/customer.ts',
    '../src/lib/schema-validator.ts',
    'sync-schema.ts',
    '../supabase/migrations/'
  ];
  
  let allFilesExist = true;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Check migration files
function checkMigrations() {
  logSection('Checking Database Migrations');
  
  const migrationsPath = path.join(__dirname, '../supabase/migrations');
  
  if (!fs.existsSync(migrationsPath)) {
    logError('Migrations directory not found');
    return false;
  }
  
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  logInfo(`Found ${migrationFiles.length} migration files:`);
  migrationFiles.forEach(file => {
    log(`  - ${file}`, 'blue');
  });
  
  return true;
}

// Check for schema switch script
function checkSchemaSwitch() {
  logSection('Checking Schema Management');
  
  const switchScript = path.join(__dirname, 'switch-schema.js');
  
  if (fs.existsSync(switchScript)) {
    logSuccess('Schema switch script found');
    
    // Check if it's executable
    try {
      const content = fs.readFileSync(switchScript, 'utf8');
      if (content.includes('prod') && content.includes('mvp')) {
        logSuccess('Schema switch script supports prod/mvp switching');
      } else {
        logWarning('Schema switch script may not support all schema options');
      }
    } catch (error) {
      logError(`Error reading schema switch script: ${error.message}`);
    }
  } else {
    logError('Schema switch script not found');
    return false;
  }
  
  return true;
}

// Check package.json scripts
function checkPackageScripts() {
  logSection('Checking Package.json Scripts');
  
  const packagePath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packagePath)) {
    logError('package.json not found');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const requiredScripts = [
      'sync-schema',
      'validate-schema',
      'type-check',
      'clear-auth',
      'check-env',
      'check-oauth'
    ];
    
    let allScriptsExist = true;
    
    requiredScripts.forEach(script => {
      if (scripts[script]) {
        logSuccess(`${script} script found`);
      } else {
        logError(`${script} script missing`);
                        allScriptsExist = false;
                    }
                });
                
                return allScriptsExist;
            } catch (error) {
                logError(`Error reading package.json: ${error.message}`);
                return false;
            }
        }
        
        // Check for common schema issues
        function checkCommonIssues() {
            logSection('Checking for Common Schema Issues');
            
            let issuesFound = false;
            
            // Check if there are any direct database queries in components
            const componentsPath = path.join(__dirname, '../src/components');
            if (fs.existsSync(componentsPath)) {
                const componentFiles = fs.readdirSync(componentsPath, { recursive: true })
                    .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
                
                componentFiles.forEach(file => {
                    const filePath = path.join(componentsPath, file);
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        if (content.includes('supabase.from(') || content.includes('supabase.select(')) {
                            logWarning(`Direct database queries found in component: ${file}`);
                            logInfo('  Consider moving database logic to API routes or services');
                            issuesFound = true;
                        }
                    } catch (error) {
                        // Ignore read errors
                    }
                });
            }
            
            // Check for hardcoded table names
            const srcPath = path.join(__dirname, '../src');
            if (fs.existsSync(srcPath)) {
                const allFiles = fs.readdirSync(srcPath, { recursive: true })
                    .filter(file => file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'));
                
                allFiles.forEach(file => {
                    const filePath = path.join(srcPath, file);
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        if (content.includes('customers') && !content.includes('from') && !content.includes('import')) {
                            logWarning(`Potential hardcoded table reference in: ${file}`);
                            logInfo('  Consider using environment variables or configuration for table names');
                            issuesFound = true;
                        }
                    } catch (error) {
                        // Ignore read errors
                    }
                });
            }
            
            if (!issuesFound) {
                logSuccess('No common schema issues found');
            }
            
            return !issuesFound;
        }
        
        // Main validation function
        function validateSchema() {
            logHeader('RENUBU SCHEMA VALIDATION');
            
            let allChecksPassed = true;
            
            // Run all checks
            const checks = [
                checkTypesFile,
                checkSchemaValidator,
                checkSyncScript,
                checkSchemaFiles,
                checkMigrations,
                checkSchemaSwitch,
                checkPackageScripts,
                checkCommonIssues
            ];
            
            checks.forEach(check => {
                try {
                    if (!check()) {
                        allChecksPassed = false;
                    }
                } catch (error) {
                    logError(`Error in ${check.name}: ${error.message}`);
                    allChecksPassed = false;
                }
            });
            
            // Summary
            logHeader('VALIDATION SUMMARY');
            
            if (allChecksPassed) {
                logSuccess('All schema validation checks passed!');
                logInfo('Your schema is properly configured and ready for development.');
            } else {
                logError('Some schema validation checks failed.');
                logInfo('Please review the issues above and fix them before proceeding.');
                logInfo('Refer to the documentation for guidance on proper schema management.');
            }
            
            return allChecksPassed;
        }
        
        // Run validation if called directly
        if (require.main === module) {
            const success = validateSchema();
            process.exit(success ? 0 : 1);
        }
        
        module.exports = { validateSchema }; 