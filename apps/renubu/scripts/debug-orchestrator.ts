/**
 * Debug script to check orchestrator data
 * Run with: npx tsx scripts/debug-orchestrator.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugOrchestrator() {
  console.log('\n=== 1️⃣ Available CSM Users ===');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(5);
  console.log(profiles);

  console.log('\n=== 2️⃣ Demo Workflow Executions ===');
  const { data: executions } = await supabase
    .from('workflow_executions')
    .select(`
      id,
      assigned_csm_id,
      customer_id,
      status,
      priority_score,
      is_demo,
      workflow_definition:workflow_definitions(name, trigger_conditions)
    `)
    .eq('is_demo', true);
  console.log(JSON.stringify(executions, null, 2));

  console.log('\n=== 3️⃣ Customer Data Check ===');
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, domain, current_arr as arr, renewal_date')
    .eq('id', '550e8400-e29b-41d4-a716-446655440001');
  console.log(customer);

  console.log('\n=== 4️⃣ Full Orchestrator Query (Demo Mode) ===');
  if (executions && executions.length > 0) {
    const csmId = executions[0].assigned_csm_id;
    console.log(`Testing with CSM ID: ${csmId}`);

    const { data: queue, error } = await supabase
      .from('workflow_executions')
      .select(`
        *,
        workflow_definition:workflow_definitions(*),
        customer:customers!workflow_executions_customer_id_fkey(id, domain, current_arr, renewal_date, assigned_to)
      `)
      .eq('assigned_csm_id', csmId)
      .eq('is_demo', true)
      .in('status', ['not_started', 'underway', 'snoozed']);

    if (error) {
      console.error('Query error:', error);
    } else {
      console.log(`Found ${queue?.length || 0} workflows`);
      console.log(JSON.stringify(queue, null, 2));
    }
  }
}

debugOrchestrator().catch(console.error);
