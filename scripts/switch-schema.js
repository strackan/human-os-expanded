#!/usr/bin/env node

/**
 * Schema Switching Utility for Renubu
 * 
 * This script helps you switch between the production schema (renubu_prod) 
 * and the MVP schema (renubu_mvp) for development.
 * 
 * Usage:
 *   node scripts/switch-schema.js prod    # Switch to production schema
 *   node scripts/switch-schema.js mvp     # Switch to MVP schema
 *   node scripts/switch-schema.js status  # Show current schema status
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

async function switchToSchema(schemaName) {
  try {
    console.log(`🔄 Switching to ${schemaName} schema...`);
    
    // Set the search path to the specified schema
    const { error } = await supabase.rpc('switch_to_schema', { schema_name: schemaName });
    
    if (error) {
      console.error('❌ Error switching schema:', error);
      return;
    }
    
    console.log(`✅ Successfully switched to ${schemaName} schema`);
    
    // Show schema info
    await showSchemaStatus();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function showSchemaStatus() {
  try {
    console.log('\n📊 Current Schema Status:');
    console.log('========================');
    
    const { data, error } = await supabase
      .from('schema_status')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching schema status:', error);
      return;
    }
    
    data.forEach(schema => {
      console.log(`\n🔸 ${schema.schema_name.toUpperCase()}`);
      console.log(`   Description: ${schema.description}`);
      console.log(`   Complexity: ${schema.complexity_level}`);
    });
    
    console.log('\n💡 Tip: Use "node scripts/switch-schema.js prod" or "node scripts/switch-schema.js mvp" to switch schemas');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function showTableCounts() {
  try {
    console.log('\n📈 Table Counts by Schema:');
    console.log('==========================');
    
         // Count tables in public schema (production)
     const prodTables = [
       'profiles', 'companies', 'customers', 'contracts', 'renewals', 
       'events', 'alerts', 'workflows', 'task_templates', 'renewal_tasks',
       'renewal_workflow_outcomes', 'customer_properties', 'key_dates',
       'date_monitoring_log', 'workflow_conversations', 'conversation_messages'
     ];
     
     console.log('\n🔸 PUBLIC Schema (Production):');
    for (const table of prodTables) {
      try {
                 const { count, error } = await supabase
           .from(`public.${table}`)
           .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ${table}: ❌ Error`);
        } else {
          console.log(`   ${table}: ${count} records`);
        }
      } catch (e) {
        console.log(`   ${table}: ❌ Not accessible`);
      }
    }
    
         // Count tables in mvp schema
     const mvpTables = ['users', 'customers', 'renewals', 'tasks', 'events', 'notes'];
     
     console.log('\n🔸 MVP Schema:');
    for (const table of mvpTables) {
      try {
                 const { count, error } = await supabase
           .from(`mvp.${table}`)
           .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ${table}: ❌ Error`);
        } else {
          console.log(`   ${table}: ${count} records`);
        }
      } catch (e) {
        console.log(`   ${table}: ❌ Not accessible`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('❌ Please specify a command: prod, mvp, or status');
    console.log('\nUsage:');
    console.log('  node scripts/switch-schema.js prod    # Switch to production schema');
    console.log('  node scripts/switch-schema.js mvp     # Switch to MVP schema');
    console.log('  node scripts/switch-schema.js status  # Show schema status');
    process.exit(1);
  }
  
  switch (command.toLowerCase()) {
    case 'prod':
      await switchToSchema('public');
      break;
    case 'mvp':
      await switchToSchema('mvp');
      break;
    case 'status':
      await showSchemaStatus();
      await showTableCounts();
      break;
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Available commands: prod, mvp, status');
      process.exit(1);
  }
}

main().catch(console.error); 