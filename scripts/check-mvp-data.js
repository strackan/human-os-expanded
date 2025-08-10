#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMvpData() {
  console.log('🔍 Checking mvp schema data...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check mvp schema tables
    const mvpTables = ['customers', 'renewals', 'events', 'tasks', 'notes'];
    
    for (const tableName of mvpTables) {
      console.log(`📋 Checking mvp.${tableName}...`);
      
      try {
        const { data, error, count } = await supabase
          .from(`mvp.${tableName}`)
          .select('*', { count: 'exact' });

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Found ${count || 0} rows in mvp.${tableName}`);
          if (data && data.length > 0) {
            console.log(`   📝 Sample data:`, data[0]);
          }
        }
      } catch (err) {
        console.log(`   ❌ Table mvp.${tableName} doesn't exist or not accessible`);
      }
    }

    // Also check public schema
    console.log('\n📋 Checking public schema...');
    for (const tableName of mvpTables) {
      try {
        const { data, error, count } = await supabase
          .from(`public.${tableName}`)
          .select('*', { count: 'exact' });

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Found ${count || 0} rows in public.${tableName}`);
        }
      } catch (err) {
        console.log(`   ❌ Table public.${tableName} doesn't exist or not accessible`);
      }
    }

  } catch (error) {
    console.log('❌ Failed to connect to Supabase:', error.message);
  }
}

checkMvpData().catch(console.error);
