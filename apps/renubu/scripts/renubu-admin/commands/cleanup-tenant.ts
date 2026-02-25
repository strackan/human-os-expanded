/**
 * cleanup-tenant command
 *
 * Manually cleans up a tenant and all its demo data.
 *
 * Usage:
 *   npx tsx scripts/renubu-admin cleanup-tenant --tenant-id <uuid>
 *   npx tsx scripts/renubu-admin cleanup-tenant --tenant-id <uuid> --force
 */

import { getAdminClient, requireNonProduction, getEnvironmentInfo } from '../lib/supabase-admin';
import * as readline from 'readline';

interface Args {
  tenantId?: string;
  force?: boolean;
}

function parseArgs(args: string[]): Args {
  const result: Args = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--tenant-id':
      case '-i':
        result.tenantId = value;
        i++;
        break;
      case '--force':
      case '-f':
        result.force = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
cleanup-tenant - Clean up a tenant and all its demo data

USAGE:
  npx tsx scripts/renubu-admin cleanup-tenant [options]

OPTIONS:
  --tenant-id, -i  Pilot tenant ID (required, can use first 8 chars)
  --force, -f      Skip confirmation prompt
  --help, -h       Show this help

EXAMPLES:
  # Clean up with confirmation
  npx tsx scripts/renubu-admin cleanup-tenant --tenant-id abc12345

  # Force cleanup without confirmation
  npx tsx scripts/renubu-admin cleanup-tenant --tenant-id abc12345 --force
`);
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function cleanupTenant(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  // Validate required args
  if (!parsed.tenantId) {
    console.error('Error: --tenant-id is required');
    process.exit(1);
  }

  // Safety check
  requireNonProduction();

  const { supabaseUrl } = getEnvironmentInfo();
  console.log(`\nConnecting to: ${supabaseUrl}`);
  console.log('---');

  const supabase = getAdminClient();

  // Find the tenant (support partial ID match)
  let query = supabase.from('pilot_tenants').select('*');

  if (parsed.tenantId.length < 36) {
    query = query.ilike('id', `${parsed.tenantId}%`);
  } else {
    query = query.eq('id', parsed.tenantId);
  }

  const { data: tenants, error: findError } = await query;

  if (findError) {
    console.error('Failed to find tenant:', findError.message);
    process.exit(1);
  }

  if (!tenants || tenants.length === 0) {
    console.error(`No tenant found matching ID: ${parsed.tenantId}`);
    process.exit(1);
  }

  if (tenants.length > 1) {
    console.error(`Multiple tenants found matching ID prefix. Please be more specific:`);
    tenants.forEach((t) => console.error(`  - ${t.id} (${t.prospect_company || t.template_id})`));
    process.exit(1);
  }

  const tenant = tenants[0];

  console.log(`Found tenant: ${tenant.id}`);
  console.log(`  Type:       ${tenant.tenant_type}`);
  console.log(`  Prospect:   ${tenant.prospect_company || '-'}`);
  console.log(`  Template:   ${tenant.template_id}`);
  console.log(`  Status:     ${tenant.status}`);
  console.log(`  Company ID: ${tenant.company_id}`);
  console.log('---');

  // Confirm unless --force
  if (!parsed.force) {
    const confirmed = await confirm(
      'This will DELETE all demo data for this tenant. Continue?'
    );
    if (!confirmed) {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  console.log('\nCleaning up tenant data...');

  // Use the database function for cleanup
  const { data: result, error: cleanupError } = await supabase.rpc(
    'cleanup_pilot_tenant',
    { pilot_uuid: tenant.id }
  );

  if (cleanupError) {
    console.error('Cleanup failed:', cleanupError.message);

    // Try manual cleanup as fallback
    console.log('Attempting manual cleanup...');
    await manualCleanup(supabase, tenant.company_id);
  } else if (result && result.length > 0) {
    const r = result[0];
    if (r.success) {
      console.log('\n========================================');
      console.log('TENANT CLEANED UP SUCCESSFULLY');
      console.log('========================================');
      console.log(`Message:           ${r.message}`);
      console.log(`Customers deleted: ${r.customers_deleted}`);
      console.log(`Contacts deleted:  ${r.contacts_deleted}`);
      console.log(`Contracts deleted: ${r.contracts_deleted}`);
      console.log(`Renewals deleted:  ${r.renewals_deleted}`);
      console.log(`Workflows deleted: ${r.workflows_deleted}`);
      console.log('========================================\n');
    } else {
      console.error('Cleanup failed:', r.message);
      process.exit(1);
    }
  }
}

async function manualCleanup(supabase: ReturnType<typeof getAdminClient>, companyId: string): Promise<void> {
  // Get customer IDs for this company
  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_demo', true);

  const customerIds = customers?.map((c) => c.id) || [];

  if (customerIds.length === 0) {
    console.log('No demo customers found for cleanup.');
    return;
  }

  console.log(`Found ${customerIds.length} demo customer(s) to clean up.`);

  // Delete in order respecting foreign keys
  let deleted = 0;

  // Workflow executions
  const { count: wfCount } = await supabase
    .from('workflow_executions')
    .delete({ count: 'exact' })
    .in('customer_id', customerIds);
  deleted += wfCount || 0;

  // Demo tables
  await supabase.from('demo_strategic_plans').delete().in('customer_id', customerIds);
  await supabase.from('demo_support_tickets').delete().in('customer_id', customerIds);
  await supabase.from('demo_operations').delete().in('customer_id', customerIds);

  // Core tables
  const { count: renewalsCount } = await supabase
    .from('renewals')
    .delete({ count: 'exact' })
    .in('customer_id', customerIds);
  deleted += renewalsCount || 0;

  const { count: contractsCount } = await supabase
    .from('contracts')
    .delete({ count: 'exact' })
    .in('customer_id', customerIds);
  deleted += contractsCount || 0;

  const { count: contactsCount } = await supabase
    .from('contacts')
    .delete({ count: 'exact' })
    .in('customer_id', customerIds);
  deleted += contactsCount || 0;

  const { count: customersCount } = await supabase
    .from('customers')
    .delete({ count: 'exact' })
    .eq('company_id', companyId)
    .eq('is_demo', true);
  deleted += customersCount || 0;

  console.log(`\nManual cleanup complete. ${deleted} records deleted.`);
}
