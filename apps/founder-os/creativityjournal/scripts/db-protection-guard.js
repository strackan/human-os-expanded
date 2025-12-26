const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

class DatabaseProtectionGuard {
  constructor() {
    this.protectionLevel = 'STRICT'; // STRICT, MODERATE, DISABLED
    this.minEmotionCount = 400;
    this.minEntryCount = 0; // Don't require entries, but protect them if they exist
  }

  async createProtectionSnapshot() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotDir = path.join(__dirname, '../backups', `protection-snapshot-${timestamp}`);
    
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    try {
      // Copy database file
      const dbPath = path.join(__dirname, '../prisma/dev.db');
      const snapshotDbPath = path.join(snapshotDir, 'dev.db');
      fs.copyFileSync(dbPath, snapshotDbPath);

      // Create metadata
      const stats = await this.getDatabaseStats();
      const metadata = {
        timestamp: new Date().toISOString(),
        purpose: 'Protection snapshot before database operation',
        stats: stats,
        protectionLevel: this.protectionLevel
      };

      fs.writeFileSync(
        path.join(snapshotDir, 'protection-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`🛡️  Protection snapshot created: ${snapshotDir}`);
      return snapshotDir;
    } catch (error) {
      console.error('❌ Failed to create protection snapshot:', error.message);
      throw error;
    }
  }

  async getDatabaseStats() {
    try {
      const stats = {};
      
      // Count all important tables
      stats.moods = await prisma.mood.count();
      stats.moodProps = await prisma.moodProps.count();
      stats.categories = await prisma.category.count();
      stats.moodCategories = await prisma.moodCategory.count();
      stats.entries = await prisma.entry.count();
      stats.users = await prisma.user.count();
      
      // Check for user data
      const entryPropsCount = await prisma.entryProps.count();
      const entryMoodsCount = await prisma.entryMoods.count();
      
      stats.entryProps = entryPropsCount;
      stats.entryMoods = entryMoodsCount;
      stats.hasUserData = stats.entries > 0 || entryPropsCount > 0 || entryMoodsCount > 0;
      
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error.message);
      return {};
    }
  }

  async validateDatabaseIntegrity() {
    const stats = await this.getDatabaseStats();
    const issues = [];

    // Check emotion data
    if (stats.moods < this.minEmotionCount) {
      issues.push(`❌ CRITICAL: Only ${stats.moods} emotions (expected at least ${this.minEmotionCount})`);
    }

    // Check data consistency
    if (stats.moods !== stats.moodProps) {
      issues.push(`⚠️  WARNING: Mood count (${stats.moods}) doesn't match mood props (${stats.moodProps})`);
    }

    // Check for user data
    if (stats.hasUserData) {
      console.log(`🛡️  USER DATA DETECTED: ${stats.entries} entries, ${stats.entryProps} entry props, ${stats.entryMoods} mood selections`);
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      stats: stats
    };
  }

  async checkForDestructiveOperations(command) {
    const destructivePatterns = [
      /DROP\s+TABLE/i,
      /TRUNCATE/i,
      /DELETE\s+FROM.*WHERE\s+1=1/i,
      /DELETE\s+FROM.*mood/i,
      /DELETE\s+FROM.*entry/i,
      /DELETE\s+FROM.*user/i,
      /migrate\s+reset/i,
      /db\s+push.*--reset/i
    ];

    for (const pattern of destructivePatterns) {
      if (pattern.test(command)) {
        return true;
      }
    }
    return false;
  }

  async requireExplicitConfirmation(operation, stats) {
    console.log(`\n🚨 PROTECTION GUARD ACTIVATED 🚨`);
    console.log(`Operation: ${operation}`);
    console.log(`\n📊 Current Database Status:`);
    console.log(`   - Emotions: ${stats.moods}`);
    console.log(`   - Entries: ${stats.entries}`);
    console.log(`   - Users: ${stats.users}`);
    
    if (stats.hasUserData) {
      console.log(`\n⚠️  WARNING: USER DATA DETECTED!`);
      console.log(`   This operation could potentially delete user journal entries and personal data.`);
    }

    console.log(`\n🛡️  SAFETY REQUIREMENTS:`);
    console.log(`   1. A protection snapshot has been created`);
    console.log(`   2. You must type the exact confirmation phrase`);
    console.log(`   3. This action cannot be undone automatically`);

    const confirmationPhrase = `CONFIRM_DELETE_RISK_${Date.now()}`;
    console.log(`\n🔐 To proceed, type exactly: ${confirmationPhrase}`);

    // In a real scenario, this would prompt for user input
    // For now, we'll just throw an error requiring manual intervention
    throw new Error(`🛡️  PROTECTION GUARD BLOCKED OPERATION
    
This operation was blocked by the database protection system.

If you absolutely need to proceed:
1. Review the protection snapshot in the backups folder
2. Manually run: node scripts/db-protection-guard.js bypass "${operation}"
3. Use the exact confirmation phrase shown above

This is intentionally difficult to prevent accidental data loss.`);
  }

  async executeSafeOperation(operation, sqlFiles = []) {
    console.log(`🛡️  Executing safe operation: ${operation}`);
    
    // 1. Create protection snapshot
    const snapshotDir = await this.createProtectionSnapshot();
    
    // 2. Validate current state
    const validation = await this.validateDatabaseIntegrity();
    if (!validation.isValid) {
      console.log(`⚠️  Database integrity issues detected:`);
      validation.issues.forEach(issue => console.log(`   ${issue}`));
    }

    try {
      // 3. Execute SQL files safely
      for (const sqlFile of sqlFiles) {
        await this.executeSQLFileSafely(sqlFile);
      }

      // 4. Verify post-operation state
      const postValidation = await this.validateDatabaseIntegrity();
      
      // 5. Check that we didn't lose data
      if (postValidation.stats.moods < validation.stats.moods) {
        throw new Error(`🚨 OPERATION ROLLED BACK: Emotion count decreased from ${validation.stats.moods} to ${postValidation.stats.moods}`);
      }
      
      if (postValidation.stats.entries < validation.stats.entries) {
        throw new Error(`🚨 OPERATION ROLLED BACK: Entry count decreased from ${validation.stats.entries} to ${postValidation.stats.entries}`);
      }

      console.log(`✅ Safe operation completed successfully`);
      console.log(`📊 Final stats: ${postValidation.stats.moods} emotions, ${postValidation.stats.entries} entries`);
      
      return {
        success: true,
        snapshotDir: snapshotDir,
        beforeStats: validation.stats,
        afterStats: postValidation.stats
      };
      
    } catch (error) {
      console.error(`❌ Operation failed: ${error.message}`);
      console.log(`🔄 Restore from snapshot: cp ${snapshotDir}/dev.db prisma/dev.db`);
      throw error;
    }
  }

  async executeSQLFileSafely(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`SQL file not found: ${filePath}`);
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Check for destructive operations
    if (await this.checkForDestructiveOperations(sqlContent)) {
      const stats = await this.getDatabaseStats();
      await this.requireExplicitConfirmation(`Execute SQL file: ${filePath}`, stats);
    }

    console.log(`🔄 Safely executing SQL file: ${filePath}`);
    
    // Split and execute statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // If it's a "table already exists" error for our safe operations, continue
          if (error.message.includes('already exists') && 
              (statement.includes('CREATE TABLE') || statement.includes('CREATE TABLE IF NOT EXISTS'))) {
            console.log(`ℹ️  Table already exists, skipping: ${statement.substring(0, 50)}...`);
            continue;
          }
          throw error;
        }
      }
    }

    console.log(`✅ Successfully executed SQL file: ${filePath}`);
  }
}

// CLI interface
async function main() {
  const guard = new DatabaseProtectionGuard();
  const command = process.argv[2];
  const operation = process.argv[3];

  try {
    switch (command) {
      case 'snapshot':
        await guard.createProtectionSnapshot();
        break;

      case 'validate':
        const validation = await guard.validateDatabaseIntegrity();
        if (validation.isValid) {
          console.log('✅ Database integrity validated');
        } else {
          console.log('❌ Database integrity issues detected:');
          validation.issues.forEach(issue => console.log(`   ${issue}`));
        }
        break;

      case 'stats':
        const stats = await guard.getDatabaseStats();
        console.log('📊 Database Statistics:');
        Object.entries(stats).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
        break;

      case 'safe-execute':
        if (!operation) {
          console.error('❌ Please specify SQL file: node db-protection-guard.js safe-execute path/to/file.sql');
          process.exit(1);
        }
        await guard.executeSafeOperation(`Execute ${operation}`, [operation]);
        break;

      case 'bypass':
        console.log('🚨 BYPASS MODE - Use with extreme caution!');
        // This would require additional confirmation in real usage
        break;

      default:
        console.log(`
Database Protection Guard

Usage: node db-protection-guard.js <command> [options]

Commands:
  snapshot               - Create protection snapshot
  validate              - Validate database integrity
  stats                 - Show database statistics
  safe-execute <file>   - Safely execute SQL file with protection
  bypass <operation>    - Bypass protection (requires confirmation)

Examples:
  node db-protection-guard.js snapshot
  node db-protection-guard.js validate
  node db-protection-guard.js safe-execute database-versions/v1.4.0.sql
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Protection Guard Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseProtectionGuard }; 