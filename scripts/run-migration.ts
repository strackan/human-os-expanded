/**
 * Run migration script
 * Usage: npx tsx scripts/run-migration.ts
 */

import { readFileSync } from 'fs';
import { Client } from 'pg';

// Use direct connection with SSL
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://postgres:lYjjq0p76p9h6dFB@db.amugmkrihnjsxlpwdzcy.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 30000,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Reading migration file...');
    const sql = readFileSync('supabase/migrations/064_claude_conversations.sql', 'utf-8');

    console.log('Executing migration...');
    await client.query(sql);

    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('claude_conversations', 'conversation_turns', 'claude_capture_queue')
    `);

    console.log('Created tables:', result.rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
