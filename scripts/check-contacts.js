#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkContacts() {
  console.log('🔍 Checking contacts table...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for contacts table in different schemas
    const schemas = ['public', 'mvp'];
    
    for (const schema of schemas) {
      console.log(`📋 Checking ${schema}.contacts table...`);
      
      try {
        const { data, error, count } = await supabase
          .from(`${schema}.contacts`)
          .select('*', { count: 'exact' });

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Found ${count || 0} contacts in ${schema}.contacts`);
          if (data && data.length > 0) {
            console.log(`   📝 Sample contact:`, data[0]);
          }
        }
      } catch (err) {
        console.log(`   ❌ Table ${schema}.contacts doesn't exist or not accessible`);
      }
    }

    // Also check the customers table structure
    console.log('\n📋 Checking customers table structure...');
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else if (customers && customers.length > 0) {
        console.log(`   ✅ Customers table structure:`, Object.keys(customers[0]));
        console.log(`   📝 Sample customer:`, customers[0]);
      }
    } catch (err) {
      console.log(`   ❌ Error checking customers table: ${err.message}`);
    }

  } catch (error) {
    console.log('❌ Failed to connect to Supabase:', error.message);
  }
}

checkContacts().catch(console.error);
