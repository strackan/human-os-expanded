#!/usr/bin/env npx tsx
/**
 * Renubu Admin CLI
 *
 * CLI tool for managing test drives, pilots, and demo environments.
 *
 * Usage:
 *   npx tsx scripts/renubu-admin provision-testdrive --template healthcare --se-email john@renubu.com
 *   npx tsx scripts/renubu-admin provision-pilot --template fintech --se-email jane@renubu.com --duration-weeks 4
 *   npx tsx scripts/renubu-admin list-tenants --status active
 *   npx tsx scripts/renubu-admin extend-tenant --tenant-id <uuid> --additional-days 7
 *   npx tsx scripts/renubu-admin cleanup-tenant --tenant-id <uuid>
 */

import { provisionTestDrive } from './commands/provision-testdrive';
import { provisionPilot } from './commands/provision-pilot';
import { listTenants } from './commands/list-tenants';
import { extendTenant } from './commands/extend-tenant';
import { cleanupTenant } from './commands/cleanup-tenant';

const COMMANDS = {
  'provision-testdrive': provisionTestDrive,
  'provision-pilot': provisionPilot,
  'list-tenants': listTenants,
  'extend-tenant': extendTenant,
  'cleanup-tenant': cleanupTenant,
} as const;

function printHelp() {
  console.log(`
Renubu Admin CLI - Manage test drives and pilots

USAGE:
  npx tsx scripts/renubu-admin <command> [options]

COMMANDS:
  provision-testdrive   Create a new test drive (1-7 days)
  provision-pilot       Create a new pilot (2-8 weeks)
  list-tenants          List all pilot/test-drive tenants
  extend-tenant         Extend a tenant's expiration
  cleanup-tenant        Manually clean up a tenant

EXAMPLES:
  # Create a healthcare test drive for 5 days
  npx tsx scripts/renubu-admin provision-testdrive \\
    --template healthcare \\
    --se-email john@renubu.com \\
    --prospect-company "Acme Health" \\
    --duration 5

  # Create a fintech pilot for 4 weeks on staging
  npx tsx scripts/renubu-admin provision-pilot \\
    --template fintech \\
    --se-email jane@renubu.com \\
    --prospect-company "FinCorp" \\
    --environment staging \\
    --duration-weeks 4

  # List active tenants
  npx tsx scripts/renubu-admin list-tenants --status active

  # Extend a tenant by 7 days
  npx tsx scripts/renubu-admin extend-tenant --tenant-id <uuid> --additional-days 7

  # Clean up an expired tenant
  npx tsx scripts/renubu-admin cleanup-tenant --tenant-id <uuid>

OPTIONS:
  --help, -h    Show this help message
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (!(command in COMMANDS)) {
    console.error(`Unknown command: ${command}`);
    console.error('Run with --help to see available commands');
    process.exit(1);
  }

  try {
    await COMMANDS[command as keyof typeof COMMANDS](args.slice(1));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
