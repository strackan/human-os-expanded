/**
 * Create Company Schema Script
 *
 * Creates an isolated schema for a company with all required tables and permissions.
 * Used when ISOLATED_SCHEMAS mode is enabled.
 *
 * Usage:
 *   npx tsx scripts/create-company-schema.ts <company_id>
 *   npx tsx scripts/create-company-schema.ts abc123-xyz789
 */

import { createClient } from '@supabase/supabase-js';
import { getSchemaName, getSchemaInfo } from '../src/lib/supabase/schema';

// Supabase admin client (requires service role key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * SQL template for creating company schema
 * Creates schema and clones all tables from public schema
 */
const CREATE_SCHEMA_SQL = (schemaName: string) => `
-- Create schema
CREATE SCHEMA IF NOT EXISTS ${schemaName};

-- Grant usage to authenticated role
GRANT USAGE ON SCHEMA ${schemaName} TO authenticated;
GRANT USAGE ON SCHEMA ${schemaName} TO service_role;

-- Clone workflow tables
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_definitions (LIKE public.workflow_definitions INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_executions (LIKE public.workflow_executions INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_steps (LIKE public.workflow_steps INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_actions (LIKE public.workflow_actions INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_artifacts (LIKE public.workflow_artifacts INCLUDING ALL);

-- Clone chat tables
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_chat_threads (LIKE public.workflow_chat_threads INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_chat_messages (LIKE public.workflow_chat_messages INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_llm_context (LIKE public.workflow_llm_context INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_llm_tool_calls (LIKE public.workflow_llm_tool_calls INCLUDING ALL);
CREATE TABLE IF NOT EXISTS ${schemaName}.workflow_chat_branches (LIKE public.workflow_chat_branches INCLUDING ALL);

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA ${schemaName} TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA ${schemaName} TO service_role;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA ${schemaName} TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ${schemaName} TO service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} GRANT ALL ON SEQUENCES TO service_role;
`;

/**
 * SQL template for creating indexes in company schema
 */
const CREATE_INDEXES_SQL = (schemaName: string) => `
-- Workflow execution indexes
CREATE INDEX IF NOT EXISTS idx_${schemaName}_exec_customer ON ${schemaName}.workflow_executions(customer_id);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_exec_csm ON ${schemaName}.workflow_executions(assigned_csm_id);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_exec_status ON ${schemaName}.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_exec_workflow ON ${schemaName}.workflow_executions(workflow_config_id);

-- Chat thread indexes
CREATE INDEX IF NOT EXISTS idx_${schemaName}_threads_execution ON ${schemaName}.workflow_chat_threads(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_threads_step ON ${schemaName}.workflow_chat_threads(step_execution_id);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_threads_status ON ${schemaName}.workflow_chat_threads(status);

-- Chat message indexes
CREATE INDEX IF NOT EXISTS idx_${schemaName}_messages_thread ON ${schemaName}.workflow_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_messages_sequence ON ${schemaName}.workflow_chat_messages(thread_id, sequence_number);

-- Action indexes
CREATE INDEX IF NOT EXISTS idx_${schemaName}_actions_execution ON ${schemaName}.workflow_actions(execution_id);
CREATE INDEX IF NOT EXISTS idx_${schemaName}_actions_user ON ${schemaName}.workflow_actions(performed_by);
`;

/**
 * Create company schema
 */
async function createCompanySchema(companyId: string) {
  console.log('\n🏗️  Creating Company Schema\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Get schema info
  const schemaInfo = getSchemaInfo(companyId);
  console.log('📋 Schema Information:');
  console.log(`   Company ID:    ${schemaInfo.companyId}`);
  console.log(`   Schema Name:   ${schemaInfo.schemaName}`);
  console.log(`   Mode:          ${schemaInfo.mode}`);
  console.log('');

  // Check if schema already exists
  const { data: existingSchemas, error: checkError } = await supabase.rpc(
    'pg_namespace',
    {}
  );

  if (checkError) {
    console.log('⚠️  Could not check existing schemas (continuing anyway)');
  }

  // Create schema
  console.log('🔨 Creating schema and tables...');
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: CREATE_SCHEMA_SQL(schemaInfo.schemaName),
  });

  if (createError) {
    console.error('❌ Failed to create schema:', createError.message);
    process.exit(1);
  }

  console.log('✅ Schema and tables created');
  console.log('');

  // Create indexes
  console.log('📇 Creating indexes...');
  const { error: indexError } = await supabase.rpc('exec_sql', {
    sql: CREATE_INDEXES_SQL(schemaInfo.schemaName),
  });

  if (indexError) {
    console.error('❌ Failed to create indexes:', indexError.message);
    console.error('   (Schema was created, but indexes may be missing)');
  } else {
    console.log('✅ Indexes created');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✨ Company schema created successfully!');
  console.log('');
  console.log('Next steps:');
  console.log(`   1. Migrate data: npx tsx scripts/migrate-schema-data.ts ${companyId}`);
  console.log('   2. Verify schema: SELECT * FROM information_schema.schemata');
  console.log('   3. Test queries: SELECT * FROM ' + schemaInfo.schemaName + '.workflow_executions');
  console.log('');
}

/**
 * Drop company schema (with confirmation)
 */
async function dropCompanySchema(companyId: string, confirm: boolean = false) {
  const schemaInfo = getSchemaInfo(companyId);

  if (!confirm) {
    console.error('❌ Dropping schema requires confirmation');
    console.error(`   Use: --drop --confirm to drop ${schemaInfo.schemaName}`);
    process.exit(1);
  }

  console.log('\n🗑️  Dropping Company Schema\n');
  console.log('⚠️  WARNING: This will delete all data!');
  console.log(`   Schema: ${schemaInfo.schemaName}`);
  console.log('');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `DROP SCHEMA IF EXISTS ${schemaInfo.schemaName} CASCADE;`,
  });

  if (error) {
    console.error('❌ Failed to drop schema:', error.message);
    process.exit(1);
  }

  console.log('✅ Schema dropped successfully');
  console.log('');
}

/**
 * List all company schemas
 */
async function listCompanySchemas() {
  console.log('\n📋 Company Schemas\n');
  console.log('═══════════════════════════════════════════════════\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        nspname as schema_name,
        pg_size_pretty(sum(pg_total_relation_size(c.oid))::bigint) as size
      FROM pg_class c
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE nspname LIKE 'company_%'
      GROUP BY nspname
      ORDER BY nspname;
    `,
  });

  if (error) {
    console.error('❌ Failed to list schemas:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('   No company schemas found');
  } else {
    console.log('   Schema Name              Size');
    console.log('   ────────────────────────────────────────');
    data.forEach((row: any) => {
      console.log(`   ${row.schema_name.padEnd(20)}  ${row.size}`);
    });
  }

  console.log('');
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('\n📘 Create Company Schema Tool\n');
    console.log('Usage:');
    console.log('  npx tsx scripts/create-company-schema.ts <company_id>');
    console.log('  npx tsx scripts/create-company-schema.ts --list');
    console.log('  npx tsx scripts/create-company-schema.ts --drop <company_id> --confirm');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/create-company-schema.ts abc123-xyz789');
    console.log('  npx tsx scripts/create-company-schema.ts --list');
    console.log('  npx tsx scripts/create-company-schema.ts --drop abc123-xyz789 --confirm');
    console.log('');
    process.exit(0);
  }

  // List schemas
  if (args.includes('--list')) {
    await listCompanySchemas();
    return;
  }

  // Drop schema
  if (args.includes('--drop')) {
    const companyId = args.find((arg) => !arg.startsWith('--'));
    if (!companyId) {
      console.error('❌ Company ID required for --drop');
      process.exit(1);
    }
    await dropCompanySchema(companyId, args.includes('--confirm'));
    return;
  }

  // Create schema
  const companyId = args[0];
  await createCompanySchema(companyId);
}

// Run CLI
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
