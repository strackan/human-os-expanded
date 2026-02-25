/**
 * Seed Demo Workflow Definitions and Executions
 * Creates sample workflow data for testing the dashboard
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function seedDemoWorkflows() {
  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Get the first user (CSM) from profiles
    console.log('👤 Finding first user profile...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1)
      .single();

    if (profileError || !profiles) {
      console.error('❌ No user profiles found. Please ensure you have a user account.');
      process.exit(1);
    }

    const demoUserId = profiles.id;
    console.log(`✅ Using user: ${profiles.email} (${demoUserId})`);

    // Check if customer exists
    const demoCustomerId = '550e8400-e29b-41d4-a716-446655440001';
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', demoCustomerId)
      .single();

    if (!existingCustomer) {
      console.log('📝 Customer Obsidian Black does not exist. Creating...');
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          id: demoCustomerId,
          name: 'Obsidian Black',
          current_arr: 185000,
          health_score: 87,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (customerError) {
        console.error('❌ Failed to create customer:', customerError);
        process.exit(1);
      }
      console.log('✅ Created customer: Obsidian Black');
    } else {
      console.log(`✅ Customer exists: ${existingCustomer.name}`);
    }

    // Delete existing demo workflow definitions and executions
    console.log('🧹 Cleaning up existing demo data...');
    await supabase.from('workflow_executions').delete().eq('is_demo', true);
    await supabase.from('workflow_definitions').delete().eq('is_demo', true);

    // Insert workflow definitions
    console.log('📋 Creating workflow definitions...');
    const workflowDefinitions = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        workflow_id: 'obsblk-strategic-planning',
        name: 'Complete Strategic Account Plan for Obsidian Black',
        workflow_type: 'strategic',
        description: 'At-risk account recovery planning - annual strategic account review',
        trigger_conditions: {
          workflow_id: 'obsblk-strategic-planning',
          trigger_type: 'demo_sequence',
          order: 1
        },
        priority_weight: 700,
        is_active: true,
        is_demo: true
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        workflow_id: 'obsblk-expansion-opportunity',
        name: 'Expansion Opportunity for Obsidian Black',
        workflow_type: 'opportunity',
        description: 'Proactive multi-year expansion with underpriced, high-growth customer',
        trigger_conditions: {
          workflow_id: 'obsblk-expansion-opportunity',
          trigger_type: 'demo_sequence',
          order: 2,
          opportunity_score_min: 7,
          utilization_percent_min: 100
        },
        priority_weight: 800,
        is_active: true,
        is_demo: true
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        workflow_id: 'obsblk-executive-engagement',
        name: 'Executive Engagement with Obsidian Black',
        workflow_type: 'risk',
        description: 'Critical executive engagement following Marcus escalation email',
        trigger_conditions: {
          workflow_id: 'obsblk-executive-engagement',
          trigger_type: 'demo_sequence',
          order: 3,
          risk_score_min: 7,
          relationship_strength: 'weak'
        },
        priority_weight: 900,
        is_active: true,
        is_demo: true
      }
    ];

    const { error: defError } = await supabase
      .from('workflow_definitions')
      .insert(workflowDefinitions);

    if (defError) {
      console.error('❌ Failed to create workflow definitions:', defError);
      process.exit(1);
    }
    console.log('✅ Created 3 workflow definitions');

    // Insert workflow executions
    console.log('🎯 Creating workflow executions...');
    const workflowExecutions = [
      {
        workflow_definition_id: '00000000-0000-0000-0000-000000000001',
        customer_id: demoCustomerId,
        assigned_csm_id: demoUserId,
        status: 'not_started',
        priority_score: 700,
        is_demo: true,
        execution_data: {}
      },
      {
        workflow_definition_id: '00000000-0000-0000-0000-000000000002',
        customer_id: demoCustomerId,
        assigned_csm_id: demoUserId,
        status: 'not_started',
        priority_score: 800,
        is_demo: true,
        execution_data: {}
      },
      {
        workflow_definition_id: '00000000-0000-0000-0000-000000000003',
        customer_id: demoCustomerId,
        assigned_csm_id: demoUserId,
        status: 'not_started',
        priority_score: 900,
        is_demo: true,
        execution_data: {}
      }
    ];

    const { error: execError } = await supabase
      .from('workflow_executions')
      .insert(workflowExecutions);

    if (execError) {
      console.error('❌ Failed to create workflow executions:', execError);
      process.exit(1);
    }
    console.log('✅ Created 3 workflow executions');

    // Verify the data
    console.log('\n📊 Verification:');
    const { data: defs } = await supabase
      .from('workflow_definitions')
      .select('name, workflow_type, priority_weight')
      .eq('is_demo', true)
      .order('priority_weight', { ascending: false });

    if (defs) {
      console.log('✅ Workflow Definitions:');
      defs.forEach((def, i) => {
        console.log(`   ${i + 1}. ${def.name} (${def.workflow_type}, priority: ${def.priority_weight})`);
      });
    }

    const { data: execs } = await supabase
      .from('workflow_executions')
      .select('id, status, priority_score')
      .eq('is_demo', true)
      .order('priority_score', { ascending: false });

    if (execs) {
      console.log(`✅ Workflow Executions: ${execs.length} created`);
      execs.forEach((exec, i) => {
        console.log(`   ${i + 1}. ID: ${exec.id.slice(0, 8)}... (status: ${exec.status}, priority: ${exec.priority_score})`);
      });
    }

    console.log('\n🎉 Demo workflow seeding complete!');
    console.log('💡 You can now refresh the dashboard to see the workflows.');

  } catch (error) {
    console.error('❌ Error seeding demo workflows:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDemoWorkflows();
