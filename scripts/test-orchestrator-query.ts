import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('=== Testing Orchestrator Query ===');
  console.log('isDemoCompanyUser: true');
  console.log('demoMode: true\n');

  // Test the exact query from orchestrator (WITHOUT assigned_csm_id filter)
  const { data, error } = await supabase
    .from('workflow_executions')
    .select(`
      id,
      status,
      is_demo,
      assigned_csm_id,
      workflow_definition:workflow_definitions(name, trigger_conditions),
      customer:customers!workflow_executions_customer_id_fkey(domain)
    `)
    .in('status', ['not_started', 'underway', 'snoozed'])
    .eq('is_demo', true);

  console.log('Found workflows:', data?.length || 0);
  if (error) console.error('Error:', error);
  if (data) {
    data.forEach((w: any) => {
      console.log('- ', w.workflow_definition?.name, '(status:', w.status, ', order:', w.workflow_definition?.trigger_conditions?.order, ')');
    });
  }
}

main();
