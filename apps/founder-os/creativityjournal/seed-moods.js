const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedMoods() {
  try {
    console.log('🌱 Starting mood seeding...');
    
    // Read the exported moods file
    const moodsFilePath = path.join(__dirname, 'moods_export.txt');
    const moodsData = fs.readFileSync(moodsFilePath, 'utf8');
    
    // Parse the data (skip header line)
    const lines = moodsData.trim().split('\n').slice(1);
    const moods = lines.map(line => {
      const [id, name] = line.split('|');
      return { id: parseInt(id), name: name.trim() };
    });
    
    console.log(`📊 Found ${moods.length} moods to import`);
    
    // Clear existing moods first
    console.log('🗑️  Clearing existing moods...');
    await prisma.entryMoods.deleteMany({});
    await prisma.mood.deleteMany({});
    
    // Import all moods
    console.log('📝 Importing moods...');
    for (const mood of moods) {
      await prisma.mood.upsert({
        where: { name: mood.name },
        update: {},
        create: { name: mood.name }
      });
    }
    
    // Verify the import
    const count = await prisma.mood.count();
    console.log(`✅ Successfully imported ${count} moods!`);
    
    // Show a sample of imported moods
    const sampleMoods = await prisma.mood.findMany({
      take: 10,
      orderBy: { name: 'asc' }
    });
    console.log('📋 Sample of imported moods:', sampleMoods.map(m => m.name));
    
  } catch (error) {
    console.error('❌ Error seeding moods:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMoods(); 