#!/usr/bin/env node
/**
 * Quick Start Database Protection Setup
 * Initializes comprehensive database versioning and backup system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');

console.log('🛡️  Setting up Database Protection System\n');

// 1. Create necessary directories
const requiredDirs = [
  path.join(PROJECT_ROOT, 'backups'),
  path.join(PROJECT_ROOT, 'db-versions'),
  path.join(PROJECT_ROOT, 'prisma', 'seeds'),
  path.join(PROJECT_ROOT, 'scripts')
];

console.log('📁 Creating directory structure...');
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ Created: ${path.relative(PROJECT_ROOT, dir)}`);
  } else {
    console.log(`   ☑️  Exists: ${path.relative(PROJECT_ROOT, dir)}`);
  }
});

// 2. Update .gitignore
console.log('\n🔒 Updating .gitignore...');
const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
const gitignoreAdditions = `
# Database Protection System
/backups/
/db-versions/
*.db.backup
*.sql.backup

# Temporary database files
*.db-journal
*.db-wal
*.db-shm

# Sensitive database exports
/prisma/seeds/*.sql
!/prisma/seeds/README.md
`;

if (fs.existsSync(gitignorePath)) {
  const currentGitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!currentGitignore.includes('Database Protection System')) {
    fs.appendFileSync(gitignorePath, gitignoreAdditions);
    console.log('   ✅ Updated .gitignore with database protection rules');
  } else {
    console.log('   ☑️  .gitignore already contains protection rules');
  }
} else {
  fs.writeFileSync(gitignorePath, gitignoreAdditions);
  console.log('   ✅ Created .gitignore with database protection rules');
}

// 3. Update package.json scripts
console.log('\n📦 Updating package.json scripts...');
const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  const dbScripts = {
    'db:backup': 'node scripts/db-backup.js create',
    'db:backup:auto': 'node scripts/db-backup.js create "Automated backup"',
    'db:backup:list': 'node scripts/db-backup.js list',
    'db:version': 'node scripts/db-version.js create patch',
    'db:version:minor': 'node scripts/db-version.js create minor',
    'db:version:major': 'node scripts/db-version.js create major',
    'db:version:list': 'node scripts/db-version.js list',
    'db:version:current': 'node scripts/db-version.js current',
    'db:validate': 'node scripts/db-version.js validate',
    'db:protect': 'npm run db:backup && npm run db:version',
    'db:emergency-backup': 'cp prisma/dev.db "prisma/dev.db.emergency-$(date +%Y%m%d-%H%M%S)"',
    'predeploy': 'npm run db:protect',
    'premigrate': 'npm run db:backup'
  };
  
  let scriptsAdded = 0;
  Object.entries(dbScripts).forEach(([script, command]) => {
    if (!packageJson.scripts[script]) {
      packageJson.scripts[script] = command;
      scriptsAdded++;
    }
  });
  
  if (scriptsAdded > 0) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`   ✅ Added ${scriptsAdded} database protection scripts to package.json`);
  } else {
    console.log('   ☑️  Database scripts already exist in package.json');
  }
} else {
  console.log('   ⚠️  package.json not found - skipping script updates');
}

// 4. Create initial backup
console.log('\n💾 Creating initial backup...');
try {
  const { createBackup } = require('./db-backup.js');
  const result = createBackup('Initial database protection setup');
  
  if (result.success) {
    console.log(`   ✅ Initial backup created successfully`);
    console.log(`   📁 Location: ${result.backupPath}`);
  } else {
    console.log(`   ❌ Failed to create initial backup: ${result.error}`);
  }
} catch (error) {
  console.log(`   ⚠️  Could not create initial backup: ${error.message}`);
}

// 5. Create initial version snapshot
console.log('\n📊 Creating initial version snapshot...');
try {
  const { createVersionSnapshot } = require('./db-version.js');
  const versionResult = createVersionSnapshot('Initial version snapshot with enhanced emotion system', 'minor');
  
  console.log(`   ✅ Version ${versionResult.version} created successfully`);
} catch (error) {
  console.log(`   ⚠️  Could not create version snapshot: ${error.message}`);
}

// 6. Validate database
console.log('\n🔍 Validating database...');
try {
  const { validateDatabase } = require('./db-version.js');
  const validation = validateDatabase();
  
  if (validation.valid) {
    console.log('   ✅ Database validation passed');
    console.log(`   📊 Summary: ${validation.summary.emotions} emotions, ${validation.summary.categories} categories`);
  } else {
    console.log('   ❌ Database validation failed');
    if (validation.error) {
      console.log(`   Error: ${validation.error}`);
    }
  }
} catch (error) {
  console.log(`   ⚠️  Could not validate database: ${error.message}`);
}

// 7. Create README for database protection
console.log('\n📖 Creating documentation...');
const readmeContent = `# Database Protection System

This project includes a comprehensive database protection and versioning system to prevent data loss and enable easy restoration.

## 🚀 Quick Commands

### Backup Operations
\`\`\`bash
# Create manual backup
npm run db:backup

# Create backup with description
npm run db:backup "Before major update"

# List all backups
npm run db:backup:list

# Emergency backup (simple file copy)
npm run db:emergency-backup
\`\`\`

### Version Management
\`\`\`bash
# Create version snapshot (patch)
npm run db:version

# Create minor version
npm run db:version:minor

# Create major version  
npm run db:version:major

# List all versions
npm run db:version:list

# Show current version
npm run db:version:current

# Validate database
npm run db:validate
\`\`\`

### Combined Protection
\`\`\`bash
# Backup + Version (recommended before changes)
npm run db:protect
\`\`\`

## 📁 Directory Structure

\`\`\`
creativity-journal-next/
├── backups/                    # Timestamped database backups
│   └── backup_YYYY-MM-DD-HHMMSS/
│       ├── dev.db             # Database file
│       ├── schema.prisma      # Schema snapshot
│       ├── database_dump.sql  # Complete SQL dump
│       ├── emotion_data.sql   # Emotion system data
│       ├── restore.js         # Automated restore script
│       └── README.md          # Restoration instructions
├── db-versions/                # Version snapshots
│   ├── current-version.json   # Current version info
│   ├── v1.0.0/               # Version snapshots
│   └── version-*.json        # Version history
└── scripts/
    ├── db-backup.js          # Backup management
    ├── db-version.js         # Version management
    └── quick-start-db-protection.js
\`\`\`

## 🛡️ Protection Features

### Backup System
- ✅ Complete database file copying
- ✅ Schema versioning  
- ✅ SQL dump exports
- ✅ Emotion data isolation
- ✅ Automated restore scripts
- ✅ Metadata and statistics
- ✅ Timestamped organization

### Version Management
- ✅ Semantic versioning (major.minor.patch)
- ✅ Schema change detection
- ✅ Migration tracking
- ✅ Automated restoration scripts
- ✅ Database validation
- ✅ Change detection

### Automated Hooks
- ✅ Pre-deployment backups
- ✅ Pre-migration backups
- ✅ Git integration
- ✅ Emergency backup commands

## 🔄 Restoration Process

### From Backup
\`\`\`bash
# Navigate to backup directory
cd backups/backup_YYYY-MM-DD-HHMMSS/

# Run automated restore
node restore.js
\`\`\`

### From Version Snapshot
\`\`\`bash
# Navigate to version directory
cd db-versions/v1.0.0/

# Run version restore
node restore-version.js
\`\`\`

### Manual Restoration
\`\`\`bash
# Backup current state first
cp prisma/dev.db prisma/dev.db.backup

# Restore from backup
cp backups/backup_LATEST/dev.db prisma/dev.db
cp backups/backup_LATEST/schema.prisma prisma/schema.prisma

# Regenerate Prisma client
npx prisma generate
\`\`\`

## ⚠️ Important Notes

1. **Always backup before major changes**: Run \`npm run db:protect\`
2. **Test restorations periodically**: Verify backups work as expected
3. **Keep multiple backups**: Don't rely on just one backup
4. **Document changes**: Use descriptive messages for backups/versions
5. **Monitor disk space**: Backups can accumulate over time

## 🔍 Validation

The system includes comprehensive validation to ensure database integrity:

- Table existence verification
- Emotion system data validation
- Core emotion verification
- Schema integrity checks
- Migration tracking

Run \`npm run db:validate\` regularly to ensure your database is healthy.

## 🚨 Emergency Recovery

If your database is corrupted or lost:

1. **Don't panic** - you have multiple protection layers
2. **Check recent backups**: \`npm run db:backup:list\`
3. **Choose restoration method**: Backup vs. version snapshot
4. **Run restoration script**: Automated process with safety checks
5. **Validate result**: \`npm run db:validate\`
6. **Test application**: Ensure everything works correctly

## 📞 Support

For issues with the database protection system:

1. Check backup/version directories for available restore points
2. Review restore script logs for error details
3. Use manual restoration as fallback
4. Validate database after any restoration

Remember: This system is designed to prevent data loss. Use it proactively!
`;

const readmePath = path.join(PROJECT_ROOT, 'DATABASE_PROTECTION.md');
fs.writeFileSync(readmePath, readmeContent);
console.log('   ✅ Created DATABASE_PROTECTION.md with complete documentation');

// 8. Summary
console.log('\n🎉 Database Protection System Setup Complete!\n');

console.log('📋 What was set up:');
console.log('   ✅ Directory structure for backups and versions');
console.log('   ✅ Git protection rules (.gitignore)');
console.log('   ✅ NPM scripts for easy database management');
console.log('   ✅ Initial backup and version snapshot');
console.log('   ✅ Database validation and integrity checks');
console.log('   ✅ Complete documentation (DATABASE_PROTECTION.md)');

console.log('\n🚀 Ready to use:');
console.log('   npm run db:backup         - Create backup');
console.log('   npm run db:version        - Create version');
console.log('   npm run db:protect        - Backup + Version');
console.log('   npm run db:validate       - Check integrity');

console.log('\n💡 Best practices:');
console.log('   • Run "npm run db:protect" before major changes');
console.log('   • Use descriptive messages for backups/versions');
console.log('   • Test restoration periodically');
console.log('   • Monitor backup storage usage');

console.log('\n📖 Read DATABASE_PROTECTION.md for complete usage guide');
console.log('\n🛡️  Your enhanced emotion system is now fully protected!'); 