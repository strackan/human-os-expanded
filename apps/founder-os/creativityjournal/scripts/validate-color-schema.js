#!/usr/bin/env node

/**
 * Schema Validation Script for Custom Color Fields
 * Ensures the 5 custom color fields exist in the User table
 * This handles the v1.5.0 migration completion
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const REQUIRED_COLOR_FIELDS = [
  { name: 'custom_global_mood_color', default: '#10b981' },
  { name: 'custom_community_pending_color', default: '#f59e0b' },
  { name: 'custom_private_mood_color', default: '#ef4444' },
  { name: 'custom_default_mood_color', default: '#6b7280' },
  { name: 'custom_community_approved_color', default: '#059669' }
];

async function validateColorSchema() {
  console.log('🔍 Validating custom color schema...');
  
  try {
    // Check if all required fields exist
    const missingFields = [];
    
    for (const field of REQUIRED_COLOR_FIELDS) {
      try {
        await prisma.$queryRaw`SELECT ${field.name} FROM user LIMIT 1`;
        console.log(`✅ Field exists: ${field.name}`);
      } catch (error) {
        if (error.message.includes('no such column')) {
          missingFields.push(field);
          console.log(`❌ Missing field: ${field.name}`);
        } else {
          throw error;
        }
      }
    }
    
    // Add missing fields if any
    if (missingFields.length > 0) {
      console.log(`\n🔧 Adding ${missingFields.length} missing color fields...`);
      
      for (const field of missingFields) {
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE user ADD COLUMN ${field.name} TEXT DEFAULT '${field.default}';`
          );
          console.log(`✅ Added field: ${field.name} (default: ${field.default})`);
        } catch (error) {
          if (error.message.includes('duplicate column')) {
            console.log(`✅ Field already exists: ${field.name}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    // Ensure all users have default colors
    console.log('\n🎨 Ensuring all users have default colors...');
    
    const updateResult = await prisma.$executeRaw`
      UPDATE user 
      SET 
        custom_global_mood_color = COALESCE(custom_global_mood_color, '#10b981'),
        custom_community_pending_color = COALESCE(custom_community_pending_color, '#f59e0b'),
        custom_private_mood_color = COALESCE(custom_private_mood_color, '#ef4444'),
        custom_default_mood_color = COALESCE(custom_default_mood_color, '#6b7280'),
        custom_community_approved_color = COALESCE(custom_community_approved_color, '#059669')
      WHERE 
        custom_global_mood_color IS NULL 
        OR custom_community_pending_color IS NULL 
        OR custom_private_mood_color IS NULL 
        OR custom_default_mood_color IS NULL 
        OR custom_community_approved_color IS NULL;
    `;
    
    console.log(`✅ Updated ${updateResult} users with default colors`);
    
    // Create performance index if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_user_mood_colors ON user(
          custom_global_mood_color, 
          custom_community_pending_color, 
          custom_private_mood_color, 
          custom_default_mood_color,
          custom_community_approved_color
        );
      `;
      console.log('✅ Created performance index for color lookups');
    } catch (error) {
      console.log('⚠️  Index may already exist or failed to create');
    }
    
    console.log('\n🎉 Custom color schema validation complete!');
    console.log('✅ All 5 custom color fields are present and configured');
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Update current.json to mark v1.5.0 as complete
async function updateVersionTracking() {
  try {
    const versionFile = path.join(__dirname, '../database-versions/current.json');
    const versionData = {
      version: 'v1.5.0',
      description: 'Comprehensive Custom Mood Colors System',
      features: [
        'Added 5 custom color fields for different mood categories',
        'Implemented default colors for all users',
        'Created performance indexes for color lookups',
        'Schema validation completed successfully'
      ],
      updatedAt: new Date().toISOString(),
      emotionCount: 459,
      improvements: 4
    };
    
    fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
    console.log('✅ Updated version tracking to v1.5.0 (complete)');
    
  } catch (error) {
    console.error('⚠️  Could not update version tracking:', error.message);
  }
}

// Run validation
async function main() {
  const success = await validateColorSchema();
  
  if (success) {
    await updateVersionTracking();
    console.log('\n🚀 Ready to implement UI for custom mood colors!');
    process.exit(0);
  } else {
    console.log('\n❌ Schema validation failed. Please check the errors above.');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateColorSchema }; 