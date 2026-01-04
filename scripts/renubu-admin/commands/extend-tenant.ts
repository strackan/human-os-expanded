/**
 * extend-tenant command
 *
 * Extends a tenant's expiration date.
 *
 * Usage:
 *   npx tsx scripts/renubu-admin extend-tenant --tenant-id <uuid> --additional-days 7
 */

import { getAdminClient, requireNonProduction, getEnvironmentInfo } from '../lib/supabase-admin';

interface Args {
  tenantId?: string;
  additionalDays?: number;
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
      case '--additional-days':
      case '-d':
        result.additionalDays = parseInt(value, 10);
        i++;
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
extend-tenant - Extend a tenant's expiration date

USAGE:
  npx tsx scripts/renubu-admin extend-tenant [options]

OPTIONS:
  --tenant-id, -i       Pilot tenant ID (required, can use first 8 chars)
  --additional-days, -d Days to add (required, max 30)
  --help, -h            Show this help

EXAMPLES:
  # Extend by 7 days
  npx tsx scripts/renubu-admin extend-tenant --tenant-id abc12345 --additional-days 7

  # Extend by 2 weeks
  npx tsx scripts/renubu-admin extend-tenant -i abc12345 -d 14
`);
}

export async function extendTenant(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  // Validate required args
  if (!parsed.tenantId) {
    console.error('Error: --tenant-id is required');
    process.exit(1);
  }

  if (!parsed.additionalDays) {
    console.error('Error: --additional-days is required');
    process.exit(1);
  }

  if (parsed.additionalDays < 1 || parsed.additionalDays > 30) {
    console.error('Error: --additional-days must be between 1 and 30');
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
    // Partial ID - use ilike
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

  // Calculate new expiration
  const currentExpires = new Date(tenant.expires_at);
  const newExpires = new Date(currentExpires);
  newExpires.setDate(newExpires.getDate() + parsed.additionalDays);

  console.log(`Extending tenant: ${tenant.id}`);
  console.log(`  Prospect:       ${tenant.prospect_company || '-'}`);
  console.log(`  Current expiry: ${currentExpires.toISOString()}`);
  console.log(`  New expiry:     ${newExpires.toISOString()}`);
  console.log(`  Adding:         ${parsed.additionalDays} days`);
  console.log('---');

  // Update the tenant
  const { error: updateError } = await supabase
    .from('pilot_tenants')
    .update({
      expires_at: newExpires.toISOString(),
      status: 'active', // Reactivate if it was expired
      metadata: {
        ...tenant.metadata,
        extensions: [
          ...(tenant.metadata?.extensions || []),
          {
            extended_at: new Date().toISOString(),
            days_added: parsed.additionalDays,
            previous_expiry: currentExpires.toISOString(),
          },
        ],
      },
    })
    .eq('id', tenant.id);

  if (updateError) {
    console.error('Failed to extend tenant:', updateError.message);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('TENANT EXTENDED SUCCESSFULLY');
  console.log('========================================');
  console.log(`Tenant ID:   ${tenant.id}`);
  console.log(`New Expiry:  ${newExpires.toISOString()}`);
  console.log('========================================\n');
}
