/**
 * Run Migration 078 - Add entity_slug column
 *
 * Uses pg directly since Supabase JS client can't run DDL
 */

import { Client } from 'pg';

const DATABASE_URL = 'postgresql://postgres:Saij1HV5bzglp7cV@db.zulowgscotdrqlccomht.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add entity_slug column
    console.log('\nAdding entity_slug column...');
    await client.query(`
      ALTER TABLE sculptor_sessions
      ADD COLUMN IF NOT EXISTS entity_slug TEXT;
    `);
    console.log('✓ entity_slug column added');

    // Create index
    console.log('\nCreating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sculptor_sessions_entity_slug
      ON sculptor_sessions(entity_slug);
    `);
    console.log('✓ index created');

    // Add comment
    console.log('\nAdding comment...');
    await client.query(`
      COMMENT ON COLUMN sculptor_sessions.entity_slug IS
        'Entity slug for storage-based context lookup. When set, reads from storage://contexts/{entity_slug}/ instead of scene_prompt column.';
    `);
    console.log('✓ comment added');

    console.log('\n✓ Migration 078 complete!');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
