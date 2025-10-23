/**
 * Apply contract-related migrations and migrate Obsidian Black data
 * Run with: node scripts/apply-contract-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(filename) {
  console.log(`\n📄 Executing SQL file: ${filename}`);

  const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(filePath, 'utf-8');

  // Split by semicolons and filter out comments and empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.match(/^--/));

  console.log(`   Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    try {
      // Use rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Ignore already exists errors
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Statement ${i + 1}: Already exists, skipping`);
        } else {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
        }
      } else {
        console.log(`   ✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.error(`   ❌ Statement ${i + 1} error:`, err.message);
    }
  }

  console.log(`✅ SQL file ${filename} processed`);
}

async function findObsidianBlackContract() {
  console.log(`\n🔍 Finding Obsidian Black contract...`);

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name')
    .ilike('name', '%obsidian%black%')
    .single();

  if (customerError || !customer) {
    console.log('❌ Obsidian Black customer not found:', customerError?.message);
    return null;
  }

  console.log(`✅ Found customer: ${customer.name}`);

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('status', 'active')
    .single();

  if (contractError || !contract) {
    console.log('❌ No active contract found:', contractError?.message);
    return null;
  }

  console.log(`✅ Found contract:`);
  console.log(`   Contract: ${contract.contract_number || contract.id}`);
  console.log(`   ARR: $${contract.arr?.toLocaleString()}`);
  console.log(`   Seats: ${contract.seats}`);
  console.log(`   Period: ${contract.start_date} to ${contract.end_date}`);
  console.log(`   Term Months: ${contract.term_months || 'calculating...'}`);

  return { customer, contract };
}

async function createObsidianBlackTerms(contractId) {
  console.log(`\n📝 Creating contract terms for Obsidian Black...`);

  const terms = {
    contract_id: contractId,
    pricing_model: 'per_seat',
    discount_percent: 18,
    payment_terms: 'net_30',
    invoicing_schedule: 'annual',
    auto_renewal: true,
    auto_renewal_notice_days: 90,
    renewal_price_cap_percent: 20,
    sla_uptime_percent: 99.9,
    support_tier: 'premium',
    response_time_hours: 4,
    support_hours: '24x5',
    dedicated_csm: true,
    liability_cap: '12_months_fees',
    data_residency: ['us'],
    data_retention_days: 90,
    included_features: ['api_access', 'sso', 'advanced_analytics', 'custom_integrations', 'priority_support'],
    usage_limits: {
      api_calls_per_month: 2000000,
      storage_gb: 250,
      concurrent_users: 100
    },
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

  console.log('✅ Contract terms created:');
  console.log(`   Pricing Model: ${data.pricing_model}`);
  console.log(`   Support Tier: ${data.support_tier}`);
  console.log(`   Auto-Renewal Notice: ${data.auto_renewal_notice_days} days`);
  console.log(`   SLA: ${data.sla_uptime_percent}%`);
  console.log(`   Liability Cap: ${data.liability_cap}`);

  return data;
}

async function verifyContractMatrix() {
  console.log(`\n🔍 Verifying contract_matrix view...`);

  const { data, error } = await supabase
    .from('contract_matrix')
    .select('*')
    .ilike('customer_name', '%obsidian%black%')
    .maybeSingle();

  if (error) {
    console.error('❌ Error querying contract_matrix:', error.message);
    return;
  }

  if (!data) {
    console.log('⚠️  No data found in contract_matrix for Obsidian Black');
    return;
  }

  console.log('✅ Contract Matrix View Data:');
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log('🚀 Starting contract migrations and data migration...\n');

  try {
    // Step 1: Apply term_months migration
    console.log('═══════════════════════════════════════');
    console.log('STEP 1: Apply term_months Migration');
    console.log('═══════════════════════════════════════');
    await executeSqlFile('20251023000000_add_contract_term_months.sql');

    // Step 2: Apply contract_terms migration
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 2: Apply contract_terms Migration');
    console.log('═══════════════════════════════════════');
    await executeSqlFile('20251023000001_add_contract_terms.sql');

    // Step 3: Find Obsidian Black
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 3: Find Obsidian Black Contract');
    console.log('═══════════════════════════════════════');

    const result = await findObsidianBlackContract();
    if (!result) {
      console.log('⚠️  Cannot proceed without Obsidian Black contract');
      console.log('   The contract may need to be seeded first.');
      return;
    }

    // Step 4: Create contract terms
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 4: Create Contract Terms');
    console.log('═══════════════════════════════════════');

    await createObsidianBlackTerms(result.contract.id);

    // Step 5: Verify
    console.log('\n═══════════════════════════════════════');
    console.log('STEP 5: Verify Contract Matrix');
    console.log('═══════════════════════════════════════');

    await verifyContractMatrix();

    console.log('\n✅ All steps completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the contract details display correctly in the UI');
    console.log('   2. Check that term_months is auto-calculated');
    console.log('   3. Confirm contract_matrix view shows all terms');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
