import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';

async function checkWorkflows() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('workflow_id, name, slide_sequence')
    .like('workflow_id', 'inhersight%')
    .order('workflow_id');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('InHerSight Workflows:');
  for (const row of data || []) {
    console.log('\n' + row.workflow_id + ' (' + row.name + '):');
    console.log('  Slides:', row.slide_sequence?.length || 0, 'total');
    if (row.slide_sequence) {
      row.slide_sequence.forEach((slide: string, i: number) => {
        console.log('    ' + (i+1) + '. ' + slide);
      });
    }
  }
}

checkWorkflows();
