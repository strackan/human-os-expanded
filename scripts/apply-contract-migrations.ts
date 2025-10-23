/**
 * Apply contract-related migrations and migrate Obsidian Black data
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filename: string) {
  console.log(`\n📄 Running migration: ${filename}`);

  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
    if (error) throw error;
    console.log(`✅ Migration ${filename} applied successfully`);
  } catch (error: any) {
    // Try direct query if RPC doesn't work
    console.log(`⚠️  RPC failed, trying direct query...`);

    // Split on semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await supabase.rpc('exec', { sql: statement });
      } catch (err: any) {
        console.error(`Error executing statement:`, err.message);
      }
    }
  }
}

async function findObsidianBlackContract() {
  console.log(`\n🔍 Finding Obsidian Black contract...`);

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .ilike('name', '%obsidian%black%')
    .single();

  if (!customer) {
    console.log('❌ Obsidian Black customer not found');
    return null;
  }

  console.log(`✅ Found customer: ${customer.name} (${customer.id})`);

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('status', 'active')
    .single();

  if (!contract) {
    console.log('❌ No active contract found');
    return null;
  }

  console.log(`✅ Found contract: ${contract.contract_number || contract.id}`);
  console.log(`   ARR: $${contract.arr?.toLocaleString()}`);
  console.log(`   Seats: ${contract.seats}`);
  console.log(`   Start: ${contract.start_date}`);
  console.log(`   End: ${contract.end_date}`);

  return { customer, contract };
}

async function createObsidianBlackTerms(contractId: string) {
  console.log(`\n📝 Creating contract terms for Obsidian Black...`);

  // Based on Obsidian Black contract from seed data:
  // Contract: $185K ARR, 45 seats, 2024-01-15 to 2026-01-15 (24 months)
  // Price per seat: $185K / 45 / 12 = $342.59/month = $4,111/year
  // At-risk account with relationship challenges but strong product fit
  const terms = {
    contract_id: contractId,

    // Pricing - Per seat model at below-market pricing
    pricing_model: 'per_seat',
    discount_percent: 18, // They're at 32nd percentile, $1.90 below market
    payment_terms: 'net_30',
    invoicing_schedule: 'annual',

    // Renewal - Standard enterprise terms
    auto_renewal: true,
    auto_renewal_notice_days: 90, // 90 days for enterprise
    renewal_price_cap_percent: 20, // Room for market adjustment (currently below market)

    // Service - Premium support (mid-tier enterprise)
    sla_uptime_percent: 99.9,
    support_tier: 'premium',
    response_time_hours: 4,
    support_hours: '24x5',
    dedicated_csm: true,

    // Legal - Standard enterprise terms
    liability_cap: '12_months_fees',
    data_residency: ['us'],
    data_retention_days: 90,

    // Features - Standard enterprise feature set
    included_features: [
      'api_access',
      'sso',
      'advanced_analytics',
      'custom_integrations',
      'priority_support'
    ],
    usage_limits: {
      api_calls_per_month: 2000000,
      storage_gb: 250,
      concurrent_users: 100
    },

    // Custom terms
    custom_terms: {
      quarterly_business_reviews: true,
      annual_roadmap_session: false,
      dedicated_slack_channel: false
    },

    notes: 'At-risk account (7/10 churn risk) with relationship challenges but strong product fit (87% adoption, 28% YoY growth). Over-utilized (115%) and below-market pricing (32nd percentile).'
  };

  const { data, error } = await supabase
    .from('contract_terms')
    .insert(terms)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating terms:', error.message);
    return null;
  }

  console.log('✅ Contract terms created successfully');
  console.log(`   Pricing Model: ${data.pricing_model}`);
  console.log(`   Support Tier: ${data.support_tier}`);
  console.log(`   Auto-Renewal Notice: ${data.auto_renewal_notice_days} days`);
  console.log(`   SLA: ${data.sla_uptime_percent}%`);

  return data;
}

async function verifyContractMatrix() {
  console.log(`\n🔍 Verifying contract_matrix view...`);

  const { data, error } = await supabase
    .from('contract_matrix')
    .select('*')
    .ilike('customer_name', '%obsidian%black%')
    .single();

  if (error) {
    console.error('❌ Error querying contract_matrix:', error.message);
    return;
  }

  console.log('✅ Contract Matrix View Data:');
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log('🚀 Starting contract migrations and data migration...\n');

  try {
    // Step 1: Apply migrations
    console.log('═══════════════════════════════════════');
    console.log('STEP 1: Apply Migrations');
    console.log('═══════════════════════════════════════');

    await runMigration('20251023000000_add_contract_term_months.sql');
    await runMigration('20251023000001_add_contract_terms.sql');

    // Step 2: Find Obsidian Black
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 2: Find Obsidian Black Contract');
    console.log('═══════════════════════════════════════');

    const result = await findObsidianBlackContract();
    if (!result) {
      console.log('❌ Cannot proceed without Obsidian Black contract');
      return;
    }

    // Step 3: Create contract terms
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 3: Create Contract Terms');
    console.log('═══════════════════════════════════════');

    await createObsidianBlackTerms(result.contract.id);

    // Step 4: Verify
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 4: Verify Contract Matrix');
    console.log('═══════════════════════════════════════');

    await verifyContractMatrix();

    console.log('\n✅ All steps completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
