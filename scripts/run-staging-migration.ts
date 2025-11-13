import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function runMigration() {
  const sql = fs.readFileSync('supabase/migrations/20251112190742_add_oauth_encryption_functions.sql', 'utf-8');

  const supabase = createClient(
    'https://amugmkrihnjsxlpwdzcy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNjg5MiwiZXhwIjoyMDc3MDgyODkyfQ.gnUWQYmviaKUcm3haH672v-VK-G1p-Bqyq-EfBNXYfo'
  );

  console.log('Running encryption functions migration on staging...\n');

  // Try executing the full SQL
  const { data, error } = await (supabase as any).rpc('exec', {
    sql
  });

  if (error) {
    console.error('Error:', error);
    console.log('\nTrying alternative approach with REST API...\n');

    // Use REST API directly
    const response = await fetch(
      'https://amugmkrihnjsxlpwdzcy.supabase.co/rest/v1/rpc/exec',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNjg5MiwiZXhwIjoyMDc3MDgyODkyfQ.gnUWQYmviaKUcm3haH672v-VK-G1p-Bqyq-EfBNXYfo',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtdWdta3JpaG5qc3hscHdkemN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNjg5MiwiZXhwIjoyMDc3MDgyODkyfQ.gnUWQYmviaKUcm3haH672v-VK-G1p-Bqyq-EfBNXYfo'
        },
        body: JSON.stringify({ sql })
      }
    );

    const result = await response.json();
    console.log('REST API Response:', result);

    if (!response.ok) {
      console.error('\nCould not run migration automatically.');
      console.log('\nPlease run this SQL manually in the Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/sql/new');
      console.log('\nSQL to run:');
      console.log('---');
      console.log(sql);
      console.log('---');
      process.exit(1);
    }
  } else {
    console.log('Migration completed successfully!');
    console.log('Result:', data);
  }
}

runMigration();
