/**
 * list-tenants command
 *
 * Lists all pilot/test-drive tenants with optional status filter.
 *
 * Usage:
 *   npx tsx scripts/renubu-admin list-tenants
 *   npx tsx scripts/renubu-admin list-tenants --status active
 *   npx tsx scripts/renubu-admin list-tenants --status expired
 */

import { getAdminClient, getEnvironmentInfo } from '../lib/supabase-admin';

interface Args {
  status?: string;
  se?: string;
  format?: 'table' | 'json';
}

function parseArgs(args: string[]): Args {
  const result: Args = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--status':
      case '-s':
        result.status = value;
        i++;
        break;
      case '--se':
        result.se = value;
        i++;
        break;
      case '--format':
      case '-f':
        if (value === 'table' || value === 'json') {
          result.format = value;
        }
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
list-tenants - List all pilot/test-drive tenants

USAGE:
  npx tsx scripts/renubu-admin list-tenants [options]

OPTIONS:
  --status, -s    Filter by status: provisioning, active, expired, archived
  --se            Filter by SE email
  --format, -f    Output format: table (default) or json
  --help, -h      Show this help

EXAMPLES:
  # List all tenants
  npx tsx scripts/renubu-admin list-tenants

  # List only active tenants
  npx tsx scripts/renubu-admin list-tenants --status active

  # List tenants for a specific SE
  npx tsx scripts/renubu-admin list-tenants --se john@renubu.com

  # Output as JSON
  npx tsx scripts/renubu-admin list-tenants --format json
`);
}

function formatDaysRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d ago`;
  } else if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return '1 day';
  } else {
    return `${diffDays} days`;
  }
}

export async function listTenants(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  const { supabaseUrl } = getEnvironmentInfo();
  console.log(`\nConnecting to: ${supabaseUrl}`);
  console.log('---');

  const supabase = getAdminClient();

  // Build query
  let query = supabase
    .from('pilot_tenants')
    .select(
      `
      id,
      company_id,
      tenant_type,
      status,
      template_id,
      environment,
      created_at,
      expires_at,
      se_email,
      prospect_company
    `
    )
    .order('created_at', { ascending: false });

  if (parsed.status) {
    query = query.eq('status', parsed.status);
  }

  if (parsed.se) {
    query = query.eq('se_email', parsed.se);
  }

  const { data: tenants, error } = await query;

  if (error) {
    console.error('Failed to list tenants:', error.message);
    process.exit(1);
  }

  if (!tenants || tenants.length === 0) {
    console.log('\nNo tenants found matching criteria.\n');
    return;
  }

  if (parsed.format === 'json') {
    console.log(JSON.stringify(tenants, null, 2));
    return;
  }

  // Print table
  console.log('\n');
  console.log(
    'ID'.padEnd(10) +
      'TYPE'.padEnd(12) +
      'STATUS'.padEnd(10) +
      'TEMPLATE'.padEnd(16) +
      'ENV'.padEnd(10) +
      'EXPIRES'.padEnd(14) +
      'SE'.padEnd(25) +
      'PROSPECT'
  );
  console.log('-'.repeat(120));

  for (const tenant of tenants) {
    const id = tenant.id.slice(0, 8);
    const type = tenant.tenant_type === 'test_drive' ? 'test_drive' : 'pilot';
    const status = tenant.status;
    const template = tenant.template_id;
    const env = tenant.environment;
    const expires = formatDaysRemaining(tenant.expires_at);
    const se = tenant.se_email?.split('@')[0] || '';
    const prospect = tenant.prospect_company || '-';

    console.log(
      id.padEnd(10) +
        type.padEnd(12) +
        status.padEnd(10) +
        template.padEnd(16) +
        env.padEnd(10) +
        expires.padEnd(14) +
        se.padEnd(25) +
        prospect.slice(0, 30)
    );
  }

  console.log('-'.repeat(120));
  console.log(`Total: ${tenants.length} tenant(s)\n`);

  // Show summary
  const active = tenants.filter((t) => t.status === 'active').length;
  const expired = tenants.filter((t) => t.status === 'expired').length;
  const testDrives = tenants.filter((t) => t.tenant_type === 'test_drive').length;
  const pilots = tenants.filter((t) => t.tenant_type === 'pilot').length;

  console.log(`Summary: ${active} active, ${expired} expired | ${testDrives} test drives, ${pilots} pilots\n`);
}
