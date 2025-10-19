/**
 * Seed Obsidian Black Demo Data
 * Programmatically inserts demo data using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '..', '.env.local') });

const OBSIDIAN_BLACK_ID = '550e8400-e29b-41d4-a716-446655440001';

async function seedObsidianBlack() {
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🌱 Seeding Obsidian Black customer data...\n');

  // ============================================================================
  // 1. Customer
  // ============================================================================
  console.log('1️⃣  Creating customer: Obsidian Black');
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert({
      id: OBSIDIAN_BLACK_ID,
      name: 'Obsidian Black',
      domain: 'obsidianblack.ops',
      industry: 'Global Strategic Coordination Services',
      health_score: 64, // 6.4/10
      current_arr: 185000.00,
      renewal_date: '2026-04-15',
      is_demo: true,
      primary_contact_name: 'Marcus Castellan',
      primary_contact_email: 'marcus.castellan@obsidianblack.ops',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (customerError) {
    console.error('❌ Failed to create customer:', customerError);
    process.exit(1);
  }
  console.log('✅ Customer created:', customer.name);

  // ============================================================================
  // 2. Customer Properties
  // ============================================================================
  console.log('\n2️⃣  Creating customer properties');
  const { error: propertiesError } = await supabase
    .from('customer_properties')
    .upsert({
      customer_id: OBSIDIAN_BLACK_ID,
      usage_score: 72,
      health_score: 64,
      nps_score: 51,
      current_arr: 185000.00,
      revenue_impact_tier: 3,
      churn_risk_score: 4,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    });

  if (propertiesError) {
    console.log('⚠️  Customer properties:', propertiesError.message);
  } else {
    console.log('✅ Customer properties created');
  }

  // ============================================================================
  // 3. Contacts
  // ============================================================================
  console.log('\n3️⃣  Creating contacts');

  // Marcus Castellan
  const { data: marcus, error: marcusError } = await supabase
    .from('contacts')
    .upsert({
      customer_id: OBSIDIAN_BLACK_ID,
      first_name: 'Marcus',
      last_name: 'Castellan',
      email: 'marcus.castellan@obsidianblack.ops',
      phone: '+1 (555) 0100',
      title: 'Chief Operating Officer',
      is_primary: true,
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'customer_id,email'
    })
    .select()
    .single();

  if (marcusError) {
    console.log('⚠️  Marcus contact:', marcusError.message);
  } else {
    console.log('✅ Marcus Castellan created');
  }

  // Dr. Elena Voss
  const { data: elena, error: elenaError } = await supabase
    .from('contacts')
    .upsert({
      customer_id: OBSIDIAN_BLACK_ID,
      first_name: 'Elena',
      last_name: 'Voss',
      email: 'elena.voss@obsidianblack.ops',
      phone: '+1 (555) 0101',
      title: 'VP of Technical Operations',
      is_primary: false,
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'customer_id,email'
    })
    .select()
    .single();

  if (elenaError) {
    console.log('⚠️  Elena contact:', elenaError.message);
  } else {
    console.log('✅ Dr. Elena Voss created');
  }

  // ============================================================================
  // 4. Contract
  // ============================================================================
  console.log('\n4️⃣  Creating contract');
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .upsert({
      customer_id: OBSIDIAN_BLACK_ID,
      contract_number: 'ACO-CONTRACT-2023',
      start_date: '2023-04-15',
      end_date: '2026-04-15',
      arr: 185000.00,
      seats: 450,
      contract_type: 'subscription',
      status: 'active',
      auto_renewal: false,
      notes: '3-year contract, 99.5% uptime SLA, critical coordination platform',
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'customer_id,contract_number'
    })
    .select()
    .single();

  if (contractError) {
    console.log('⚠️  Contract:', contractError.message);
  } else {
    console.log('✅ Contract created:', contract.contract_number);
  }

  // ============================================================================
  // 5. Renewal
  // ============================================================================
  console.log('\n5️⃣  Creating renewal');
  const { data: renewal, error: renewalError } = await supabase
    .from('renewals')
    .upsert({
      contract_id: contract?.id,
      customer_id: OBSIDIAN_BLACK_ID,
      renewal_date: '2026-04-15',
      current_arr: 185000.00,
      proposed_arr: 185000.00,
      probability: 58,
      stage: 'discovery',
      risk_level: 'medium',
      expansion_opportunity: 1700000.00,
      ai_risk_score: 42,
      ai_recommendations: 'Priority: Establish relationship with Dr. Elena Voss within 7 days. She is evaluating competitors and launching $1.7M initiative.',
      ai_confidence: 75,
      last_contact_date: '2024-07-15',
      next_action: 'Respond to Marcus email, reach out to Elena',
      next_action_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      notes: 'Account at moderate risk. Operation Blackout ($85K loss) damaged trust. Marcus disengaged for 90 days. Elena evaluating 3 competitors. High expansion potential with Elena initiative.',
      current_phase: 'planning',
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'customer_id,renewal_date'
    })
    .select()
    .single();

  if (renewalError) {
    console.log('⚠️  Renewal:', renewalError.message);
  } else {
    console.log('✅ Renewal created');
  }

  // ============================================================================
  // 6. Demo Operations
  // ============================================================================
  console.log('\n6️⃣  Creating demo operations');
  const operations = [
    {
      customer_id: OBSIDIAN_BLACK_ID,
      name: 'Operation Blackout',
      status: 'failed',
      failure_reason: 'Platform latency caused 47-second delay in critical coordination phase',
      cost_impact: 85000.00,
      quarter: 'Q4 2024',
      operation_date: '2024-10-15'
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      name: 'Operation Nightfall',
      status: 'success',
      failure_reason: null,
      cost_impact: null,
      quarter: 'Q3 2024',
      operation_date: '2024-08-22'
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      name: 'Operation Shadow Strike',
      status: 'success',
      failure_reason: null,
      cost_impact: null,
      quarter: 'Q2 2024',
      operation_date: '2024-06-10'
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      name: 'Operation Crimson Dawn',
      status: 'in_progress',
      failure_reason: null,
      cost_impact: null,
      quarter: 'Q1 2025',
      operation_date: '2025-01-15'
    }
  ];

  const { error: operationsError } = await supabase
    .from('demo_operations')
    .upsert(operations.map(op => ({
      ...op,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })), {
      onConflict: 'customer_id,name'
    });

  if (operationsError) {
    console.log('⚠️  Operations:', operationsError.message);
  } else {
    console.log(`✅ Created ${operations.length} operations`);
  }

  // ============================================================================
  // 7. Demo Support Tickets
  // ============================================================================
  console.log('\n7️⃣  Creating support tickets');
  const tickets = [
    {
      customer_id: OBSIDIAN_BLACK_ID,
      ticket_number: 'ACO-4728',
      subject: 'Operative Smith cannot access Phase 3 coordination documents',
      category: 'permissions_error',
      priority: 'high',
      resolution_time_hours: 72,
      sentiment: 'frustrated',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      ticket_number: 'ACO-4801',
      subject: 'Timezone conversion bug in Jakarta facility coordination',
      category: 'bug',
      priority: 'medium',
      resolution_time_hours: 48,
      sentiment: 'frustrated',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString() // 6 days ago
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      ticket_number: 'ACO-4823',
      subject: 'Performance degradation during peak operational hours',
      category: 'performance',
      priority: 'high',
      resolution_time_hours: null,
      sentiment: 'frustrated',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString() // 4 days ago
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      ticket_number: 'ACO-4856',
      subject: 'Integration with Operative Management System v8.2 failing',
      category: 'integration',
      priority: 'high',
      resolution_time_hours: null,
      sentiment: 'frustrated',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
    },
    {
      customer_id: OBSIDIAN_BLACK_ID,
      ticket_number: 'ACO-4891',
      subject: 'Dashboard not displaying real-time operational status',
      category: 'ux',
      priority: 'medium',
      resolution_time_hours: 24,
      sentiment: 'neutral',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString() // 1 day ago
    }
  ];

  const { error: ticketsError } = await supabase
    .from('demo_support_tickets')
    .upsert(tickets, {
      onConflict: 'customer_id,ticket_number'
    });

  if (ticketsError) {
    console.log('⚠️  Support tickets:', ticketsError.message);
  } else {
    console.log(`✅ Created ${tickets.length} support tickets`);
  }

  // ============================================================================
  // Verification
  // ============================================================================
  console.log('\n🔍 Verifying data...');
  const { data: verifyCustomer, error: verifyError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', OBSIDIAN_BLACK_ID)
    .single();

  if (verifyError || !verifyCustomer) {
    console.error('❌ Verification failed:', verifyError);
    process.exit(1);
  }

  console.log('\n✅ SEEDING COMPLETE!\n');
  console.log('📊 Obsidian Black Customer:');
  console.log('   ID:', verifyCustomer.id);
  console.log('   Name:', verifyCustomer.name);
  console.log('   ARR:', `$${verifyCustomer.current_arr.toLocaleString()}`);
  console.log('   Health Score:', `${verifyCustomer.health_score / 10}/10`);
  console.log('   Renewal Date:', verifyCustomer.renewal_date);
  console.log('   Demo Flag:', verifyCustomer.is_demo);
  console.log('\n🎯 You can now launch the Obsidian Black workflow!');
}

seedObsidianBlack().catch(console.error);
