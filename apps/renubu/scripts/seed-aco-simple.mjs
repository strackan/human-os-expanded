/**
 * ACO Demo Data Seeding Script (Simple Version)
 * Uses Supabase client API to insert records directly
 *
 * PM-Approved Numbers (Oct 11, 2025):
 * - ARR: $185,000
 * - Health Score: 6.4/10
 * - Operation Blackout: $85,000 loss
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuvdjjclwwulvyeboavk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmRqamNsd3d1bHZ5ZWJvYXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc2MjM3NCwiZXhwIjoyMDY1MzM4Mzc0fQ.uaWFNXt8zWh_3qmpBPMNXsExo0d-u_vVmd11A-JRaDs';

const supabase = createClient(supabaseUrl, supabaseKey);

const ACO_CUSTOMER_ID = '550e8400-e29b-41d4-a716-446655440001';

console.log('🌱 Seeding ACO Demo Data (PM-Approved Numbers)');
console.log('   ARR: $185,000');
console.log('   Health Score: 6.4/10');
console.log('   Operation Blackout: $85,000 loss\n');

try {
  // 1. Insert ACO Customer
  console.log('1️⃣ Creating ACO customer...');
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert({
      id: ACO_CUSTOMER_ID,
      name: 'Apex Consolidated Operations',
      domain: 'apexconsolidated.ops',
      industry: 'Global Strategic Coordination Services',
      health_score: 64,  // 6.4 * 10
      current_arr: 185000,
      renewal_date: '2026-04-15',
      is_demo: true
    }, { onConflict: 'id' })
    .select()
    .single();

  if (customerError) throw new Error(`Customer creation failed: ${customerError.message}`);
  console.log('   ✅ ACO customer created');

  // 2. Insert Marcus Castellan
  console.log('2️⃣ Creating Marcus Castellan contact...');
  const { data: marcus, error: marcusError } = await supabase
    .from('contacts')
    .insert({
      customer_id: ACO_CUSTOMER_ID,
      first_name: 'Marcus',
      last_name: 'Castellan',
      email: 'marcus.castellan@apexconsolidated.ops',
      phone: '+1 (555) 0100',
      title: 'Chief Operating Officer',
      is_primary: true,
      is_demo: true
    })
    .select()
    .single();

  if (marcusError && !marcusError.message.includes('duplicate')) {
    throw new Error(`Marcus creation failed: ${marcusError.message}`);
  }
  console.log('   ✅ Marcus Castellan created');

  // 3. Insert Dr. Elena Voss
  console.log('3️⃣ Creating Dr. Elena Voss contact...');
  const { data: elena, error: elenaError } = await supabase
    .from('contacts')
    .insert({
      customer_id: ACO_CUSTOMER_ID,
      first_name: 'Elena',
      last_name: 'Voss',
      email: 'elena.voss@apexconsolidated.ops',
      phone: '+1 (555) 0101',
      title: 'VP of Technical Operations',
      is_primary: false,
      is_demo: true
    })
    .select()
    .single();

  if (elenaError && !elenaError.message.includes('duplicate')) {
    throw new Error(`Elena creation failed: ${elenaError.message}`);
  }
  console.log('   ✅ Dr. Elena Voss created');

  // 4. Insert Contract
  console.log('4️⃣ Creating ACO contract...');
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      customer_id: ACO_CUSTOMER_ID,
      contract_number: 'ACO-CONTRACT-2023',
      start_date: '2023-04-15',
      end_date: '2026-04-15',
      arr: 185000,
      seats: 450,
      contract_type: 'subscription',
      status: 'active',
      auto_renewal: false,
      is_demo: true
    })
    .select()
    .single();

  if (contractError && !contractError.message.includes('duplicate')) {
    console.log(`   ⚠️  Contract warning: ${contractError.message}`);
  } else {
    console.log('   ✅ ACO contract created');
  }

  // 5. Insert Renewal
  console.log('5️⃣ Creating ACO renewal...');
  const { data: renewal, error: renewalError } = await supabase
    .from('renewals')
    .insert({
      contract_id: contract?.id,
      customer_id: ACO_CUSTOMER_ID,
      renewal_date: '2026-04-15',
      current_arr: 185000,
      proposed_arr: 185000,
      probability: 58,
      stage: 'discovery',
      risk_level: 'medium',
      expansion_opportunity: 1700000,
      ai_risk_score: 42,
      ai_recommendations: 'Priority: Establish relationship with Dr. Elena Voss within 7 days.',
      ai_confidence: 75,
      last_contact_date: '2024-07-15',
      current_phase: 'planning',
      is_demo: true
    })
    .select()
    .single();

  if (renewalError && !renewalError.message.includes('duplicate')) {
    console.log(`   ⚠️  Renewal warning: ${renewalError.message}`);
  } else {
    console.log('   ✅ ACO renewal created');
  }

  // 6. Insert Operation Blackout
  console.log('6️⃣ Creating Operation Blackout...');
  const { error: blackoutError } = await supabase
    .from('demo_operations')
    .insert({
      customer_id: ACO_CUSTOMER_ID,
      name: 'Operation Blackout',
      status: 'failed',
      failure_reason: 'Platform latency caused 47-second delay in critical coordination phase',
      cost_impact: 85000,  // $85K loss
      quarter: 'Q4 2024',
      operation_date: '2024-10-15'
    });

  if (blackoutError && !blackoutError.message.includes('duplicate')) {
    console.log(`   ⚠️  Operation Blackout warning: ${blackoutError.message}`);
  } else {
    console.log('   ✅ Operation Blackout created');
  }

  // 7. Insert other operations
  console.log('7️⃣ Creating additional operations...');
  await supabase.from('demo_operations').insert([
    {
      customer_id: ACO_CUSTOMER_ID,
      name: 'Operation Nightfall',
      status: 'success',
      quarter: 'Q3 2024',
      operation_date: '2024-08-22'
    },
    {
      customer_id: ACO_CUSTOMER_ID,
      name: 'Operation Shadow Strike',
      status: 'success',
      quarter: 'Q2 2024',
      operation_date: '2024-06-10'
    }
  ]);
  console.log('   ✅ Additional operations created');

  // 8. Insert Support Tickets
  console.log('8️⃣ Creating support tickets...');
  const now = new Date();
  await supabase.from('demo_support_tickets').insert([
    {
      customer_id: ACO_CUSTOMER_ID,
      ticket_number: 'ACO-4728',
      subject: 'Operative Smith cannot access Phase 3 coordination documents',
      category: 'permissions_error',
      priority: 'high',
      resolution_time_hours: 72,
      sentiment: 'frustrated',
      created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: ACO_CUSTOMER_ID,
      ticket_number: 'ACO-4801',
      subject: 'Timezone conversion bug in Jakarta facility coordination',
      category: 'bug',
      priority: 'medium',
      resolution_time_hours: 48,
      sentiment: 'frustrated',
      created_at: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: ACO_CUSTOMER_ID,
      ticket_number: 'ACO-4823',
      subject: 'Performance degradation during peak operational hours',
      category: 'performance',
      priority: 'high',
      sentiment: 'frustrated',
      created_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: ACO_CUSTOMER_ID,
      ticket_number: 'ACO-4856',
      subject: 'Integration with Operative Management System v8.2 failing',
      category: 'integration',
      priority: 'high',
      sentiment: 'frustrated',
      created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      customer_id: ACO_CUSTOMER_ID,
      ticket_number: 'ACO-4891',
      subject: 'Dashboard not displaying real-time operational status',
      category: 'ux',
      priority: 'medium',
      resolution_time_hours: 24,
      sentiment: 'neutral',
      created_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  console.log('   ✅ Support tickets created (5 tickets, 4 frustrated)');

  console.log('\n' + '='.repeat(60));
  console.log('✅ ACO Demo Data Seeding Complete!');
  console.log('='.repeat(60));
  console.log(`\nCustomer ID: ${ACO_CUSTOMER_ID}`);
  console.log('ARR: $185,000');
  console.log('Health Score: 6.4/10');
  console.log('Operation Blackout: $85,000 loss\n');

} catch (error) {
  console.error('\n❌ Seeding failed:', error.message);
  process.exit(1);
}
