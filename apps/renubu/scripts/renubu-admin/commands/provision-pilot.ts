/**
 * provision-pilot command
 *
 * Creates a new pilot tenant (2-8 weeks) in demo or staging environment.
 *
 * Usage:
 *   npx tsx scripts/renubu-admin provision-pilot \
 *     --template fintech \
 *     --se-email jane@renubu.com \
 *     --prospect-company "FinCorp" \
 *     --environment staging \
 *     --duration-weeks 4
 */

import { getAdminClient, requireNonProduction, getEnvironmentInfo } from '../lib/supabase-admin';
import { TenantProvisioner } from '../lib/provisioner';

interface Args {
  template?: string;
  seEmail?: string;
  prospectCompany?: string;
  prospectEmail?: string;
  durationWeeks?: number;
  environment?: 'demo' | 'staging';
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
      case '--duration-weeks':
      case '-w':
        result.durationWeeks = parseInt(value, 10);
        i++;
        break;
      case '--environment':
      case '--env':
        if (value === 'demo' || value === 'staging') {
          result.environment = value;
        } else {
          console.error(`Invalid environment: ${value}. Must be 'demo' or 'staging'`);
          process.exit(1);
        }
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
provision-pilot - Create a new pilot tenant

USAGE:
  npx tsx scripts/renubu-admin provision-pilot [options]

OPTIONS:
  --template, -t        Template ID (required): obsidian_black, healthcare, fintech, saas
  --se-email, -e        SE email address (required)
  --prospect-company, -c  Prospect company name (optional)
  --prospect-email      Prospect contact email (optional)
  --duration-weeks, -w  Duration in weeks, 2-8 (default: 4)
  --environment, --env  Environment: demo or staging (default: demo)
  --notes, -n           Notes about this pilot (optional)
  --help, -h            Show this help

EXAMPLES:
  # Standard pilot on demo environment
  npx tsx scripts/renubu-admin provision-pilot \\
    --template healthcare \\
    --se-email jane@renubu.com \\
    --prospect-company "MedTech Inc" \\
    --duration-weeks 4

  # Integration pilot on staging (for testing newer features)
  npx tsx scripts/renubu-admin provision-pilot \\
    --template fintech \\
    --se-email john@renubu.com \\
    --prospect-company "FinCorp" \\
    --environment staging \\
    --duration-weeks 6
`);
}

export async function provisionPilot(args: string[]): Promise<void> {
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

  // Validate duration (2-8 weeks for pilots)
  const durationWeeks = parsed.durationWeeks ?? 4;
  if (durationWeeks < 2 || durationWeeks > 8) {
    console.error('Error: --duration-weeks must be between 2 and 8 weeks for pilots');
    process.exit(1);
  }

  const environment = parsed.environment ?? 'demo';

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

  console.log('Provisioning pilot...');
  console.log(`  Template:     ${parsed.template}`);
  console.log(`  SE Email:     ${parsed.seEmail}`);
  console.log(`  Prospect:     ${parsed.prospectCompany || '(not specified)'}`);
  console.log(`  Duration:     ${durationWeeks} weeks`);
  console.log(`  Environment:  ${environment}`);
  console.log('---');

  try {
    const result = await provisioner.provision({
      template: parsed.template,
      seEmail: parsed.seEmail,
      prospectCompany: parsed.prospectCompany,
      prospectEmail: parsed.prospectEmail,
      durationDays: durationWeeks * 7,
      environment,
      tenantType: 'pilot',
      notes: parsed.notes,
    });

    console.log('\n========================================');
    console.log('PILOT PROVISIONED SUCCESSFULLY');
    console.log('========================================');
    console.log(`Company ID:     ${result.companyId}`);
    console.log(`Pilot ID:       ${result.pilotTenantId}`);
    console.log(`Customer ID:    ${result.customerId}`);
    console.log(`Template:       ${result.template.display_name}`);
    console.log(`Environment:    ${environment}`);
    console.log(`Expires:        ${result.expiresAt.toISOString()}`);
    console.log(`Access URL:     ${result.accessUrl}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Provisioning failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
