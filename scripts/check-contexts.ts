import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContexts() {
  const { data } = await supabase
    .from('workflow_definitions')
    .select('workflow_id, slide_sequence, slide_contexts')
    .like('workflow_id', 'inhersight%');

  data?.forEach((w) => {
    console.log(w.workflow_id);
    console.log('  sequence:', w.slide_sequence?.join(', '));
    console.log('  contexts:', Object.keys(w.slide_contexts || {}));
    console.log('');
  });
}

checkContexts();
