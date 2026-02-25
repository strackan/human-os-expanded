/**
 * Migrate Schema Data Script
 *
 * Migrates data between public schema and company-specific schemas.
 * Supports both directions:
 * - public → company_xxx (when enabling isolated schemas)
 * - company_xxx → public (when consolidating to shared schema)
 *
 * Usage:
 *   npx tsx scripts/migrate-schema-data.ts --to-isolated <company_id>
 *   npx tsx scripts/migrate-schema-data.ts --to-shared <company_id>
 *   npx tsx scripts/migrate-schema-data.ts --verify <company_id>
 */

import { createClient } from '@supabase/supabase-js';
import { getSchemaName, getSchemaInfo } from '../src/lib/supabase/schema';

// Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Tables to migrate (in order due to foreign keys)
 */
const MIGRATION_TABLES = [
  'workflow_definitions',
  'workflow_executions',
  'workflow_steps',
  'workflow_actions',
  'workflow_artifacts',
  'workflow_chat_threads',
  'workflow_chat_messages',
  'workflow_llm_context',
  'workflow_llm_tool_calls',
  'workflow_chat_branches',
];

/**
 * Migrate data from public to company schema
 */
async function migrateToIsolated(companyId: string, dryRun: boolean = false) {
  const schemaInfo = getSchemaInfo(companyId);
  const sourceSchema = 'public';
  const targetSchema = schemaInfo.schemaName;

  console.log('\n📦 Migrating Data: Public → Isolated Schema\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   Company ID:      ${companyId}`);
  console.log(`   Source Schema:   ${sourceSchema}`);
  console.log(`   Target Schema:   ${targetSchema}`);
  console.log(`   Dry Run:         ${dryRun ? 'Yes (no changes will be made)' : 'No'}`);
  console.log('');

  // Check if target schema exists
  const { data: schemaExists } = await supabase.rpc('exec_sql', {
    sql: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${targetSchema}';`,
  });

  if (!schemaExists || schemaExists.length === 0) {
    console.error(`❌ Target schema ${targetSchema} does not exist`);
    console.error(`   Run: npx tsx scripts/create-company-schema.ts ${companyId}`);
    process.exit(1);
  }

  let totalRows = 0;

  for (const table of MIGRATION_TABLES) {
    console.log(`📋 Migrating ${table}...`);

    // Get company-specific data from public schema
    const { data: rows, error: selectError } = await supabase
      .from(table)
      .select('*')
      .eq('company_id', companyId);

    if (selectError) {
      console.error(`   ⚠️  Error reading ${table}:`, selectError.message);
      continue;
    }

    if (!rows || rows.length === 0) {
      console.log(`   → No data to migrate`);
      continue;
    }

    console.log(`   → Found ${rows.length} rows`);
    totalRows += rows.length;

    if (!dryRun) {
      // Insert into target schema
      const { error: insertError } = await supabase.schema(targetSchema).from(table).insert(rows);

      if (insertError) {
        console.error(`   ❌ Error inserting into ${targetSchema}.${table}:`, insertError.message);
        continue;
      }

      console.log(`   ✅ Migrated ${rows.length} rows`);
    } else {
      console.log(`   → Would migrate ${rows.length} rows (dry run)`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✨ Migration complete: ${totalRows} total rows`);

  if (!dryRun) {
    console.log('');
    console.log('⚠️  IMPORTANT: Source data in public schema still exists');
    console.log('   Consider backing up and then deleting after verification');
    console.log(`   Verify: npx tsx scripts/migrate-schema-data.ts --verify ${companyId}`);
  }
  console.log('');
}

/**
 * Migrate data from company schema back to public
 */
async function migrateToShared(companyId: string, dryRun: boolean = false) {
  const schemaInfo = getSchemaInfo(companyId);
  const sourceSchema = schemaInfo.schemaName;
  const targetSchema = 'public';

  console.log('\n📦 Migrating Data: Isolated Schema → Public\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   Company ID:      ${companyId}`);
  console.log(`   Source Schema:   ${sourceSchema}`);
  console.log(`   Target Schema:   ${targetSchema}`);
  console.log(`   Dry Run:         ${dryRun ? 'Yes (no changes will be made)' : 'No'}`);
  console.log('');

  let totalRows = 0;

  for (const table of MIGRATION_TABLES) {
    console.log(`📋 Migrating ${table}...`);

    // Get all data from company schema
    const { data: rows, error: selectError } = await supabase
      .schema(sourceSchema)
      .from(table)
      .select('*');

    if (selectError) {
      console.error(`   ⚠️  Error reading ${table}:`, selectError.message);
      continue;
    }

    if (!rows || rows.length === 0) {
      console.log(`   → No data to migrate`);
      continue;
    }

    console.log(`   → Found ${rows.length} rows`);
    totalRows += rows.length;

    if (!dryRun) {
      // Insert into public schema
      const { error: insertError } = await supabase.from(table).insert(rows);

      if (insertError) {
        console.error(`   ❌ Error inserting into ${targetSchema}.${table}:`, insertError.message);
        continue;
      }

      console.log(`   ✅ Migrated ${rows.length} rows`);
    } else {
      console.log(`   → Would migrate ${rows.length} rows (dry run)`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✨ Migration complete: ${totalRows} total rows`);

  if (!dryRun) {
    console.log('');
    console.log('⚠️  IMPORTANT: Source data in company schema still exists');
    console.log('   You may want to drop the schema after verification');
    console.log(`   Drop: npx tsx scripts/create-company-schema.ts --drop ${companyId} --confirm`);
  }
  console.log('');
}

/**
 * Verify data consistency between schemas
 */
async function verifyMigration(companyId: string) {
  const schemaInfo = getSchemaInfo(companyId);

  console.log('\n🔍 Verifying Migration\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   Company ID:      ${companyId}`);
  console.log(`   Company Schema:  ${schemaInfo.schemaName}`);
  console.log('');

  let hasErrors = false;

  for (const table of MIGRATION_TABLES) {
    // Count in public schema
    const { count: publicCount, error: publicError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Count in company schema
    const { count: companyCount, error: companyError } = await supabase
      .schema(schemaInfo.schemaName)
      .from(table)
      .select('*', { count: 'exact', head: true });

    const publicCountStr = publicError ? 'ERROR' : (publicCount || 0).toString();
    const companyCountStr = companyError ? 'ERROR' : (companyCount || 0).toString();

    const match = publicCount === companyCount;
    const icon = match ? '✅' : '⚠️';

    console.log(`${icon} ${table.padEnd(30)} public: ${publicCountStr.padStart(5)}  company: ${companyCountStr.padStart(5)}`);

    if (!match) {
      hasErrors = true;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');

  if (hasErrors) {
    console.log('⚠️  Data mismatch detected');
    console.log('   Review errors above and re-run migration if needed');
  } else {
    console.log('✅ All data verified successfully');
  }

  console.log('');
}

/**
 * Clean up source data after migration
 */
async function cleanupAfterMigration(companyId: string, fromIsolated: boolean, confirm: boolean = false) {
  if (!confirm) {
    console.error('❌ Cleanup requires confirmation');
    console.error('   Use: --cleanup --confirm');
    process.exit(1);
  }

  const schemaInfo = getSchemaInfo(companyId);

  console.log('\n🗑️  Cleaning Up After Migration\n');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('⚠️  WARNING: This will delete source data!');
  console.log('');

  if (fromIsolated) {
    // Delete from company schema (drop schema)
    console.log(`   Dropping schema: ${schemaInfo.schemaName}`);

    const { error } = await supabase.rpc('exec_sql', {
      sql: `DROP SCHEMA IF EXISTS ${schemaInfo.schemaName} CASCADE;`,
    });

    if (error) {
      console.error('❌ Failed to drop schema:', error.message);
      process.exit(1);
    }
  } else {
    // Delete company data from public schema
    console.log(`   Deleting company data from public schema`);

    for (const table of MIGRATION_TABLES.reverse()) { // Reverse order for FK constraints
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('company_id', companyId);

      if (error) {
        console.error(`   ⚠️  Error deleting from ${table}:`, error.message);
      } else {
        console.log(`   ✅ Cleaned ${table}`);
      }
    }
  }

  console.log('');
  console.log('✅ Cleanup complete');
  console.log('');
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('\n📘 Migrate Schema Data Tool\n');
    console.log('Usage:');
    console.log('  # Migrate from public to isolated schema');
    console.log('  npx tsx scripts/migrate-schema-data.ts --to-isolated <company_id> [--dry-run]');
    console.log('');
    console.log('  # Migrate from isolated back to public schema');
    console.log('  npx tsx scripts/migrate-schema-data.ts --to-shared <company_id> [--dry-run]');
    console.log('');
    console.log('  # Verify data consistency');
    console.log('  npx tsx scripts/migrate-schema-data.ts --verify <company_id>');
    console.log('');
    console.log('  # Clean up after migration (requires confirmation)');
    console.log('  npx tsx scripts/migrate-schema-data.ts --cleanup <company_id> [--from-isolated] --confirm');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/migrate-schema-data.ts --to-isolated abc123-xyz789');
    console.log('  npx tsx scripts/migrate-schema-data.ts --to-isolated abc123-xyz789 --dry-run');
    console.log('  npx tsx scripts/migrate-schema-data.ts --verify abc123-xyz789');
    console.log('  npx tsx scripts/migrate-schema-data.ts --cleanup abc123-xyz789 --confirm');
    console.log('');
    process.exit(0);
  }

  const companyId = args.find((arg) => !arg.startsWith('--'));
  if (!companyId) {
    console.error('❌ Company ID required');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');

  if (args.includes('--to-isolated')) {
    await migrateToIsolated(companyId, dryRun);
  } else if (args.includes('--to-shared')) {
    await migrateToShared(companyId, dryRun);
  } else if (args.includes('--verify')) {
    await verifyMigration(companyId);
  } else if (args.includes('--cleanup')) {
    await cleanupAfterMigration(
      companyId,
      args.includes('--from-isolated'),
      args.includes('--confirm')
    );
  } else {
    console.error('❌ Invalid command');
    console.error('   Use --help to see available commands');
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
