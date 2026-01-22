import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function checkSessions() {
  // Get ryan-owens sessions
  const { data, error } = await supabase
    .from('sculptor_sessions')
    .select('id, access_code, entity_name, entity_slug, status, scene_prompt, template:sculptor_templates(slug, name)')
    .ilike('entity_name', '%ryan%')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Ryan Owens Sessions:');
  for (const session of data || []) {
    console.log('\n---');
    console.log('ID:', session.id);
    console.log('Code:', session.access_code);
    console.log('Entity Name:', session.entity_name);
    console.log('Entity Slug:', session.entity_slug);
    console.log('Template:', (session.template as any)?.slug, '-', (session.template as any)?.name);
    console.log('Status:', session.status);
    console.log('Scene Prompt (first 300 chars):', session.scene_prompt?.substring(0, 300) || 'NULL');
  }
}

checkSessions().catch(console.error);
