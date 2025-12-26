#!/usr/bin/env node
/**
 * Database Health Check Script
 * Validates critical database components to prevent data loss
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const VERSION_DIR = path.join(__dirname, '..', 'database-versions');

// Expected minimum counts for critical data
const EXPECTED_COUNTS = {
  moods: 400,          // Should have at least 400 moods
  mood_props: 400,     // Should have properties for most moods
  categories: 50,      // Should have at least 50 categories
  mood_categories: 600, // Should have at least 600 mood-category links
  core_moods: 40       // Should have at least 40 core moods
};

function getCurrentCounts() {
  try {
    const query = `
      SELECT 
        'moods' as table_name, COUNT(*) as count FROM mood
      UNION ALL SELECT 
        'mood_props' as table_name, COUNT(*) as count FROM mood_props
      UNION ALL SELECT 
        'categories' as table_name, COUNT(*) as count FROM categories
      UNION ALL SELECT 
        'mood_categories' as table_name, COUNT(*) as count FROM mood_categories
      UNION ALL SELECT 
        'core_moods' as table_name, COUNT(*) as count FROM mood_props WHERE core = 1
      UNION ALL SELECT 
        'entries' as table_name, COUNT(*) as count FROM entry
      UNION ALL SELECT 
        'users' as table_name, COUNT(*) as count FROM user;
    `;

    const results = execSync(`sqlite3 "${DB_PATH}" "${query}"`).toString();
    const counts = {};
    
    results.trim().split('\n').forEach(line => {
      const [table, count] = line.split('|');
      counts[table] = parseInt(count);
    });

    return counts;
  } catch (error) {
    console.error('❌ Error getting database counts:', error.message);
    return null;
  }
}

function checkHealthStatus(counts) {
  const issues = [];
  const warnings = [];

  // Check critical mood data
  if (counts.moods < EXPECTED_COUNTS.moods) {
    issues.push(`❌ CRITICAL: Only ${counts.moods} moods found (expected at least ${EXPECTED_COUNTS.moods})`);
  }

  if (counts.mood_props < EXPECTED_COUNTS.mood_props) {
    issues.push(`❌ CRITICAL: Only ${counts.mood_props} mood properties found (expected at least ${EXPECTED_COUNTS.mood_props})`);
  }

  if (counts.categories < EXPECTED_COUNTS.categories) {
    issues.push(`❌ CRITICAL: Only ${counts.categories} categories found (expected at least ${EXPECTED_COUNTS.categories})`);
  }

  if (counts.mood_categories < EXPECTED_COUNTS.mood_categories) {
    issues.push(`❌ CRITICAL: Only ${counts.mood_categories} mood-category links found (expected at least ${EXPECTED_COUNTS.mood_categories})`);
  }

  if (counts.core_moods < EXPECTED_COUNTS.core_moods) {
    issues.push(`❌ CRITICAL: Only ${counts.core_moods} core moods found (expected at least ${EXPECTED_COUNTS.core_moods})`);
  }

  // Check for data consistency
  if (counts.moods > 0 && counts.mood_props === 0) {
    issues.push(`❌ CRITICAL: Have ${counts.moods} moods but no mood properties`);
  }

  if (counts.moods > 0 && counts.categories === 0) {
    issues.push(`❌ CRITICAL: Have ${counts.moods} moods but no categories`);
  }

  if (counts.moods > 0 && counts.mood_categories === 0) {
    issues.push(`❌ CRITICAL: Have ${counts.moods} moods but no mood-category links`);
  }

  // Warnings for unusual states
  if (counts.moods > 0 && counts.mood_props < counts.moods * 0.8) {
    warnings.push(`⚠️  WARNING: ${counts.mood_props} mood properties for ${counts.moods} moods (less than 80% coverage)`);
  }

  if (counts.users === 0) {
    warnings.push(`⚠️  WARNING: No users found in database`);
  }

  return { issues, warnings };
}

function findBestBackup() {
  const backupsDir = path.join(__dirname, '..', 'backups');
  const versionsDir = path.join(__dirname, '..', 'database-versions');
  
  const candidates = [];

  // Check recent backups
  if (fs.existsSync(backupsDir)) {
    const backups = fs.readdirSync(backupsDir)
      .filter(name => name.startsWith('backup_') && fs.statSync(path.join(backupsDir, name)).isDirectory())
      .sort()
      .reverse();

    for (const backup of backups.slice(0, 5)) { // Check last 5 backups
      const backupPath = path.join(backupsDir, backup, 'dev.db');
      if (fs.existsSync(backupPath)) {
        try {
          const count = execSync(`sqlite3 "${backupPath}" "SELECT COUNT(*) FROM mood"`).toString().trim();
          if (parseInt(count) >= EXPECTED_COUNTS.moods) {
            candidates.push({
              path: backupPath,
              restoreScript: path.join(backupsDir, backup, 'restore.js'),
              name: backup,
              moodCount: parseInt(count),
              type: 'backup'
            });
          }
        } catch (error) {
          // Skip invalid backups
        }
      }
    }
  }

  // Check version snapshots
  if (fs.existsSync(versionsDir)) {
    const files = fs.readdirSync(versionsDir)
      .filter(name => name.endsWith('.db'))
      .sort()
      .reverse();

    for (const file of files.slice(0, 3)) { // Check last 3 snapshots
      const snapshotPath = path.join(versionsDir, file);
      try {
        const count = execSync(`sqlite3 "${snapshotPath}" "SELECT COUNT(*) FROM mood"`).toString().trim();
        if (parseInt(count) >= EXPECTED_COUNTS.moods) {
          candidates.push({
            path: snapshotPath,
            restoreScript: null,
            name: file,
            moodCount: parseInt(count),
            type: 'snapshot'
          });
        }
      } catch (error) {
        // Skip invalid snapshots
      }
    }
  }

  return candidates.sort((a, b) => b.moodCount - a.moodCount)[0];
}

function performHealthCheck() {
  console.log('🔍 Performing database health check...\n');

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.log('❌ CRITICAL: Database file not found at:', DB_PATH);
    return false;
  }

  // Get current counts
  const counts = getCurrentCounts();
  if (!counts) {
    console.log('❌ CRITICAL: Unable to read database');
    return false;
  }

  // Display current state
  console.log('📊 Current Database State:');
  console.log(`   Moods: ${counts.moods}`);
  console.log(`   Mood Properties: ${counts.mood_props}`);
  console.log(`   Categories: ${counts.categories}`);
  console.log(`   Mood-Category Links: ${counts.mood_categories}`);
  console.log(`   Core Moods: ${counts.core_moods}`);
  console.log(`   Entries: ${counts.entries}`);
  console.log(`   Users: ${counts.users}`);
  console.log('');

  // Check health status
  const { issues, warnings } = checkHealthStatus(counts);

  // Display warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  // Display issues
  if (issues.length > 0) {
    console.log('❌ Critical Issues Found:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');

    // Find potential restoration options
    const bestBackup = findBestBackup();
    if (bestBackup) {
      console.log('🔧 Recovery Options:');
      console.log(`   Found ${bestBackup.type}: ${bestBackup.name}`);
      console.log(`   Mood count: ${bestBackup.moodCount}`);
      console.log(`   Path: ${bestBackup.path}`);
      
      if (bestBackup.restoreScript) {
        console.log(`   Restore command: node "${bestBackup.restoreScript}"`);
      } else {
        console.log(`   Manual restore needed from: ${bestBackup.path}`);
      }
    } else {
      console.log('❌ No valid backups found for restoration');
    }
    
    return false;
  }

  console.log('✅ Database health check passed! All critical components are present.');
  return true;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'check' || !command) {
    const isHealthy = performHealthCheck();
    process.exit(isHealthy ? 0 : 1);
  } else if (command === 'help') {
    console.log(`
🏥 Database Health Check Tool

Usage:
  node db-health-check.js [command]

Commands:
  check (default)  - Perform full database health check
  help            - Show this help message

What it checks:
  ✅ Database file exists
  ✅ Critical tables have expected data counts
  ✅ Data consistency between related tables
  ✅ Core mood system integrity
  ✅ Suggests recovery options if issues found

Expected minimums:
  - Moods: ${EXPECTED_COUNTS.moods}+
  - Mood Properties: ${EXPECTED_COUNTS.mood_props}+
  - Categories: ${EXPECTED_COUNTS.categories}+
  - Mood-Category Links: ${EXPECTED_COUNTS.mood_categories}+
  - Core Moods: ${EXPECTED_COUNTS.core_moods}+

Examples:
  node db-health-check.js           # Run health check
  node db-health-check.js check     # Run health check
    `);
  } else {
    console.log('❌ Unknown command. Use "node db-health-check.js help" for usage information.');
    process.exit(1);
  }
}

module.exports = { performHealthCheck, getCurrentCounts, checkHealthStatus, findBestBackup }; 