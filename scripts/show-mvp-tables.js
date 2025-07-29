#!/usr/bin/env node

/**
 * Show Renubu MVP Tables
 * 
 * Displays all tables in the renubu_mvp schema with their structure
 * 
 * Usage:
 *   node scripts/show-mvp-tables.js
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

async function showMvpTables() {
  try {
    console.log('🚀 RENUBU MVP SCHEMA TABLES');
    console.log('=============================\n');

    // Define the MVP tables and their descriptions
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

    // Display each table
    mvpTables.forEach((table, index) => {
      console.log(`📋 ${index + 1}. ${table.name.toUpperCase()}`);
      console.log(`   Description: ${table.description}`);
      console.log('   Fields:');
      table.fields.forEach(field => {
        console.log(`     • ${field}`);
      });
      console.log('');
    });

    // Show record counts
    console.log('📊 TABLE RECORD COUNTS');
    console.log('========================');
    
    for (const table of mvpTables) {
      try {
        const { count, error } = await supabase
          .from(`renubu_mvp.${table.name}`)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ${table.name}: ❌ Error - ${error.message}`);
        } else {
          console.log(`   ${table.name}: ${count} records`);
        }
      } catch (e) {
        console.log(`   ${table.name}: ❌ Not accessible`);
      }
    }

    console.log('\n💡 Quick Access:');
    console.log('   • Use "public.users", "public.customers", etc. to access tables');
    console.log('   • All tables have RLS enabled with simple policies');
    console.log('   • Indexes created for performance on key fields');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showMvpTables().catch(console.error); 