#!/usr/bin/env node

/**
 * Data Migration Script: Move User Mood Plutchik Data to Unified mood_props
 * 
 * This script migrates existing Plutchik emotional data from user_moods table
 * to the unified mood_props table, creating proper relationships while preserving
 * all existing data and maintaining privacy controls.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUserMoodData() {
  console.log('🚀 Starting User Mood Data Migration...');
  
  try {
    // First, let's check what we're working with
    const userMoodCount = await prisma.userMood.count();
    console.log(`📊 Found ${userMoodCount} user moods to potentially migrate`);
    
    // Get all user moods that have Plutchik data (any non-null/non-zero rating)
    const userMoodsWithData = await prisma.userMood.findMany({
      where: {
        OR: [
          { joyRating: { not: null } },
          { trustRating: { not: null } },
          { fearRating: { not: null } },
          { surpriseRating: { not: null } },
          { sadnessRating: { not: null } },
          { anticipationRating: { not: null } },
          { angerRating: { not: null } },
          { disgustRating: { not: null } },
          { arousalLevel: { not: 5 } }, // Non-default values
          { valence: { not: 5 } },
          { dominance: { not: 5 } },
          { intensity: { not: 5 } }
        ]
      }
    });
    
    console.log(`✅ Found ${userMoodsWithData.length} user moods with emotional data to migrate`);
    
    if (userMoodsWithData.length === 0) {
      console.log('🎉 No data to migrate. Migration completed successfully!');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    // Process each user mood in a transaction
    for (const userMood of userMoodsWithData) {
      try {
        await prisma.$transaction(async (tx) => {
          // Check if mood_props already exists for this user mood
          const existingMoodProps = await tx.moodProps.findFirst({
            where: { userMoodId: userMood.id }
          });
          
          if (existingMoodProps) {
            console.log(`⏭️  Skipping user mood ${userMood.id} - mood_props already exists`);
            skippedCount++;
            return;
          }
          
          // Create mood_props record with user mood data
          const moodPropsData = {
            userMoodId: userMood.id,
            joyRating: userMood.joyRating || 0,
            trustRating: userMood.trustRating || 0,
            fearRating: userMood.fearRating || 0,
            surpriseRating: userMood.surpriseRating || 0,
            sadnessRating: userMood.sadnessRating || 0,
            anticipationRating: userMood.anticipationRating || 0,
            angerRating: userMood.angerRating || 0,
            disgustRating: userMood.disgustRating || 0,
            arousalLevel: userMood.arousalLevel || 5,
            valence: userMood.valence || 5,
            dominance: userMood.dominance || 5,
            intensity: userMood.intensity || 5,
            core: false // User moods are never core emotions
          };
          
          await tx.moodProps.create({ data: moodPropsData });
          
          console.log(`✅ Migrated user mood ${userMood.id} (${userMood.moodName}) to mood_props`);
          migratedCount++;
        });
        
      } catch (error) {
        console.error(`❌ Error migrating user mood ${userMood.id}:`, error.message);
        // Continue with other records rather than failing entirely
      }
    }
    
    // Summary
    console.log('\n📋 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} user moods`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount} user moods`);
    console.log(`   📊 Total processed: ${migratedCount + skippedCount} user moods`);
    
    // Verification
    const moodPropsCount = await prisma.moodProps.count({
      where: { userMoodId: { not: null } }
    });
    console.log(`\n🔍 Verification: ${moodPropsCount} mood_props records now exist for user moods`);
    
    console.log('\n🎉 User Mood Data Migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUserMoodData().catch((error) => {
    console.error('💥 Unhandled migration error:', error);
    process.exit(1);
  });
}

module.exports = { migrateUserMoodData }; 