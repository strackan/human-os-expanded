import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const USER_ID = '550e8400-e29b-41d4-a716-446655440001'; // Justin

async function main() {
  console.log('=== Context Usage Analysis ===\n');

  // Get context usage stats
  const { data: usage, error } = await supabase
    .schema('founder_os')
    .rpc('get_context_usage', { p_user_id: USER_ID });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Context Usage (sorted by active tasks):');
  console.log('-'.repeat(70));
  console.log('Context Name'.padEnd(30) + 'Status'.padEnd(12) + 'Active'.padEnd(10) + 'Total');
  console.log('-'.repeat(70));

  for (const row of usage || []) {
    console.log(
      (row.context_name || '(unnamed)').padEnd(30) +
      row.context_status.padEnd(12) +
      String(row.active_tasks).padEnd(10) +
      String(row.total_tasks)
    );
  }

  // Also list all defined contexts
  console.log('\n\n=== Defined Contexts ===\n');
  const { data: contexts } = await supabase
    .schema('founder_os')
    .from('contexts')
    .select('name, status, description, created_at')
    .eq('user_id', USER_ID)
    .order('name');

  if (contexts?.length > 0) {
    for (const ctx of contexts) {
      console.log(`- ${ctx.name} [${ctx.status}]${ctx.description ? ': ' + ctx.description : ''}`);
    }
  } else {
    console.log('No contexts defined in the contexts table.');
  }
}

main().catch(console.error);
