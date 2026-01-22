/**
 * Check scene_prompt content for ryan-owens session
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function checkScenePrompt() {
  const { data, error } = await supabase
    .from('sculptor_sessions')
    .select('access_code, entity_name, entity_slug, scene_prompt')
    .eq('access_code', 'sc_ryan-owens')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Access Code:', data.access_code);
  console.log('Entity Name:', data.entity_name);
  console.log('Entity Slug:', data.entity_slug);
  console.log('\nScene Prompt:');
  console.log('---');
  console.log(data.scene_prompt || '(null)');
  console.log('---');
}

checkScenePrompt().catch(console.error);
