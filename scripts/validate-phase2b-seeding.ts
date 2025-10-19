/**
 * Validation Script for Phase 2B Database Seeding
 * Verifies all migrations and seed data were applied correctly
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TECHFLOW_ID = '550e8400-e29b-41d4-a716-446655440002';
const OBSIDIAN_BLACK_ID = '550e8400-e29b-41d4-a716-446655440001';

interface ValidationResult {
  name: string;
  passed: boolean;
  details?: string;
  data?: any;
}

const results: ValidationResult[] = [];

function logResult(result: ValidationResult) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
  if (result.data && Object.keys(result.data).length > 0) {
    console.log(`   Data:`, JSON.stringify(result.data, null, 2));
  }
  console.log();
  results.push(result);
}

async function validateTechFlowCustomer() {
  console.log('📋 Check 1: TechFlow Customer');
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, domain, industry, health_score, current_arr, renewal_date, is_demo')
    .eq('id', TECHFLOW_ID)
    .single();

  if (error || !data) {
    logResult({ name: 'TechFlow Customer', passed: false, details: error?.message || 'No data found' });
    return;
  }

  const passed =
    data.name === 'TechFlow Industries' &&
    data.domain === 'techflow.io' &&
    data.health_score === 82 &&
    data.current_arr === 78000;

  logResult({
    name: 'TechFlow Customer',
    passed,
    details: `${data.name} - $${data.current_arr} ARR, Health: ${data.health_score}`,
    data
  });
}

async function validateTechFlowUsageMetrics() {
  console.log('📋 Check 2: TechFlow Usage Metrics');
  const { data, error } = await supabase
    .from('customer_properties')
    .select('active_users, license_capacity, utilization_percent, yoy_growth, last_month_growth, adoption_rate')
    .eq('customer_id', TECHFLOW_ID)
    .single();

  if (error || !data) {
    logResult({ name: 'TechFlow Usage Metrics', passed: false, details: error?.message || 'No data found' });
    return;
  }

  const passed =
    data.active_users === 140 &&
    data.license_capacity === 100 &&
    data.utilization_percent === 140 &&
    data.yoy_growth === 47;

  logResult({
    name: 'TechFlow Usage Metrics',
    passed,
    details: `${data.utilization_percent}% utilization (${data.active_users}/${data.license_capacity}), ${data.yoy_growth}% YoY growth`,
    data
  });
}

async function validateTechFlowMarketData() {
  console.log('📋 Check 3: TechFlow Market Data');
  const { data, error } = await supabase
    .from('customer_properties')
    .select('market_price_average, market_percentile, price_gap, similar_customer_range, opportunity_value')
    .eq('customer_id', TECHFLOW_ID)
    .single();

  if (error || !data) {
    logResult({ name: 'TechFlow Market Data', passed: false, details: error?.message || 'No data found' });
    return;
  }

  const passed =
    data.market_price_average === 10.20 &&
    data.market_percentile === 18 &&
    data.price_gap === 3.70;

  logResult({
    name: 'TechFlow Market Data',
    passed,
    details: `${data.market_percentile}th percentile, $${data.price_gap} below market avg`,
    data
  });
}

async function validateTechFlowContract() {
  console.log('📋 Check 4: TechFlow Contract');
  const { data, error } = await supabase
    .from('contracts')
    .select('contract_number, start_date, end_date, arr, seats, status, auto_renewal, is_demo')
    .eq('customer_id', TECHFLOW_ID)
    .single();

  if (error || !data) {
    logResult({ name: 'TechFlow Contract', passed: false, details: error?.message || 'No data found' });
    return;
  }

  const passed =
    data.contract_number === 'TECHFLOW-CONTRACT-2023' &&
    data.arr === 78000 &&
    data.seats === 100 &&
    data.status === 'active';

  logResult({
    name: 'TechFlow Contract',
    passed,
    details: `${data.contract_number} - $${data.arr} ARR, ${data.seats} seats`,
    data
  });
}

async function validateTechFlowContact() {
  console.log('📋 Check 5: TechFlow Contact (Sarah Chen)');
  const { data, error } = await supabase
    .from('contacts')
    .select('first_name, last_name, email, title, is_primary, relationship_strength, key_concerns, leverage_points')
    .eq('customer_id', TECHFLOW_ID)
    .single();

  if (error || !data) {
    logResult({ name: 'TechFlow Contact', passed: false, details: error?.message || 'No data found' });
    return;
  }

  const passed =
    data.first_name === 'Sarah' &&
    data.last_name === 'Chen' &&
    data.is_primary === true &&
    data.relationship_strength === 'strong' &&
    Array.isArray(data.key_concerns) &&
    Array.isArray(data.leverage_points);

  logResult({
    name: 'TechFlow Contact',
    passed,
    details: `${data.first_name} ${data.last_name} - ${data.title}, Relationship: ${data.relationship_strength}`,
    data: {
      name: `${data.first_name} ${data.last_name}`,
      email: data.email,
      title: data.title,
      relationship_strength: data.relationship_strength,
      concerns_count: data.key_concerns?.length || 0,
      leverage_count: data.leverage_points?.length || 0
    }
  });
}

async function validateObsidianBlackContacts() {
  console.log('📋 Check 6: Obsidian Black Contacts (Marcus & Elena)');
  const { data, error } = await supabase
    .from('contacts')
    .select('first_name, last_name, title, relationship_strength, key_concerns, leverage_points, recent_interactions, is_primary')
    .eq('customer_id', OBSIDIAN_BLACK_ID)
    .order('is_primary', { ascending: false });

  if (error || !data) {
    logResult({ name: 'Obsidian Black Contacts', passed: false, details: error?.message || 'No data found' });
    return;
  }

  const marcus = data.find(c => c.first_name === 'Marcus' && c.last_name === 'Castellan');
  const elena = data.find(c => c.first_name === 'Elena' && c.last_name === 'Voss');

  const passed =
    data.length >= 2 &&
    marcus?.relationship_strength === 'weak' &&
    elena?.relationship_strength === 'moderate' &&
    Array.isArray(marcus?.key_concerns) &&
    Array.isArray(elena?.leverage_points);

  logResult({
    name: 'Obsidian Black Contacts',
    passed,
    details: `Found ${data.length} contacts: ${data.map(c => `${c.first_name} ${c.last_name} (${c.relationship_strength})`).join(', ')}`,
    data: data.map(c => ({
      name: `${c.first_name} ${c.last_name}`,
      title: c.title,
      relationship_strength: c.relationship_strength,
      concerns_count: c.key_concerns?.length || 0,
      leverage_count: c.leverage_points?.length || 0,
      has_interactions: !!c.recent_interactions
    }))
  });
}

async function validateSummary() {
  console.log('📋 Check 7: Summary Counts');

  // Count customers
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id')
    .in('id', [OBSIDIAN_BLACK_ID, TECHFLOW_ID]);

  // Count contacts
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('id')
    .in('customer_id', [OBSIDIAN_BLACK_ID, TECHFLOW_ID]);

  // Count TechFlow contracts
  const { data: contracts, error: contractError } = await supabase
    .from('contracts')
    .select('id')
    .eq('customer_id', TECHFLOW_ID);

  // Check TechFlow utilization
  const { data: props, error: propsError } = await supabase
    .from('customer_properties')
    .select('utilization_percent')
    .eq('customer_id', TECHFLOW_ID)
    .single();

  const passed =
    customers?.length === 2 &&
    (contacts?.length || 0) >= 3 &&
    contracts?.length === 1 &&
    props?.utilization_percent === 140;

  logResult({
    name: 'Summary Counts',
    passed,
    details: `${customers?.length || 0} customers, ${contacts?.length || 0} contacts, ${contracts?.length || 0} TechFlow contracts`,
    data: {
      total_customers: customers?.length || 0,
      total_contacts: contacts?.length || 0,
      techflow_contracts: contracts?.length || 0,
      techflow_utilization: props?.utilization_percent || 0
    }
  });
}

async function main() {
  console.log('\n=======================================================');
  console.log('🧪 Phase 2B Database Seeding Validation');
  console.log('=======================================================\n');

  await validateTechFlowCustomer();
  await validateTechFlowUsageMetrics();
  await validateTechFlowMarketData();
  await validateTechFlowContract();
  await validateTechFlowContact();
  await validateObsidianBlackContacts();
  await validateSummary();

  console.log('=======================================================');
  console.log('📊 Final Results');
  console.log('=======================================================\n');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  console.log(`${allPassed ? '✅' : '❌'} ${passedCount}/${totalCount} checks passed\n`);

  if (allPassed) {
    console.log('🎉 All validation checks passed! Phase 2B seeding is complete.\n');
    console.log('Ready to test data-driven workflows:');
    console.log('  • Strategic Planning: Obsidian Black (Marcus & Elena)');
    console.log('  • Expansion Opportunity: TechFlow Industries (Sarah Chen)');
    console.log('  • Executive Engagement: Obsidian Black (Marcus & Elena)\n');
  } else {
    console.log('⚠️  Some checks failed. Review the results above.\n');
    process.exit(1);
  }
}

main().catch(console.error);
