import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default entry statuses
  const entryStatuses = [
    { status: 'Draft' },
    { status: 'Published' },
    { status: 'Archived' }
  ]

  for (const status of entryStatuses) {
    const existing = await prisma.entryStatus.findFirst({ where: { status: status.status } });
    if (!existing) {
      await prisma.entryStatus.create({ data: status });
    }
  }

  // Create default task statuses
  const taskStatuses = [
    { name: 'To Do', description: 'Task is waiting to be started' },
    { name: 'In Progress', description: 'Task is currently being worked on' },
    { name: 'Completed', description: 'Task has been finished' },
    { name: 'Cancelled', description: 'Task has been cancelled' }
  ]

  for (const status of taskStatuses) {
    const existing = await prisma.taskStatus.findFirst({ where: { name: status.name } });
    if (!existing) {
      await prisma.taskStatus.create({ data: status });
    }
  }

  // Create default task priorities
  const taskPriorities = [
    { name: 'Low', description: 'Low priority task' },
    { name: 'Medium', description: 'Medium priority task' },
    { name: 'High', description: 'High priority task' },
    { name: 'Urgent', description: 'Urgent priority task' }
  ]

  for (const priority of taskPriorities) {
    const existing = await prisma.taskPriority.findFirst({ where: { name: priority.name } });
    if (!existing) {
      await prisma.taskPriority.create({ data: priority });
    }
  }

  // Create default project statuses
  const projectStatuses = [
    { name: 'Active', description: 'Project is currently active' },
    { name: 'On Hold', description: 'Project is temporarily paused' },
    { name: 'Completed', description: 'Project has been completed' },
    { name: 'Cancelled', description: 'Project has been cancelled' }
  ]

  for (const status of projectStatuses) {
    const existing = await prisma.projectStatus.findFirst({ where: { name: status.name } });
    if (!existing) {
      await prisma.projectStatus.create({ data: status });
    }
  }

  // ⚠️ IMPORTANT: Check if comprehensive emotion data exists before seeding moods
  const existingMoodCount = await prisma.mood.count();
  console.log(`📊 Found ${existingMoodCount} existing moods`);

  if (existingMoodCount < 400) {
    console.log('🚨 Comprehensive emotion data missing, seeding basic moods...');
    console.log('💡 Use "node scripts/db-version-manager.js ensure-emotions" to restore full emotion system');
    
    // Remove existing basic moods only if we have less than 400
    await prisma.entryMoods.deleteMany({});
    await prisma.mood.deleteMany({});

    // Create basic moods as fallback
    const basicMoods = [
      'Happy',
      'Sad',
      'Excited',
      'Calm',
      'Anxious',
      'Confident',
      'Confused',
      'Grateful',
      'Frustrated',
      'Inspired'
    ];

    for (const moodName of basicMoods) {
      await prisma.mood.upsert({
        where: { name: moodName },
        update: {},
        create: { name: moodName }
      });
    }

    console.log('⚠️  Basic moods seeded. Run version manager to restore comprehensive emotions.');
  } else {
    console.log('✅ Comprehensive emotion data detected, preserving existing moods');
  }

  // Create some default labels
  const labels = [
    { name: 'Ideas', color: 'FF6B6B' },
    { name: 'Goals', color: '4ECDC4' },
    { name: 'Reflections', color: '45B7D1' },
    { name: 'Creative', color: '96CEB4' },
    { name: 'Personal', color: 'FFEAA7' }
  ]

  for (const label of labels) {
    const existing = await prisma.label.findFirst({ where: { name: label.name, color: label.color } });
    if (!existing) {
      await prisma.label.create({ data: label });
    }
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 