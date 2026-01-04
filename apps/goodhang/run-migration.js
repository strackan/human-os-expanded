const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = fs.readFileSync('supabase/migrations/006_unique_rsvp_constraint.sql', 'utf8');

async function runMigration() {
  try {
    // Split SQL into individual statements (in case there are multiple)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('Running migration...');
    console.log('Statements to execute:', statements.length);

    for (const statement of statements) {
      console.log('\nExecuting:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('Error executing statement:', error);
        throw error;
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
