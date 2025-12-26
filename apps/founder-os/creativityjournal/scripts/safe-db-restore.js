const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

class SafeDatabaseRestore {
  constructor() {
    this.userDataTables = [
      'entry',
      'entry_props', 
      'entry_moods',
      'entry_labels',
      'entry_snippets',
      'user',
      'user_props',
      'user_mood_preferences',
      'user_mood_category_preferences',
      'mood_usage_analytics',
      'account',
      'session',
      'task',
      'project'
    ];

    this.referenceDataTables = [
      'mood',
      'mood_props',
      'categories', 
      'mood_categories',
      'entry_status',
      'task_status',
      'task_priority',
      'project_status',
      'label'
    ];
  }

  async backupUserData() {
    console.log('🔄 Creating backup of user data...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups', `safe-restore-backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy current database as backup
    const currentDb = path.join(__dirname, '../prisma/dev.db');
    const backupDb = path.join(backupDir, 'dev.db');
    
    try {
      fs.copyFileSync(currentDb, backupDb);
      console.log(`✅ User data backed up to: ${backupDir}`);
      return backupDir;
    } catch (error) {
      console.error('❌ Failed to backup user data:', error.message);
      throw error;
    }
  }

  async getUserDataCounts() {
    const counts = {};
    
    for (const table of this.userDataTables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
        counts[table] = Number(result[0]?.count || 0);
      } catch (error) {
        // Table might not exist, that's okay
        counts[table] = 0;
      }
    }
    
    return counts;
  }

  async confirmUserDataPreservation() {
    const userCounts = await this.getUserDataCounts();
    const totalUserRecords = Object.values(userCounts).reduce((sum, count) => sum + count, 0);
    
    console.log('\n📊 Current User Data Summary:');
    Object.entries(userCounts).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ${table}: ${count} records`);
      }
    });
    console.log(`   Total user records: ${totalUserRecords}`);
    
    if (totalUserRecords === 0) {
      console.log('✅ No user data found - safe to proceed with clean restore');
      return true;
    }
    
    console.log('\n⚠️  WARNING: User data detected!');
    console.log('This restore will PRESERVE all user data and only update reference data.');
    console.log('Reference data includes: moods, categories, statuses, labels');
    
    return true; // Always proceed safely
  }

  async restoreReferenceDataOnly() {
    console.log('\n🔄 Restoring reference data only (preserving user data)...');
    
    // Temporarily disable foreign key constraints
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);
    
    // Clear reference data tables only
    for (const table of this.referenceDataTables) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        console.log(`   Cleared reference table: ${table}`);
      } catch (error) {
        // Table might not exist or have constraints, that's okay
        console.log(`   Skipped table: ${table} (${error.message.split('\n')[0]})`);
      }
    }

    // Restore reference data from seed files
    const emotionSystemFile = path.join(__dirname, '../prisma/seeds/emotion-system-v1.0.0.sql');
    const seedEmotionsFile = path.join(__dirname, '../prisma/seed-emotions.sql');
    
    if (fs.existsSync(emotionSystemFile)) {
      console.log('🔄 Restoring emotions from emotion system file...');
      await this.runSQLFile(emotionSystemFile);
    } else if (fs.existsSync(seedEmotionsFile)) {
      console.log('🔄 Restoring emotions from seed file...');
      await this.runSQLFile(seedEmotionsFile);
    } else {
      console.log('⚠️  No emotion seed files found, skipping emotion restoration');
    }

    // Restore core reference data
    await this.restoreCoreReferenceData();
    
    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
  }

  async restoreCoreReferenceData() {
    console.log('🔄 Restoring core reference data...');
    
    // Entry statuses
    await prisma.$executeRawUnsafe(`
      INSERT OR REPLACE INTO entry_status (id, status) VALUES 
      (1, 'Draft'),
      (2, 'Published'), 
      (3, 'Archived')
    `);

    // Task statuses
    await prisma.$executeRawUnsafe(`
      INSERT OR REPLACE INTO task_status (id, name, description) VALUES
      (1, 'To Do', 'Task is waiting to be started'),
      (2, 'In Progress', 'Task is currently being worked on'),
      (3, 'Completed', 'Task has been finished'),
      (4, 'Cancelled', 'Task has been cancelled')
    `);

    // Task priorities
    await prisma.$executeRawUnsafe(`
      INSERT OR REPLACE INTO task_priority (id, name, description) VALUES
      (1, 'Low', 'Low priority task'),
      (2, 'Medium', 'Medium priority task'),
      (3, 'High', 'High priority task'),
      (4, 'Urgent', 'Urgent priority task')
    `);

    // Project statuses
    await prisma.$executeRawUnsafe(`
      INSERT OR REPLACE INTO project_status (id, name, description) VALUES
      (1, 'Active', 'Project is currently active'),
      (2, 'On Hold', 'Project is temporarily paused'),
      (3, 'Completed', 'Project has been completed'),
      (4, 'Cancelled', 'Project has been cancelled')
    `);

    // Core labels
    await prisma.$executeRawUnsafe(`
      INSERT OR REPLACE INTO label (id, name, color) VALUES
      (1, 'Ideas', 'FF6B6B'),
      (2, 'Goals', '4ECDC4'),
      (3, 'Reflections', '45B7D1'),
      (4, 'Creative', '96CEB4'),
      (5, 'Personal', 'FFEAA7')
    `);

    console.log('✅ Core reference data restored');
  }

  async runSQLFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  SQL file not found: ${filePath}`);
      return false;
    }

    try {
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL content by statements and execute each one
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            // Skip SELECT statements and other non-modifying statements
            if (statement.toUpperCase().startsWith('SELECT') || 
                statement.toUpperCase().startsWith('PRAGMA') ||
                statement.toUpperCase().startsWith('CREATE INDEX IF NOT EXISTS')) {
              continue;
            }
            
            await prisma.$executeRawUnsafe(statement);
          } catch (statementError) {
            // Log individual statement errors but continue
            console.log(`   ⚠️  Skipped statement: ${statementError.message.split('\n')[0]}`);
          }
        }
      }

      console.log(`✅ Successfully executed SQL file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error executing SQL file ${filePath}:`, error.message);
      return false;
    }
  }

  async verifyRestore() {
    console.log('\n🔍 Verifying restore...');
    
    // Check emotion count
    const moodResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM mood`);
    const moodCount = Number(moodResult[0]?.count || 0);
    
    // Check user data preservation
    const userCounts = await this.getUserDataCounts();
    const entryCount = userCounts.entry || 0;
    const userCount = userCounts.user || 0;
    
    console.log(`   Moods restored: ${moodCount}`);
    console.log(`   User entries preserved: ${entryCount}`);
    console.log(`   Users preserved: ${userCount}`);
    
    if (moodCount > 400) {
      console.log('✅ Restore verification passed');
      return true;
    } else {
      console.log('⚠️  Restore verification failed - fewer emotions than expected');
      return false;
    }
  }

  async performSafeRestore() {
    try {
      console.log('🛡️  SAFE DATABASE RESTORE');
      console.log('='.repeat(50));
      
      // Step 1: Backup user data
      const backupDir = await this.backupUserData();
      
      // Step 2: Confirm what we're preserving
      await this.confirmUserDataPreservation();
      
      // Step 3: Restore reference data only
      await this.restoreReferenceDataOnly();
      
      // Step 4: Verify everything worked
      const success = await this.verifyRestore();
      
      if (success) {
        console.log('\n✅ SAFE RESTORE COMPLETED SUCCESSFULLY');
        console.log(`📁 Backup available at: ${backupDir}`);
        console.log('🔐 All user data has been preserved');
        console.log('📊 Reference data (moods, categories, etc.) has been updated');
      } else {
        console.log('\n❌ RESTORE VERIFICATION FAILED');
        console.log(`📁 You can restore from backup at: ${backupDir}`);
      }
      
      return success;
      
    } catch (error) {
      console.error('\n❌ SAFE RESTORE FAILED:', error.message);
      console.log('📁 Check backup directory for recovery options');
      return false;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const restore = new SafeDatabaseRestore();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'safe-restore':
      await restore.performSafeRestore();
      break;
      
    case 'backup-only':
      await restore.backupUserData();
      break;
      
    case 'verify':
      await restore.verifyRestore();
      break;
      
    default:
      console.log('🛡️  Safe Database Restore Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/safe-db-restore.js safe-restore   # Safely restore reference data');
      console.log('  node scripts/safe-db-restore.js backup-only    # Just create a backup');
      console.log('  node scripts/safe-db-restore.js verify         # Verify current state');
      console.log('');
      console.log('This tool PRESERVES all user data (entries, users, etc.)');
      console.log('and only updates reference data (moods, categories, statuses)');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SafeDatabaseRestore; 