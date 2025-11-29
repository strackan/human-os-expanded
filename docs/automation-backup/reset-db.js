const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.join(__dirname, 'renubu-test.db');

console.log('🔄 Resetting database...\n');

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Deleted existing database\n');
}

// Run seed script
console.log('🌱 Running seed script...\n');
execSync('node seed.js', { stdio: 'inherit' });

console.log('✨ Database reset complete!\n');
