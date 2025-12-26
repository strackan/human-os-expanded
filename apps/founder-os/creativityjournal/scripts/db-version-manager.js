const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { DatabaseProtectionGuard } = require('./db-protection-guard');

const prisma = new PrismaClient();

// Define version progression with SQL files
const VERSION_PROGRESSION = {
  'v1.0.0': {
    description: 'Complete implementation of 457-emotion system with Plutchik mappings',
    sqlFiles: [
      'prisma/seed-emotions.sql'
    ],
    migrations: [
      // Core migrations that should already be applied
    ]
  },
  'v1.1.0': {
    description: 'User mood preferences and enhanced analytics',
    sqlFiles: [],
    migrations: [
      '20250706151454_add_emotion_suggestions',
      '20250706152619_add_user_mood_relationship_and_notifications',
      '20250706161132_add_user_mood_preferences'
    ]
  },
  'v1.2.0': {
    description: 'Enhanced emotion categorization and search',
    sqlFiles: [],
    migrations: []
  },
  'v1.3.0': {
    description: 'Advanced mood analytics and insights',
    sqlFiles: [],
    migrations: []
  },
  'v1.3.1': {
    description: 'Bug fixes and data restoration',
    sqlFiles: [
      'prisma/seed-emotions.sql' // Restore comprehensive emotions if missing
    ],
    migrations: []
  },
  'v1.3.2': {
    description: 'Enhanced database reliability and SQL optimization',
    features: [
      'Fixed SQL seed files to use INSERT OR REPLACE for conflict resolution',
      'Fixed BigInt serialization in database version manager',
      'Preserved comprehensive 457-emotion system throughout upgrades',
      'Improved upgrade reliability and error handling',
      'Enhanced draft management system with archive functionality'
    ],
    sqlFiles: [
      'prisma/seed-emotions.sql' // Ensure comprehensive emotions with optimized SQL
    ],
    migrations: []
  },
  'v1.4.0': {
    description: 'Dynamic Mood Creation System with Database Protection',
    features: [
      'Added user_moods table for custom user-created emotions',
      'Added mood_promotions table for community mood approval workflow',
      'Implemented Plutchik emotion mapping system for custom moods',
      'Added comprehensive database protection system to prevent accidental data loss',
      'Implemented three-state mood pill system (red/yellow/green)',
      'Added automatic snapshot creation before dangerous operations',
      'Enhanced emotional intelligence fields (arousal, valence, dominance, intensity)',
      'Created safe SQL execution with rollback protection',
      'Added explicit confirmation requirements for destructive operations'
    ],
    sqlFiles: [
      'database-versions/v1.4.0.sql' // Add user mood tables safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  },
  'v1.4.1': {
    description: 'Entry Publishing Date Tracking System',
    features: [
      'Added published_date field to entry table for proper publication tracking',
      'Enhanced /entries page with separate last_update and last_publish date columns',
      'Implemented draft reversion logic for published entries when edited',
      'Added comprehensive indexing for date-based entry queries',
      'Updated API endpoints to return and track published dates',
      'Changed /entries page links from Edit to View for published entries',
      'Added published date display to entry view page',
      'Implemented proper entry lifecycle tracking (draft → published → draft)',
      'Enhanced entry metadata with complete date audit trail'
    ],
    sqlFiles: [
      'database-versions/v1.4.1.sql' // Add published_date field safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  },
  'v1.4.2': {
    description: 'Entry Privacy Protection System',
    features: [
      'Added privacy fields to Entry table (is_private, password_hash, break_glass_code, break_glass_expires)',
      'Implemented password protection functionality for individual entries',
      'Added break-glass emergency access system with email verification',
      'Created privacy-aware entry display with content masking',
      'Enhanced entry security with password complexity requirements',
      'Added privacy status indicators and management UI',
      'Implemented secure password hashing for entry protection',
      'Added privacy field indexing for efficient queries'
    ],
    sqlFiles: [
      'database-versions/v1.4.2.sql' // Add privacy fields safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  },
  'v1.4.3': {
    description: 'User Mood Entry Associations',
    features: [
      'Added EntryUserMoods table for user-created mood associations',
      'Implemented many-to-many relationship between entries and user moods',
      'Added proper integer ID support for user mood tracking',
      'Created database constraints and indexes for performance',
      'Enhanced entry system to support both global and user moods',
      'Added proper foreign key relationships with cascade deletion',
      'Implemented unique constraints to prevent duplicate associations'
    ],
    sqlFiles: [
      'database-versions/v1.4.3.sql' // Add user mood entry associations safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  },
  'v1.4.4': {
    description: 'Unified Mood Properties & Simplified Questionnaire',
    features: [
      'Extended mood_props table to support both global and user moods',
      'Added questionnaire fields (similar_word, related_mood_id) to user_moods table',
      'Implemented 4-question form for user mood creation',
      'Added questionnaire_complete flag for tracking completion status',
      'Created performance indexes for mood_props queries',
      'Added privacy-focused indexing for user-scoped queries',
      'Enhanced mood properties system for unified global/user mood support'
    ],
    sqlFiles: [
      'database-versions/v1.4.4.sql' // Add unified mood properties safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  },
  'v1.4.5': {
    description: 'Mood Properties Schema Cleanup',
    features: [
      'Removed legacy Plutchik fields from user_moods table after migration to unified mood_props',
      'Fixed mood_id nullable constraint in mood_props to support user moods',
      'Enhanced foreign key relationships for user mood properties',
      'Optimized database schema for better performance',
      'Completed transition to unified mood properties system'
    ],
    sqlFiles: [
      'database-versions/v1.4.4-fix.sql', // Fix nullable constraints
      'database-versions/v1.4.5.sql' // Remove legacy fields
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: false // This version removes legacy fields
  },
  'v1.5.0': {
    description: 'Comprehensive Custom Mood Colors System',
    features: [
      'Added 5 custom color fields for different mood categories (global, community, private, etc.)',
      'Implemented custom color support for all mood pill types (green, yellow, red, grey, user)',
      'Replaced custom ColorPicker implementation with react-color-palette library',
      'Enhanced MoodPill component with dynamic custom color styling',
      'Added color validation triggers to ensure proper hex color format',
      'Created performance indexes for efficient color lookups',
      'Implemented backward compatibility with existing custom_mood_hex_code field',
      'Added default color population for existing users',
      'Enhanced user experience with professional color picker interface',
      'Improved maintainability by using established color picker library'
    ],
    sqlFiles: [
      'database-versions/v1.5.0.sql' // Add comprehensive custom colors safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  },
  'v1.6.0': {
    description: 'Remove Custom Color System - Simplify to Single Universal Color',
    features: [
      'Removed all custom color fields from User model',
      'Removed custom color index for improved performance',
      'Simplified mood pill styling to single universal color',
      'Removed complex color customization settings page'
    ],
    sqlFiles: [
      'database-versions/v1.6.0.sql' // Remove custom color fields safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: false // This version removes fields
  },
  'v1.6.1': {
    description: 'Add Pinning and Hiding Functionality to UserMood Model',
    features: [
      'Added isPinned field to user_moods table for pinning favorite moods',
      'Added isHidden field to user_moods table for hiding unwanted moods',
      'Added pinOrder field for custom ordering of pinned moods',
      'Added usageCount field for tracking mood usage frequency',
      'Added lastUsedAt field for tracking recent mood usage',
      'Added firstUsedAt field for tracking when mood was first used',
      'Created performance indexes for efficient mood filtering and sorting',
      'Enhanced user mood management with pinning and hiding capabilities',
      'Added dedicated API endpoints for user mood preferences',
      'Updated tabbed interface to support user mood pinning and hiding'
    ],
    sqlFiles: [
      'database-versions/v1.6.1.sql' // Add pinning and hiding fields safely
    ],
    migrations: [],
    requiresProtection: true, // Flag to use protection system
    isAdditive: true // This version only adds, never deletes
  }
};

class DatabaseVersionManager {
  constructor() {
    this.currentVersion = null;
    this.targetVersion = null;
    this.protectionGuard = new DatabaseProtectionGuard();
  }

  async getCurrentVersion() {
    try {
      const versionFile = path.join(__dirname, '../database-versions/current.json');
      if (fs.existsSync(versionFile)) {
        const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
        return data.version;
      }
      return 'v1.0.0'; // Default to v1.0.0 if no version file exists
    } catch (error) {
      console.log('⚠️  Could not read current version, defaulting to v1.0.0');
      return 'v1.0.0';
    }
  }

  async updateVersionFile(version) {
    const versionFile = path.join(__dirname, '../database-versions/current.json');
    const versionConfig = VERSION_PROGRESSION[version];
    const versionData = {
      version: version,
      description: versionConfig?.description || 'Unknown version',
      features: versionConfig?.features || [],
      updatedAt: new Date().toISOString(),
      emotionCount: await this.getEmotionCount(),
      improvements: versionConfig?.features ? versionConfig.features.length : 0
    };

    fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
    console.log(`✅ Updated version file to ${version}`);
    
    // Log features if they exist
    if (versionConfig?.features && versionConfig.features.length > 0) {
      console.log(`📋 Features included in ${version}:`);
      versionConfig.features.forEach((feature, index) => {
        console.log(`   ${index + 1}. ${feature}`);
      });
    }
  }

  async getEmotionCount() {
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM mood`;
      const count = result[0]?.count || 0;
      // Convert BigInt to number for JSON serialization
      return typeof count === 'bigint' ? Number(count) : count;
    } catch (error) {
      console.log('⚠️  Could not get emotion count:', error.message);
      return 0;
    }
  }

  async runSQLFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  SQL file not found: ${filePath}`);
      return false;
    }

    try {
      console.log(`🔄 Running SQL file: ${filePath}`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL content by statements and execute each one
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          await prisma.$executeRawUnsafe(statement);
        }
      }

      console.log(`✅ Successfully executed SQL file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error executing SQL file ${filePath}:`, error.message);
      return false;
    }
  }

  async runMigration(migrationName) {
    try {
      console.log(`🔄 Running migration: ${migrationName}`);
      execSync(`npx prisma migrate deploy`, { stdio: 'inherit' });
      console.log(`✅ Migration completed: ${migrationName}`);
      return true;
    } catch (error) {
      console.error(`❌ Error running migration ${migrationName}:`, error.message);
      return false;
    }
  }

  async ensureEmotionData() {
    const emotionCount = await this.getEmotionCount();
    console.log(`📊 Current emotion count: ${emotionCount}`);

    if (emotionCount < 400) {
      console.log('🚨 Emotion data is incomplete, restoring from seed-emotions.sql...');
      await this.runSQLFile('prisma/seed-emotions.sql');
      
      const newCount = await this.getEmotionCount();
      console.log(`✅ Restored emotion count: ${newCount}`);
    } else {
      console.log('✅ Emotion data is complete');
    }
  }

  async upgradeToVersion(targetVersion) {
    return await this.safeUpgradeToVersion(targetVersion);
  }

  async safeUpgradeToVersion(targetVersion) {
    const currentVersion = await this.getCurrentVersion();
    console.log(`🛡️  Safe upgrading database from ${currentVersion} to ${targetVersion}`);

    // Get all versions between current and target
    const versions = Object.keys(VERSION_PROGRESSION);
    const currentIndex = versions.indexOf(currentVersion);
    const targetIndex = versions.indexOf(targetVersion);

    if (currentIndex === -1) {
      console.error(`❌ Unknown current version: ${currentVersion}`);
      return false;
    }

    if (targetIndex === -1) {
      console.error(`❌ Unknown target version: ${targetVersion}`);
      return false;
    }

    if (currentIndex >= targetIndex) {
      console.log(`ℹ️  Database is already at or beyond version ${targetVersion}`);
      await this.ensureEmotionData();
      return true;
    }

    // Create protection snapshot before any changes
    const snapshotDir = await this.protectionGuard.createProtectionSnapshot();
    console.log(`🛡️  Protection snapshot created before upgrade`);

    try {
      // Run upgrades sequentially
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        const version = versions[i];
        const versionConfig = VERSION_PROGRESSION[version];
        
        console.log(`\n🔄 Upgrading to ${version}: ${versionConfig.description}`);

        // Use protection system for versions that require it
        if (versionConfig.requiresProtection || versionConfig.isAdditive === false) {
          console.log(`🛡️  Using protection system for ${version}`);
          
          // Execute SQL files with protection
          if (versionConfig.sqlFiles && versionConfig.sqlFiles.length > 0) {
            const result = await this.protectionGuard.executeSafeOperation(
              `Upgrade to ${version}`,
              versionConfig.sqlFiles
            );
            
            if (!result.success) {
              throw new Error(`Failed to execute SQL files for ${version}`);
            }
          }
        } else {
          // Legacy method for older versions
          // Run migrations first
          for (const migration of versionConfig.migrations || []) {
            const success = await this.runMigration(migration);
            if (!success) {
              console.error(`❌ Failed to run migration ${migration}`);
              return false;
            }
          }

          // Run SQL files
          for (const sqlFile of versionConfig.sqlFiles || []) {
            const success = await this.runSQLFile(sqlFile);
            if (!success) {
              console.error(`❌ Failed to run SQL file ${sqlFile}`);
              return false;
            }
          }
        }

        // Update version
        await this.updateVersionFile(version);
        console.log(`✅ Successfully upgraded to ${version}`);
      }

      // Ensure emotion data is preserved
      await this.ensureEmotionData();

      // Final validation
      const validation = await this.protectionGuard.validateDatabaseIntegrity();
      if (!validation.isValid) {
        console.log(`⚠️  Post-upgrade validation issues:`);
        validation.issues.forEach(issue => console.log(`   ${issue}`));
      }

      console.log(`🎉 Database safely upgraded to ${targetVersion}`);
      console.log(`📁 Protection snapshot available at: ${snapshotDir}`);
      return true;

    } catch (error) {
      console.error(`❌ Upgrade failed: ${error.message}`);
      console.log(`🔄 Restore from snapshot: cp ${snapshotDir}/dev.db prisma/dev.db`);
      throw error;
    }
  }

  async validateDatabase() {
    console.log('🔍 Validating database integrity...');
    
    const emotionCount = await this.getEmotionCount();
    const categoriesCount = await prisma.category.count();
    const moodPropsCount = await prisma.moodProps.count();
    const userMoodPrefsTable = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name='user_mood_preferences'
    `;

    console.log(`📊 Database Status:
    - Emotions: ${emotionCount}
    - Categories: ${categoriesCount}
    - Mood Properties: ${moodPropsCount}
    - User Mood Preferences Table: ${userMoodPrefsTable.length > 0 ? 'EXISTS' : 'MISSING'}
    `);

    const isValid = emotionCount >= 400 && categoriesCount > 0 && userMoodPrefsTable.length > 0;
    console.log(`✅ Database is ${isValid ? 'VALID' : 'INVALID'}`);
    
    return isValid;
  }
}

// CLI interface
async function main() {
  const manager = new DatabaseVersionManager();
  const command = process.argv[2];
  const version = process.argv[3];

  try {
    switch (command) {
      case 'current':
        const currentVersion = await manager.getCurrentVersion();
        console.log(`Current database version: ${currentVersion}`);
        break;

      case 'upgrade':
        if (!version) {
          console.error('❌ Please specify target version: node db-version-manager.js upgrade v1.3.1');
          process.exit(1);
        }
        await manager.upgradeToVersion(version);
        break;

      case 'validate':
        await manager.validateDatabase();
        break;

      case 'ensure-emotions':
        await manager.ensureEmotionData();
        break;

      case 'list':
        console.log('Available versions:');
        Object.entries(VERSION_PROGRESSION).forEach(([version, config]) => {
          console.log(`  ${version}: ${config.description}`);
        });
        break;

      default:
        console.log(`
Usage: node db-version-manager.js <command> [options]

Commands:
  current                 - Show current database version
  upgrade <version>       - Upgrade database to specified version
  validate               - Validate database integrity
  ensure-emotions        - Ensure comprehensive emotion data exists
  list                   - List all available versions

Examples:
  node db-version-manager.js current
  node db-version-manager.js upgrade v1.3.1
  node db-version-manager.js validate
  node db-version-manager.js ensure-emotions
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DatabaseVersionManager }; 