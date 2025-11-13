import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const STAGING_URL = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const STAGING_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNjg5MiwiZXhwIjoyMDc3MDgyODkyfQ.gnUWQYmviaKUcm3haH672v-VK-G1p-Bqyq-EfBNXYfo';

async function runMigration() {
  const migrationPath = process.argv[2];

  if (!migrationPath) {
    console.error('Usage: npx tsx scripts/run-migration.ts <migration-file-path>');
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const supabase = createClient(STAGING_URL, STAGING_SERVICE_KEY);

  console.log(`Running migration: ${path.basename(migrationPath)}`);

  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  console.log('Migration completed successfully!');
}

runMigration();
