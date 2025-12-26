#!/usr/bin/env node
/**
 * Database Version Management Script
 * Tracks schema changes and maintains version history
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const VERSION_DIR = path.join(__dirname, '..', 'db-versions');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'prisma', 'migrations');
const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const SEEDS_DIR = path.join(__dirname, '..', 'prisma', 'seeds');

// Ensure directories exist
[VERSION_DIR, SEEDS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function getSchemaHash() {
  if (!fs.existsSync(SCHEMA_PATH)) return null;
  const content = fs.readFileSync(SCHEMA_PATH, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(item => {
      const itemPath = path.join(MIGRATIONS_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .sort()
    .map(migrationDir => {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationDir);
      const sqlFile = path.join(migrationPath, 'migration.sql');
      
      return {
        name: migrationDir,
        path: migrationPath,
        sqlFile: sqlFile,
        exists: fs.existsSync(sqlFile),
        timestamp: migrationDir.substring(0, 14), // Extract timestamp
        description: migrationDir.substring(15) // Extract description
      };
    });
}

function getCurrentVersion() {
  const versionFile = path.join(VERSION_DIR, 'current-version.json');
  if (!fs.existsSync(versionFile)) {
    return {
      version: '0.0.0',
      schemaHash: null,
      lastMigration: null,
      timestamp: null
    };
  }
  
  return JSON.parse(fs.readFileSync(versionFile, 'utf8'));
}

function saveVersion(versionData) {
  const versionFile = path.join(VERSION_DIR, 'current-version.json');
  fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
  
  // Also save a historical record
  const historyFile = path.join(VERSION_DIR, `version-${versionData.version}-${Date.now()}.json`);
  fs.writeFileSync(historyFile, JSON.stringify(versionData, null, 2));
}

function incrementVersion(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function createVersionSnapshot(description, versionType = 'patch') {
  const currentVer = getCurrentVersion();
  const schemaHash = getSchemaHash();
  const migrations = getMigrationFiles();
  const lastMigration = migrations.length > 0 ? migrations[migrations.length - 1] : null;
  
  // Check if anything has changed
  const hasSchemaChanged = schemaHash !== currentVer.schemaHash;
  const hasMigrationChanged = lastMigration && lastMigration.name !== currentVer.lastMigration;
  
  if (!hasSchemaChanged && !hasMigrationChanged) {
    console.log('ℹ️  No changes detected. Version remains at', currentVer.version);
    return currentVer;
  }
  
  const newVersion = incrementVersion(currentVer.version, versionType);
  const timestamp = new Date().toISOString();
  
  const versionData = {
    version: newVersion,
    schemaHash,
    lastMigration: lastMigration ? lastMigration.name : null,
    timestamp,
    description,
    changes: {
      schemaChanged: hasSchemaChanged,
      migrationChanged: hasMigrationChanged,
      previousVersion: currentVer.version,
      previousSchemaHash: currentVer.schemaHash,
      previousMigration: currentVer.lastMigration
    },
    migrations: migrations.map(m => ({
      name: m.name,
      timestamp: m.timestamp,
      description: m.description
    })),
    emotionSystemVersion: getEmotionSystemVersion()
  };
  
  // Create snapshot directory
  const snapshotDir = path.join(VERSION_DIR, `v${newVersion}`);
  fs.mkdirSync(snapshotDir, { recursive: true });
  
  // Copy schema
  if (fs.existsSync(SCHEMA_PATH)) {
    fs.copyFileSync(SCHEMA_PATH, path.join(snapshotDir, 'schema.prisma'));
  }
  
  // Copy all migrations
  const migrationsSnapshotDir = path.join(snapshotDir, 'migrations');
  if (fs.existsSync(MIGRATIONS_DIR)) {
    execSync(`cp -r "${MIGRATIONS_DIR}" "${migrationsSnapshotDir}"`);
  }
  
  // Create version manifest
  const manifestPath = path.join(snapshotDir, 'version-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(versionData, null, 2));
  
  // Create restoration script for this version
  const restoreScript = createVersionRestoreScript(versionData, snapshotDir);
  const restoreScriptPath = path.join(snapshotDir, 'restore-version.js');
  fs.writeFileSync(restoreScriptPath, restoreScript);
  fs.chmodSync(restoreScriptPath, '755');
  
  // Update current version
  saveVersion(versionData);
  
  console.log(`✅ Version ${newVersion} created successfully`);
  console.log(`📁 Snapshot: ${snapshotDir}`);
  console.log(`📝 Description: ${description}`);
  console.log(`🔄 Changes:`);
  if (hasSchemaChanged) console.log(`   - Schema updated (${currentVer.schemaHash} → ${schemaHash})`);
  if (hasMigrationChanged) console.log(`   - New migration: ${lastMigration.name}`);
  
  return versionData;
}

function createVersionRestoreScript(versionData, snapshotDir) {
  return `#!/usr/bin/env node
/**
 * Database Version Restoration Script
 * Restores to Version: ${versionData.version}
 * Created: ${versionData.timestamp}
 * Description: ${versionData.description}
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SNAPSHOT_DIR = __dirname;
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'prisma', 'migrations');
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db');

console.log('🔄 Restoring database to version: ${versionData.version}');
console.log('📝 Description: ${versionData.description}');
console.log('📅 Created: ${new Date(versionData.timestamp).toLocaleString()}');

// Backup current state
const backupDir = path.join(PROJECT_ROOT, 'backups', 'pre-version-restore-' + Date.now());
fs.mkdirSync(backupDir, { recursive: true });

if (fs.existsSync(DB_PATH)) {
  fs.copyFileSync(DB_PATH, path.join(backupDir, 'dev.db'));
}
if (fs.existsSync(SCHEMA_PATH)) {
  fs.copyFileSync(SCHEMA_PATH, path.join(backupDir, 'schema.prisma'));
}
if (fs.existsSync(MIGRATIONS_DIR)) {
  execSync(\`cp -r "\${MIGRATIONS_DIR}" "\${backupDir}/migrations"\`);
}
console.log('💾 Current state backed up to:', backupDir);

// Restore schema
const snapshotSchema = path.join(SNAPSHOT_DIR, 'schema.prisma');
if (fs.existsSync(snapshotSchema)) {
  fs.copyFileSync(snapshotSchema, SCHEMA_PATH);
  console.log('✅ Schema restored to version ${versionData.version}');
}

// Restore migrations
const snapshotMigrations = path.join(SNAPSHOT_DIR, 'migrations');
if (fs.existsSync(snapshotMigrations)) {
  if (fs.existsSync(MIGRATIONS_DIR)) {
    fs.rmSync(MIGRATIONS_DIR, { recursive: true, force: true });
  }
  execSync(\`cp -r "\${snapshotMigrations}" "\${MIGRATIONS_DIR}"\`);
  console.log('✅ Migrations restored to version ${versionData.version}');
}

// Reset database and apply migrations
try {
  // Remove current database
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  
  // Apply migrations
  execSync('npx prisma migrate deploy', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  console.log('✅ Database migrations applied');
  
  // Generate Prisma client
  execSync('npx prisma generate', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  console.log('✅ Prisma client regenerated');
  
} catch (error) {
  console.error('❌ Error during database restoration:', error.message);
  console.log('💡 You may need to manually run:');
  console.log('   npx prisma migrate deploy');
  console.log('   npx prisma generate');
}

console.log('🎉 Version restoration complete!');
console.log('📊 Restored to version ${versionData.version}');
`;
}

function getEmotionSystemVersion() {
  // Check if emotion system tables exist and count records
  try {
    const { execSync } = require('child_process');
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    
    if (!fs.existsSync(dbPath)) return 'not-initialized';
    
    const result = execSync(`sqlite3 "${dbPath}" "
      SELECT 
        (SELECT COUNT(*) FROM mood_props) as emotions,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM mood_categories) as mappings;
    "`).toString().trim();
    
    const [emotions, categories, mappings] = result.split('|').map(Number);
    
    if (emotions >= 80 && categories >= 50) {
      return '1.0.0'; // Enhanced emotion system
    } else if (emotions > 0) {
      return '0.1.0'; // Basic emotion system
    } else {
      return '0.0.0'; // No emotions
    }
  } catch (error) {
    return 'unknown';
  }
}

function listVersions() {
  const versionFiles = fs.readdirSync(VERSION_DIR)
    .filter(file => file.startsWith('version-') && file.endsWith('.json'))
    .map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(VERSION_DIR, file), 'utf8'));
      return {
        ...data,
        file
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return versionFiles;
}

function validateDatabase() {
  const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
  
  if (!fs.existsSync(dbPath)) {
    return {
      valid: false,
      error: 'Database file not found',
      checks: []
    };
  }
  
  const checks = [];
  
  try {
    // Check table existence
    const tables = execSync(`sqlite3 "${dbPath}" ".tables"`).toString().trim().split(/\s+/);
    const requiredTables = ['mood', 'mood_props', 'categories', 'mood_categories'];
    
    requiredTables.forEach(table => {
      const exists = tables.includes(table);
      checks.push({
        check: `Table ${table} exists`,
        passed: exists,
        details: exists ? '✅' : '❌ Missing required table'
      });
    });
    
    // Check emotion system data
    const emotionCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM mood_props;"`).toString().trim();
    checks.push({
      check: 'Emotion data populated',
      passed: parseInt(emotionCount) > 0,
      details: `${emotionCount} emotions found`
    });
    
    const categoriesCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM categories;"`).toString().trim();
    checks.push({
      check: 'Categories populated',
      passed: parseInt(categoriesCount) > 0,
      details: `${categoriesCount} categories found`
    });
    
    const coreEmotionsCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) FROM mood_props WHERE core = 1;"`).toString().trim();
    checks.push({
      check: 'Core emotions marked',
      passed: parseInt(coreEmotionsCount) > 0,
      details: `${coreEmotionsCount} core emotions found`
    });
    
    // Check schema integrity
    const schemaHash = getSchemaHash();
    checks.push({
      check: 'Schema file exists',
      passed: schemaHash !== null,
      details: schemaHash ? `Hash: ${schemaHash}` : 'Schema file missing'
    });
    
    const allPassed = checks.every(check => check.passed);
    
    return {
      valid: allPassed,
      checks,
      summary: {
        emotions: parseInt(emotionCount),
        categories: parseInt(categoriesCount),
        coreEmotions: parseInt(coreEmotionsCount),
        schemaHash
      }
    };
    
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      checks
    };
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      const description = args.slice(2).join(' ') || 'Manual version snapshot';
      const versionType = args[1] || 'patch'; // major, minor, patch
      createVersionSnapshot(description, versionType);
      break;
      
    case 'list':
      const versions = listVersions();
      console.log(`\n📋 Database Versions (${versions.length}):\n`);
      
      if (versions.length === 0) {
        console.log('   No versions found.');
      } else {
        versions.forEach((version, index) => {
          console.log(`${index + 1}. Version ${version.version}`);
          console.log(`   📅 ${new Date(version.timestamp).toLocaleString()}`);
          console.log(`   📝 ${version.description}`);
          console.log(`   🏗️  Emotion System: ${version.emotionSystemVersion}`);
          if (version.changes) {
            const changes = [];
            if (version.changes.schemaChanged) changes.push('schema');
            if (version.changes.migrationChanged) changes.push('migrations');
            if (changes.length > 0) {
              console.log(`   🔄 Changes: ${changes.join(', ')}`);
            }
          }
          console.log('');
        });
      }
      break;
      
    case 'current':
      const current = getCurrentVersion();
      console.log(`\n📊 Current Database Version:\n`);
      console.log(`Version: ${current.version}`);
      console.log(`Schema Hash: ${current.schemaHash || 'unknown'}`);
      console.log(`Last Migration: ${current.lastMigration || 'none'}`);
      console.log(`Timestamp: ${current.timestamp ? new Date(current.timestamp).toLocaleString() : 'unknown'}`);
      console.log(`Emotion System: ${getEmotionSystemVersion()}`);
      break;
      
    case 'validate':
      const validation = validateDatabase();
      console.log(`\n🔍 Database Validation:\n`);
      console.log(`Overall Status: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (validation.error) {
        console.log(`Error: ${validation.error}`);
      }
      
      if (validation.checks && validation.checks.length > 0) {
        console.log(`\nChecks:`);
        validation.checks.forEach(check => {
          console.log(`  ${check.passed ? '✅' : '❌'} ${check.check}: ${check.details}`);
        });
      }
      
      if (validation.summary) {
        console.log(`\nSummary:`);
        console.log(`  Emotions: ${validation.summary.emotions}`);
        console.log(`  Categories: ${validation.summary.categories}`);
        console.log(`  Core Emotions: ${validation.summary.coreEmotions}`);
        console.log(`  Schema Hash: ${validation.summary.schemaHash}`);
      }
      break;
      
    case 'help':
    default:
      console.log(`
📊 Database Version Management Tool

Usage:
  node db-version.js create [major|minor|patch] [description]  - Create version snapshot
  node db-version.js list                                     - List all versions
  node db-version.js current                                  - Show current version
  node db-version.js validate                                 - Validate database integrity
  node db-version.js help                                     - Show this help

Examples:
  node db-version.js create patch "Bug fixes"
  node db-version.js create minor "Enhanced emotion system"
  node db-version.js create major "Complete database redesign"
  node db-version.js list
  node db-version.js validate

Version Types:
  major - Breaking changes (1.0.0 → 2.0.0)
  minor - New features (1.0.0 → 1.1.0)  
  patch - Bug fixes (1.0.0 → 1.0.1)

Features:
  ✅ Semantic versioning
  ✅ Schema snapshots
  ✅ Migration tracking
  ✅ Automated restoration scripts
  ✅ Database validation
  ✅ Change detection

Version Storage: ${VERSION_DIR}
      `);
      break;
  }
}

module.exports = { 
  createVersionSnapshot, 
  getCurrentVersion, 
  listVersions, 
  validateDatabase,
  getEmotionSystemVersion
}; 