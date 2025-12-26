#!/usr/bin/env node
/**
 * Database Backup and Versioning Script
 * Creates timestamped backups with metadata for easy restoration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function getDatabaseStats() {
  try {
    const stats = execSync(`sqlite3 "${DB_PATH}" "
      SELECT 
        'moods' as table_name, COUNT(*) as count FROM mood
      UNION ALL SELECT 
        'mood_props' as table_name, COUNT(*) as count FROM mood_props
      UNION ALL SELECT 
        'categories' as table_name, COUNT(*) as count FROM categories
      UNION ALL SELECT 
        'mood_categories' as table_name, COUNT(*) as count FROM mood_categories
      UNION ALL SELECT 
        'entries' as table_name, COUNT(*) as count FROM entry
      UNION ALL SELECT 
        'users' as table_name, COUNT(*) as count FROM user;
    "`).toString();
    
    return stats.trim().split('\n').map(line => {
      const [table, count] = line.split('|');
      return { table, count: parseInt(count) };
    });
  } catch (error) {
    console.error('Error getting database stats:', error.message);
    return [];
  }
}

function createBackup(description = 'Automated backup') {
  const timestamp = getTimestamp();
  const backupName = `backup_${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  // Create backup directory
  fs.mkdirSync(backupPath, { recursive: true });
  
  try {
    // 1. Copy database file
    const dbBackupPath = path.join(backupPath, 'dev.db');
    fs.copyFileSync(DB_PATH, dbBackupPath);
    console.log(`✅ Database backed up to: ${dbBackupPath}`);
    
    // 2. Copy schema file
    const schemaBackupPath = path.join(backupPath, 'schema.prisma');
    fs.copyFileSync(SCHEMA_PATH, schemaBackupPath);
    console.log(`✅ Schema backed up to: ${schemaBackupPath}`);
    
    // 3. Export as SQL dump
    const sqlDumpPath = path.join(backupPath, 'database_dump.sql');
    execSync(`sqlite3 "${DB_PATH}" .dump > "${sqlDumpPath}"`);
    console.log(`✅ SQL dump created: ${sqlDumpPath}`);
    
    // 4. Export emotion data specifically
    const emotionDataPath = path.join(backupPath, 'emotion_data.sql');
    const emotionExportSQL = `
-- Enhanced Emotion System Data Export
-- Generated: ${new Date().toISOString()}

.mode insert mood
SELECT * FROM mood WHERE id >= 2;

.mode insert mood_props  
SELECT * FROM mood_props;

.mode insert categories
SELECT * FROM categories;

.mode insert mood_categories
SELECT * FROM mood_categories;
`;
    
    execSync(`sqlite3 "${DB_PATH}" "${emotionExportSQL.replace(/\n/g, ' ')}" > "${emotionDataPath}"`);
    console.log(`✅ Emotion data exported: ${emotionDataPath}`);
    
    // 5. Get database statistics
    const stats = getDatabaseStats();
    
    // 6. Create metadata file
    const metadata = {
      backupName,
      timestamp: new Date().toISOString(),
      description,
      databaseStats: stats,
      files: {
        database: 'dev.db',
        schema: 'schema.prisma',
        sqlDump: 'database_dump.sql',
        emotionData: 'emotion_data.sql'
      },
      version: {
        node: process.version,
        platform: process.platform,
        pwd: process.cwd()
      },
      emotionSystemVersion: '1.0.0'
    };
    
    const metadataPath = path.join(backupPath, 'backup_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`✅ Metadata created: ${metadataPath}`);
    
    // 7. Create restoration script
    const restoreScript = `#!/usr/bin/env node
/**
 * Restoration Script for Backup: ${backupName}
 * Created: ${new Date().toISOString()}
 * Description: ${description}
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = __dirname;
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'dev.db');
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');

console.log('🔄 Restoring database from backup: ${backupName}');
console.log('📝 Description: ${description}');

// Create backup of current state before restoration
const currentBackupName = 'pre-restore-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const currentBackupPath = path.join(PROJECT_ROOT, 'backups', currentBackupName);
fs.mkdirSync(currentBackupPath, { recursive: true });
fs.copyFileSync(DB_PATH, path.join(currentBackupPath, 'dev.db'));
fs.copyFileSync(SCHEMA_PATH, path.join(currentBackupPath, 'schema.prisma'));
console.log('💾 Current state backed up to:', currentBackupPath);

// Restore database
fs.copyFileSync(path.join(BACKUP_DIR, 'dev.db'), DB_PATH);
console.log('✅ Database restored');

// Restore schema
fs.copyFileSync(path.join(BACKUP_DIR, 'schema.prisma'), SCHEMA_PATH);
console.log('✅ Schema restored');

// Regenerate Prisma client
try {
  execSync('npx prisma generate', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  console.log('✅ Prisma client regenerated');
} catch (error) {
  console.warn('⚠️  Warning: Failed to regenerate Prisma client. Run "npx prisma generate" manually.');
}

console.log('🎉 Restoration complete!');
console.log('📍 Database stats after restoration:');

// Show restored database stats
try {
  const stats = execSync(\`sqlite3 "\${DB_PATH}" "
    SELECT 'Total moods: ' || COUNT(*) FROM mood
    UNION ALL SELECT 'Core emotions: ' || COUNT(*) FROM mood_props WHERE core = 1
    UNION ALL SELECT 'Categories: ' || COUNT(*) FROM categories
    UNION ALL SELECT 'Mood-category links: ' || COUNT(*) FROM mood_categories;
  "\`).toString();
  console.log(stats);
} catch (error) {
  console.warn('Could not retrieve database stats');
}
`;
    
    const restoreScriptPath = path.join(backupPath, 'restore.js');
    fs.writeFileSync(restoreScriptPath, restoreScript);
    fs.chmodSync(restoreScriptPath, '755');
    console.log(`✅ Restore script created: ${restoreScriptPath}`);
    
    // 8. Create README
    const readme = `# Database Backup: ${backupName}

**Created:** ${new Date().toISOString()}
**Description:** ${description}

## Contents

- \`dev.db\` - Complete SQLite database file
- \`schema.prisma\` - Prisma schema at time of backup
- \`database_dump.sql\` - Complete SQL dump for manual restoration
- \`emotion_data.sql\` - Enhanced emotion system data only
- \`backup_metadata.json\` - Backup metadata and statistics
- \`restore.js\` - Automated restoration script

## Database Statistics

${stats.map(stat => `- ${stat.table}: ${stat.count} records`).join('\n')}

## How to Restore

### Option 1: Automated Restoration (Recommended)
\`\`\`bash
node restore.js
\`\`\`

### Option 2: Manual Restoration
\`\`\`bash
# Backup current database first
cp ../../prisma/dev.db ../../prisma/dev.db.backup

# Restore database
cp dev.db ../../prisma/dev.db
cp schema.prisma ../../prisma/schema.prisma

# Regenerate Prisma client
cd ../..
npx prisma generate
\`\`\`

### Option 3: SQL Import (Fresh start)
\`\`\`bash
# Remove current database
rm ../../prisma/dev.db

# Import from SQL dump
sqlite3 ../../prisma/dev.db < database_dump.sql

# Run Prisma migrations to ensure schema sync
cd ../..
npx prisma db push
npx prisma generate
\`\`\`

## Verification

After restoration, verify the enhanced emotion system:

\`\`\`bash
# Check emotion counts
sqlite3 ../../prisma/dev.db "SELECT COUNT(*) as total_emotions FROM mood_props;"

# Check core emotions
sqlite3 ../../prisma/dev.db "SELECT COUNT(*) as core_emotions FROM mood_props WHERE core = 1;"

# Check categories
sqlite3 ../../prisma/dev.db "SELECT COUNT(*) as categories FROM categories;"
\`\`\`

Expected results:
- Total emotions: ~83
- Core emotions: ~55  
- Categories: ~57
`;
    
    const readmePath = path.join(backupPath, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.log(`✅ README created: ${readmePath}`);
    
    console.log(`\n🎉 Backup completed successfully!`);
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 Database statistics:`);
    stats.forEach(stat => console.log(`   ${stat.table}: ${stat.count} records`));
    
    return {
      success: true,
      backupPath,
      backupName,
      stats
    };
    
  } catch (error) {
    console.error(`❌ Backup failed:`, error.message);
    // Clean up partial backup
    if (fs.existsSync(backupPath)) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    }
    return {
      success: false,
      error: error.message
    };
  }
}

function listBackups() {
  try {
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(item => {
        const itemPath = path.join(BACKUP_DIR, item);
        return fs.statSync(itemPath).isDirectory() && item.startsWith('backup_');
      })
      .map(item => {
        const backupPath = path.join(BACKUP_DIR, item);
        const metadataPath = path.join(backupPath, 'backup_metadata.json');
        
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          return {
            name: item,
            path: backupPath,
            timestamp: metadata.timestamp,
            description: metadata.description,
            stats: metadata.databaseStats
          };
        }
        
        return {
          name: item,
          path: backupPath,
          timestamp: 'unknown',
          description: 'No metadata available',
          stats: []
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return backups;
  } catch (error) {
    console.error('Error listing backups:', error.message);
    return [];
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      const description = args.slice(1).join(' ') || 'Manual backup';
      createBackup(description);
      break;
      
    case 'list':
      const backups = listBackups();
      console.log(`\n📁 Available Backups (${backups.length}):\n`);
      
      if (backups.length === 0) {
        console.log('   No backups found.');
      } else {
        backups.forEach((backup, index) => {
          console.log(`${index + 1}. ${backup.name}`);
          console.log(`   📅 ${new Date(backup.timestamp).toLocaleString()}`);
          console.log(`   📝 ${backup.description}`);
          if (backup.stats && backup.stats.length > 0) {
            console.log(`   📊 ${backup.stats.map(s => `${s.table}:${s.count}`).join(', ')}`);
          }
          console.log(`   📁 ${backup.path}`);
          console.log('');
        });
      }
      break;
      
    case 'help':
    default:
      console.log(`
🗃️  Database Backup and Versioning Tool

Usage:
  node db-backup.js create [description]  - Create a new backup
  node db-backup.js list                  - List all available backups
  node db-backup.js help                  - Show this help

Examples:
  node db-backup.js create "Before major update"
  node db-backup.js create "Enhanced emotion system v1.0"
  node db-backup.js list

Backup Features:
  ✅ Complete database file copy
  ✅ Schema versioning
  ✅ SQL dump export
  ✅ Emotion data isolation
  ✅ Automated restore scripts
  ✅ Metadata and statistics
  ✅ Timestamped organization

Backup Location: ${BACKUP_DIR}
      `);
      break;
  }
}

module.exports = { createBackup, listBackups }; 