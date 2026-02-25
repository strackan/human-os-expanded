/**
 * Database Seeding Script
 * Executes the Obsidian Black demo data seed SQL
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function seedDatabase() {
  // Get Supabase URL and service role key from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase', 'scripts', 'seed_aco_demo_data.sql');
  console.log('📄 Reading SQL file:', sqlPath);

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('🌱 Executing seed script...');

  try {
    // Execute the SQL using Supabase's RPC or direct SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    }

    console.log('✅ Seed script executed successfully!');
    console.log('📊 Data:', data);

    // Verify the customer was created
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440001')
      .single();

    if (customerError) {
      console.error('⚠️  Warning: Could not verify customer creation:', customerError);
    } else {
      console.log('✅ Verified: Obsidian Black customer created');
      console.log('   Name:', customer.name);
      console.log('   ARR:', customer.current_arr);
      console.log('   Health Score:', customer.health_score);
    }

  } catch (error) {
    console.error('❌ Error executing seed script:', error);
    process.exit(1);
  }
}

seedDatabase();
