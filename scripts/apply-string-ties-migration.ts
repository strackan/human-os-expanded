// @ts-expect-error - pg types not available in this context
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  const dbUrl = process.env.STAGING_DATABASE_URL;

  if (!dbUrl) {
    console.error('STAGING_DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260202000001_string_ties_phase1_4.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
