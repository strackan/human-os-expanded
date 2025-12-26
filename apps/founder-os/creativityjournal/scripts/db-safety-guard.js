const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class DatabaseSafetyGuard {
  constructor() {
    this.dangerousCommands = [
      'db:restore:v1',
      'cp database-versions',
      'rm prisma/dev.db',
      'truncate',
      'drop table'
    ];
  }

  async checkUserDataExists() {
    try {
      // Check for user entries with actual content
      const entriesWithContent = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM entry e 
        JOIN entry_props ep ON e.id = ep.entry_id 
        WHERE ep.wordcount > 0 OR ep.charcount > 0 OR ep.title != '' OR ep.content != ''
      `;
      
      const contentCount = Number(entriesWithContent[0]?.count || 0);
      
      // Check for published entries
      const publishedEntries = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM entry e 
        JOIN entry_status es ON e.status_id = es.id 
        WHERE es.status = 'Published'
      `;
      
      const publishedCount = Number(publishedEntries[0]?.count || 0);
      
      // Check total user entries
      const totalEntries = await prisma.$queryRaw`SELECT COUNT(*) as count FROM entry`;
      const totalCount = Number(totalEntries[0]?.count || 0);
      
      return {
        hasContent: contentCount > 0,
        hasPublished: publishedCount > 0,
        totalEntries: totalCount,
        entriesWithContent: contentCount,
        publishedEntries: publishedCount
      };
      
    } catch (error) {
      console.error('❌ Error checking user data:', error.message);
      return {
        hasContent: false,
        hasPublished: false,
        totalEntries: 0,
        entriesWithContent: 0,
        publishedEntries: 0
      };
    }
  }

  async validateOperation(operation) {
    const userDataStatus = await this.checkUserDataExists();
    
    console.log('\n🛡️  DATABASE SAFETY CHECK');
    console.log('='.repeat(50));
    console.log(`Operation: ${operation}`);
    console.log('\n📊 Current Data Status:');
    console.log(`   Total entries: ${userDataStatus.totalEntries}`);
    console.log(`   Entries with content: ${userDataStatus.entriesWithContent}`);
    console.log(`   Published entries: ${userDataStatus.publishedEntries}`);
    
    if (userDataStatus.hasContent || userDataStatus.hasPublished) {
      console.log('\n⚠️  WARNING: USER DATA DETECTED!');
      
      if (userDataStatus.hasPublished) {
        console.log('🚨 CRITICAL: PUBLISHED ENTRIES FOUND!');
        console.log('   Published entries should NEVER be lost!');
      }
      
      if (userDataStatus.hasContent) {
        console.log('📝 Content entries found - these contain user work!');
      }
      
      return {
        hasData: true,
        isCritical: userDataStatus.hasPublished,
        userDataStatus
      };
    }
    
    console.log('✅ No user content detected - operation appears safe');
    return {
      hasData: false,
      isCritical: false,
      userDataStatus
    };
  }

  async createEmergencyBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `prisma/dev.db.emergency-${timestamp}`;
    
    try {
      fs.copyFileSync('prisma/dev.db', backupPath);
      console.log(`🆘 Emergency backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Failed to create emergency backup:', error.message);
      throw error;
    }
  }

  displaySafeAlternatives() {
    console.log('\n🛡️  SAFE ALTERNATIVES:');
    console.log('   Instead of dangerous operations, use:');
    console.log('');
    console.log('   npm run db:safe-restore      # Restore moods/categories only');
    console.log('   npm run db:ensure-emotions   # Add missing emotions only');
    console.log('   npm run db:backup-only       # Create backup without changes');
    console.log('   npm run db:verify-data       # Check current data status');
    console.log('');
    console.log('   These commands PRESERVE all user data while updating reference data.');
  }

  async preventDestructiveOperation(command) {
    const validation = await this.validateOperation(command);
    
    if (validation.hasData) {
      console.log('\n🚫 OPERATION BLOCKED FOR SAFETY!');
      
      if (validation.isCritical) {
        console.log('🚨 CRITICAL DATA PROTECTION: Published entries detected!');
        console.log('   This operation could permanently delete published content.');
      }
      
      console.log('\n📋 To proceed safely:');
      console.log('   1. Create a backup: npm run db:backup');
      console.log('   2. Use safe restore: npm run db:safe-restore');
      console.log('   3. Or export your content first');
      
      this.displaySafeAlternatives();
      
      return false; // Block operation
    }
    
    console.log('✅ Operation cleared - no user data at risk');
    return true; // Allow operation
  }

  async auditDatabaseChanges() {
    console.log('\n🔍 DATABASE AUDIT');
    console.log('='.repeat(30));
    
    try {
      // Recent changes
      const recentEntries = await prisma.$queryRaw`
        SELECT e.id, e.created_date, e.updated_date, ep.title, es.status
        FROM entry e
        JOIN entry_props ep ON e.id = ep.entry_id
        JOIN entry_status es ON e.status_id = es.id
        ORDER BY e.updated_date DESC
        LIMIT 5
      `;
      
      console.log('📝 Recent entries:');
      if (recentEntries.length === 0) {
        console.log('   No entries found');
      } else {
        recentEntries.forEach(entry => {
          const date = new Date(entry.updated_date).toLocaleString();
          const title = entry.title || '(untitled)';
          console.log(`   ${entry.id}: ${title} (${entry.status}) - ${date}`);
        });
      }
      
      // Schema info
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
      `;
      
      console.log(`\n📊 Database contains ${tables.length} tables`);
      
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
    }
  }
}

// Main execution
async function main() {
  const guard = new DatabaseSafetyGuard();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
      await guard.validateOperation('safety check');
      break;
      
    case 'audit':
      await guard.auditDatabaseChanges();
      break;
      
    case 'prevent':
      const operation = args[1] || 'unknown operation';
      const allowed = await guard.preventDestructiveOperation(operation);
      process.exit(allowed ? 0 : 1);
      break;
      
    case 'backup':
      await guard.createEmergencyBackup();
      break;
      
    default:
      console.log('🛡️  Database Safety Guard');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/db-safety-guard.js check     # Check current data status');
      console.log('  node scripts/db-safety-guard.js audit     # Audit recent changes');
      console.log('  node scripts/db-safety-guard.js prevent <op>  # Validate operation safety');
      console.log('  node scripts/db-safety-guard.js backup    # Create emergency backup');
      console.log('');
      console.log('This tool helps prevent accidental data loss from dangerous operations.');
  }
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = DatabaseSafetyGuard; 