/**
 * Check template content
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function checkTemplate() {
  const { data, error } = await supabase
    .from('sculptor_templates')
    .select('*')
    .eq('slug', 'premier')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Template slug:', data.slug);
  console.log('Template name:', data.name);
  console.log('Metadata:', JSON.stringify(data.metadata, null, 2));
  console.log('\nSystem prompt:');
  console.log('---');
  console.log(data.system_prompt);
  console.log('---');

  // Test the placeholder replacement
  const placeholder = data.metadata?.entity_placeholder as string || '[ENTITY_NAME]';
  console.log('\nPlaceholder:', placeholder);
  console.log('Placeholder as regex:', new RegExp(placeholder, 'g'));

  // Count matches
  const matches = data.system_prompt.match(new RegExp(placeholder, 'g'));
  console.log('Matches found:', matches?.length || 0);
  if (matches) {
    console.log('Matches:', matches);
  }
}

checkTemplate().catch(console.error);
