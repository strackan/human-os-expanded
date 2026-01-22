/**
 * Fix Ryan Owens session to use storage-based context
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function fixSession() {
  // Get the premier template ID
  const { data: premierTemplate, error: templateError } = await supabase
    .from('sculptor_templates')
    .select('id, slug, name')
    .eq('slug', 'premier')
    .single();

  if (templateError || !premierTemplate) {
    console.error('Premier template not found:', templateError);
    return;
  }

  console.log('Premier template found:', premierTemplate.id, '-', premierTemplate.name);

  // Update the ryan-owens session
  const { data, error } = await supabase
    .from('sculptor_sessions')
    .update({
      entity_slug: 'ryan-owens',
      template_id: premierTemplate.id,
      // Clear the old scene_prompt to ensure storage-based context is used
      // scene_prompt: null  // Uncomment if you want to clear it
    })
    .eq('access_code', 'sc_ryan-owens')
    .select('id, access_code, entity_name, entity_slug, template_id');

  if (error) {
    console.error('Error updating session:', error);
    return;
  }

  console.log('\n✓ Updated session:', data);

  // Verify the update
  const { data: verification } = await supabase
    .from('sculptor_sessions')
    .select('id, access_code, entity_name, entity_slug, template:sculptor_templates(slug, name)')
    .eq('access_code', 'sc_ryan-owens')
    .single();

  console.log('\nVerification:');
  console.log('Entity Slug:', verification?.entity_slug);
  console.log('Template:', (verification?.template as any)?.slug, '-', (verification?.template as any)?.name);
}

fixSession().catch(console.error);
