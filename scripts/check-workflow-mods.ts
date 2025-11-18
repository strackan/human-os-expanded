import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMods() {
  const { data, error } = await supabase
    .from('workflow_modifications')
    .select('*')
    .eq('is_active', true)
    .order('priority');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total modifications:', data?.length);
  data?.forEach(mod => {
    console.log(`\n${mod.scope_type.toUpperCase()} (priority ${mod.priority}): ${mod.modification_type}`);
    console.log('  Step:', mod.modification_data?.step_name || mod.modification_data?.artifact_id);
    console.log('  Position:', mod.target_position);
    console.log('  Criteria:', JSON.stringify(mod.scope_criteria));
  });
}

checkMods();
