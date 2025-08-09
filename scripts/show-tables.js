#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function showTables() {
  console.log('🔍 Fetching all tables from Supabase...\n');

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables:');
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Set' : 'Missing'}`);
    console.log('\n💡 Make sure .env.local exists and contains the required variables.');
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Method 1: Try to get tables using raw SQL
    console.log('📋 Method 1: Using raw SQL query...');
    try {
      const { data: tables, error } = await supabase
        .rpc('get_all_tables')
        .select('*');

      if (error) {
        console.log('   ❌ Raw SQL failed, trying alternative method...');
        throw error;
      }

      if (tables && tables.length > 0) {
        console.log('   ✅ Found tables:');
        tables.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table.table_name}`);
        });
        return;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Method 2: Try to query information_schema directly
    console.log('\n📋 Method 2: Using information_schema...');
    try {
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (error) {
        console.log('   ❌ information_schema query failed, trying alternative method...');
        throw error;
      }

      if (tables && tables.length > 0) {
        console.log('   ✅ Found tables:');
        tables.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table.table_name}`);
        });
        return;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Method 3: Try known tables one by one
    console.log('\n📋 Method 3: Checking known tables...');
    const knownTables = [
      'profiles',
      'customers',
      'contracts',
      'renewals',
      'events',
      'workflows',
      'tasks',
      'alerts',
      'conversations',
      'messages'
    ];

    const existingTables = [];
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          existingTables.push(tableName);
        }
      } catch (error) {
        // Table doesn't exist or not accessible
      }
    }

    if (existingTables.length > 0) {
      console.log('   ✅ Found accessible tables:');
      existingTables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
    } else {
      console.log('   ❌ No accessible tables found');
    }

    // Method 4: Try to get table count for each known table
    console.log('\n📋 Method 4: Table row counts...');
    for (const tableName of existingTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`   ${tableName}: ${count || 0} rows`);
        }
      } catch (error) {
        console.log(`   ${tableName}: Error getting count`);
      }
    }

  } catch (error) {
    console.log('❌ Failed to connect to Supabase:');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if Supabase is running: npx supabase start');
    console.log('   2. Verify environment variables in .env.local');
    console.log('   3. Check network connectivity');
  }
}

// Run the script
showTables().catch(console.error); 