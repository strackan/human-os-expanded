#!/usr/bin/env node

/**
 * Show Renubu MVP Tables - Better Version
 * 
 * Uses a more reliable method to check actual table existence
 * 
 * Usage:
 *   node scripts/show-mvp-tables-better.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function showMvpTablesBetter() {
  try {
    console.log('🚀 RENUBU MVP SCHEMA TABLES (Live Check)');
    console.log('==========================================\n');

    // Define expected MVP tables
    const expectedTables = ['users', 'customers', 'renewals', 'tasks', 'events', 'notes'];
    const foundTables = [];
    const missingTables = [];

    console.log('🔍 Checking for MVP tables in database...\n');

    // Check each expected table
    for (const tableName of expectedTables) {
      try {
        // Try to query the table to see if it exists
                 const { data, error } = await supabase
           .from(`mvp.${tableName}`)
           .select('*')
           .limit(1);

        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('relation')) {
            missingTables.push(tableName);
            console.log(`❌ ${tableName}: Not found in database`);
          } else {
            // Table exists but has other issues (like RLS)
            foundTables.push(tableName);
            console.log(`✅ ${tableName}: Found (with access issues)`);
          }
        } else {
          foundTables.push(tableName);
          console.log(`✅ ${tableName}: Found and accessible`);
        }
      } catch (e) {
        missingTables.push(tableName);
        console.log(`❌ ${tableName}: Error checking - ${e.message}`);
      }
    }

    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`✅ Found: ${foundTables.length} tables`);
    console.log(`❌ Missing: ${missingTables.length} tables`);

    if (foundTables.length > 0) {
      console.log('\n📋 FOUND TABLES:');
      console.log('================');
      foundTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    }

    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      console.log('==================');
      missingTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    }

    // Show record counts for found tables
    if (foundTables.length > 0) {
      console.log('\n📈 RECORD COUNTS');
      console.log('================');
      
      for (const tableName of foundTables) {
        try {
                   const { count, error } = await supabase
           .from(`mvp.${tableName}`)
           .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`   ${tableName}: ❌ Error - ${error.message}`);
          } else {
            console.log(`   ${tableName}: ${count} records`);
          }
        } catch (e) {
          console.log(`   ${tableName}: ❌ Not accessible`);
        }
      }
    }

    // Show expected structure
    console.log('\n📋 EXPECTED MVP STRUCTURE');
    console.log('==========================');
    await showExpectedStructure();

    console.log('\n💡 RECOMMENDATIONS:');
    if (missingTables.length > 0) {
      console.log('   • Run migrations to create missing tables');
      console.log('   • Use: npx supabase db reset');
    } else {
      console.log('   • All MVP tables are present!');
    }
    console.log('   • Use "public.users", "public.customers", etc. to access tables');
    console.log('   • All tables have RLS enabled with simple policies');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔄 Falling back to static information...\n');
    await showExpectedStructure();
  }
}

async function showExpectedStructure() {
  const mvpTables = [
    {
      name: 'users',
      description: 'Simplified user profiles',
      fields: [
        'id (UUID, PK) - References auth.users(id)',
        'email (TEXT, NOT NULL)',
        'full_name (TEXT)',
        'avatar_url (TEXT)',
        'created_at (TIMESTAMPTZ)',
        'updated_at (TIMESTAMPTZ)'
      ]
    },
    {
      name: 'customers',
      description: 'Simplified customer management',
      fields: [
        'id (UUID, PK)',
        'name (TEXT, NOT NULL)',
        'domain (TEXT)',
        'industry (TEXT)',
        'health_score (INTEGER, DEFAULT 50)',
        'primary_contact_name (TEXT)',
        'primary_contact_email (TEXT)',
        'current_arr (DECIMAL(12,2), DEFAULT 0)',
        'renewal_date (DATE)',
        'assigned_to (UUID) - References users(id)',
        'created_at (TIMESTAMPTZ)',
        'updated_at (TIMESTAMPTZ)'
      ]
    },
    {
      name: 'renewals',
      description: 'Simplified renewal management',
      fields: [
        'id (UUID, PK)',
        'customer_id (UUID) - References customers(id)',
        'renewal_date (DATE, NOT NULL)',
        'current_arr (DECIMAL(12,2), NOT NULL)',
        'proposed_arr (DECIMAL(12,2))',
        'probability (INTEGER, DEFAULT 50)',
        'stage (TEXT, DEFAULT \'discovery\')',
        'risk_level (TEXT, DEFAULT \'medium\')',
        'assigned_to (UUID) - References users(id)',
        'notes (TEXT)',
        'created_at (TIMESTAMPTZ)',
        'updated_at (TIMESTAMPTZ)'
      ]
    },
    {
      name: 'tasks',
      description: 'Simplified task management',
      fields: [
        'id (UUID, PK)',
        'renewal_id (UUID) - References renewals(id)',
        'title (TEXT, NOT NULL)',
        'description (TEXT)',
        'status (TEXT, DEFAULT \'pending\')',
        'priority (TEXT, DEFAULT \'medium\')',
        'assigned_to (UUID) - References users(id)',
        'due_date (DATE)',
        'completed_at (TIMESTAMPTZ)',
        'created_at (TIMESTAMPTZ)',
        'updated_at (TIMESTAMPTZ)'
      ]
    },
    {
      name: 'events',
      description: 'Simplified event management',
      fields: [
        'id (UUID, PK)',
        'title (TEXT, NOT NULL)',
        'description (TEXT)',
        'event_type (TEXT, NOT NULL)',
        'customer_id (UUID) - References customers(id)',
        'user_id (UUID) - References users(id)',
        'event_date (TIMESTAMPTZ, NOT NULL)',
        'status (TEXT, DEFAULT \'scheduled\')',
        'created_at (TIMESTAMPTZ)',
        'updated_at (TIMESTAMPTZ)'
      ]
    },
    {
      name: 'notes',
      description: 'Simple notes system',
      fields: [
        'id (UUID, PK)',
        'customer_id (UUID) - References customers(id)',
        'renewal_id (UUID) - References renewals(id)',
        'user_id (UUID) - References users(id)',
        'content (TEXT, NOT NULL)',
        'note_type (TEXT, DEFAULT \'general\')',
        'created_at (TIMESTAMPTZ)',
        'updated_at (TIMESTAMPTZ)'
      ]
    }
  ];

  mvpTables.forEach((table, index) => {
    console.log(`📋 ${index + 1}. ${table.name.toUpperCase()}`);
    console.log(`   Description: ${table.description}`);
    console.log('   Fields:');
    table.fields.forEach(field => {
      console.log(`     • ${field}`);
    });
    console.log('');
  });
}

showMvpTablesBetter().catch(console.error); 