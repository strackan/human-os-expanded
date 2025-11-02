/**
 * Admin Seed API
 * Seeds Obsidian Black demo data
 *
 * Usage: curl http://localhost:3000/api/admin/seed
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

const OBSIDIAN_BLACK_ID = '550e8400-e29b-41d4-a716-446655440001';

export async function POST() {
  try {
    const supabase = createServiceRoleClient();
    const results = {
      customer: false,
      properties: false,
      contacts: 0,
      contract: false,
      renewal: false,
      operations: 0,
      tickets: 0
    };

    console.log('🌱 Starting Obsidian Black seed...');

    // ============================================================================
    // 1. Customer
    // ============================================================================
    const { error: customerError } = await supabase
      .from('customers')
      .upsert({
        id: OBSIDIAN_BLACK_ID,
        name: 'Obsidian Black',
        domain: 'obsidianblack.ops',
        industry: 'Global Strategic Coordination Services',
        health_score: 64,
        current_arr: 185000.00,
        renewal_date: '2026-04-15',
        is_demo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (customerError) {
      console.error('Customer error:', customerError);
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }
    results.customer = true;
    console.log('✅ Customer created');

    // ============================================================================
    // 2. Customer Properties
    // ============================================================================
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

    if (!propertiesError) {
      results.properties = true;
      console.log('✅ Customer properties created');
    }

    // ============================================================================
    // 3. Contacts
    // ============================================================================
    const contacts = [
      {
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
      },
      {
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
      }
    ];

    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .upsert(contacts)
      .select();

    if (!contactsError && contactsData) {
      results.contacts = contactsData.length;
      console.log(`✅ Created ${contactsData.length} contacts`);
    }

    // ============================================================================
    // 4. Contract
    // ============================================================================
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
      })
      .select()
      .single();

    if (!contractError && contract) {
      results.contract = true;
      console.log('✅ Contract created');

      // ============================================================================
      // 5. Renewal
      // ============================================================================
      const { error: renewalError } = await supabase
        .from('renewals')
        .upsert({
          contract_id: contract.id,
          customer_id: OBSIDIAN_BLACK_ID,
          renewal_date: '2026-04-15',
          current_arr: 185000.00,
          proposed_arr: 185000.00,
          probability: 58,
          stage: 'discovery',
          risk_level: 'medium',
          expansion_opportunity: 1700000.00,
          ai_risk_score: 42,
          ai_recommendations: 'Priority: Establish relationship with Dr. Elena Voss within 7 days.',
          ai_confidence: 75,
          last_contact_date: '2024-07-15',
          next_action: 'Respond to Marcus email, reach out to Elena',
          next_action_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          notes: 'Account at moderate risk. Operation Blackout ($85K loss) damaged trust.',
          current_phase: 'planning',
          is_demo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (!renewalError) {
        results.renewal = true;
        console.log('✅ Renewal created');
      }
    }

    // ============================================================================
    // 6. Demo Operations
    // ============================================================================
    const operations = [
      {
        customer_id: OBSIDIAN_BLACK_ID,
        name: 'Operation Blackout',
        status: 'failed',
        failure_reason: 'Platform latency caused 47-second delay in critical coordination phase',
        cost_impact: 85000.00,
        quarter: 'Q4 2024',
        operation_date: '2024-10-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        name: 'Operation Nightfall',
        status: 'success',
        quarter: 'Q3 2024',
        operation_date: '2024-08-22',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        name: 'Operation Shadow Strike',
        status: 'success',
        quarter: 'Q2 2024',
        operation_date: '2024-06-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        name: 'Operation Crimson Dawn',
        status: 'in_progress',
        quarter: 'Q1 2025',
        operation_date: '2025-01-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: operationsData, error: operationsError } = await supabase
      .from('demo_operations')
      .upsert(operations)
      .select();

    if (!operationsError && operationsData) {
      results.operations = operationsData.length;
      console.log(`✅ Created ${operationsData.length} operations`);
    }

    // ============================================================================
    // 7. Demo Support Tickets
    // ============================================================================
    const tickets = [
      {
        customer_id: OBSIDIAN_BLACK_ID,
        ticket_number: 'ACO-4728',
        subject: 'Operative Smith cannot access Phase 3 coordination documents',
        category: 'permissions_error',
        priority: 'high',
        resolution_time_hours: 72,
        sentiment: 'frustrated',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        ticket_number: 'ACO-4801',
        subject: 'Timezone conversion bug in Jakarta facility coordination',
        category: 'bug',
        priority: 'medium',
        resolution_time_hours: 48,
        sentiment: 'frustrated',
        created_at: new Date(Date.now() - 6 * 86400000).toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        ticket_number: 'ACO-4823',
        subject: 'Performance degradation during peak operational hours',
        category: 'performance',
        priority: 'high',
        resolution_time_hours: null,
        sentiment: 'frustrated',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        ticket_number: 'ACO-4856',
        subject: 'Integration with Operative Management System v8.2 failing',
        category: 'integration',
        priority: 'high',
        resolution_time_hours: null,
        sentiment: 'frustrated',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        customer_id: OBSIDIAN_BLACK_ID,
        ticket_number: 'ACO-4891',
        subject: 'Dashboard not displaying real-time operational status',
        category: 'ux',
        priority: 'medium',
        resolution_time_hours: 24,
        sentiment: 'neutral',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ];

    const { data: ticketsData, error: ticketsError } = await supabase
      .from('demo_support_tickets')
      .upsert(tickets)
      .select();

    if (!ticketsError && ticketsData) {
      results.tickets = ticketsData.length;
      console.log(`✅ Created ${ticketsData.length} tickets`);
    }

    // ============================================================================
    // Verification
    // ============================================================================
    const { data: verifyCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', OBSIDIAN_BLACK_ID)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Obsidian Black demo data seeded successfully',
      results,
      customer: verifyCustomer
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed data'
      },
      { status: 500 }
    );
  }
}
