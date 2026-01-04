/**
 * provision-testdrive command
 *
 * Creates a new test drive tenant (1-7 days) in the demo environment.
 *
 * Usage:
 *   npx tsx scripts/renubu-admin provision-testdrive \
 *     --template healthcare \
 *     --se-email john@renubu.com \
 *     --prospect-company "Acme Health" \
 *     --prospect-email "buyer@acme.com" \
 *     --duration 5
 */

import { getAdminClient, requireNonProduction, getEnvironmentInfo } from '../lib/supabase-admin';
import { TenantProvisioner } from '../lib/provisioner';

interface Args {
  template?: string;
  seEmail?: string;
  prospectCompany?: string;
  prospectEmail?: string;
  duration?: number;
  notes?: string;
}

function parseArgs(args: string[]): Args {
  const result: Args = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--template':
      case '-t':
        result.template = value;
        i++;
        break;
      case '--se-email':
      case '-e':
        result.seEmail = value;
        i++;
        break;
      case '--prospect-company':
      case '-c':
        result.prospectCompany = value;
        i++;
        break;
      case '--prospect-email':
        result.prospectEmail = value;
        i++;
        break;
      case '--duration':
      case '-d':
        result.duration = parseInt(value, 10);
        i++;
        break;
      case '--notes':
      case '-n':
        result.notes = value;
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
provision-testdrive - Create a new test drive tenant

USAGE:
  npx tsx scripts/renubu-admin provision-testdrive [options]

OPTIONS:
  --template, -t        Template ID (required): obsidian_black, healthcare, fintech, saas
  --se-email, -e        SE email address (required)
  --prospect-company, -c  Prospect company name (optional)
  --prospect-email      Prospect contact email (optional)
  --duration, -d        Duration in days, 1-7 (default: 7)
  --notes, -n           Notes about this test drive (optional)
  --help, -h            Show this help

EXAMPLES:
  npx tsx scripts/renubu-admin provision-testdrive \\
    --template healthcare \\
    --se-email john@renubu.com \\
    --prospect-company "Acme Health" \\
    --duration 5
`);
}

export async function provisionTestDrive(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  // Validate required args
  if (!parsed.template) {
    console.error('Error: --template is required');
    console.error('Available templates: obsidian_black, healthcare, fintech, saas');
    process.exit(1);
  }

  if (!parsed.seEmail) {
    console.error('Error: --se-email is required');
    process.exit(1);
  }

  // Validate duration (1-7 days for test drives)
  const duration = parsed.duration ?? 7;
  if (duration < 1 || duration > 7) {
    console.error('Error: --duration must be between 1 and 7 days for test drives');
    process.exit(1);
  }

  // Safety check: don't run on production
  requireNonProduction();

  const { supabaseUrl } = getEnvironmentInfo();
  console.log(`\nConnecting to: ${supabaseUrl}`);
  console.log('---');

  const supabase = getAdminClient();
  const provisioner = new TenantProvisioner(supabase);

  // List available templates if requested template not found
  const templates = await provisioner.listTemplates();
  const templateIds = templates.map((t) => t.id);

  if (!templateIds.includes(parsed.template)) {
    console.error(`Error: Template '${parsed.template}' not found`);
    console.error(`Available templates: ${templateIds.join(', ')}`);
    process.exit(1);
  }

  console.log('Provisioning test drive...');
  console.log(`  Template: ${parsed.template}`);
  console.log(`  SE Email: ${parsed.seEmail}`);
  console.log(`  Prospect: ${parsed.prospectCompany || '(not specified)'}`);
  console.log(`  Duration: ${duration} days`);
  console.log('---');

  try {
    const result = await provisioner.provision({
      template: parsed.template,
      seEmail: parsed.seEmail,
      prospectCompany: parsed.prospectCompany,
      prospectEmail: parsed.prospectEmail,
      durationDays: duration,
      environment: 'demo',
      tenantType: 'test_drive',
      notes: parsed.notes,
    });

    console.log('\n========================================');
    console.log('TEST DRIVE PROVISIONED SUCCESSFULLY');
    console.log('========================================');
    console.log(`Company ID:     ${result.companyId}`);
    console.log(`Pilot ID:       ${result.pilotTenantId}`);
    console.log(`Customer ID:    ${result.customerId}`);
    console.log(`Template:       ${result.template.display_name}`);
    console.log(`Expires:        ${result.expiresAt.toISOString()}`);
    console.log(`Access URL:     ${result.accessUrl}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Provisioning failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
