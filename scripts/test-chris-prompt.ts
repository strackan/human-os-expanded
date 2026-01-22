/**
 * Test prompt composition for chris-szalaj session
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function testChrisPrompt() {
  // Get session
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('*, template:sculptor_templates(*)')
    .eq('access_code', 'sc_chris-szalaj')
    .single();

  if (!session) {
    console.error('Session not found');
    return;
  }

  console.log('Session:');
  console.log('  entity_name:', session.entity_name);
  console.log('  entity_slug:', session.entity_slug);
  console.log('  template:', session.template?.slug);

  // Fetch context from storage
  const { data: charFile } = await supabase.storage
    .from('contexts')
    .download('chris-szalaj/CHARACTER.md');

  if (!charFile) {
    console.error('CHARACTER.md not found');
    return;
  }

  const character = await charFile.text();

  console.log('\n=== CHARACTER.md (first 1000 chars) ===\n');
  console.log(character.substring(0, 1000));

  // Check for key phrases
  console.log('\n=== KEY PHRASE CHECKS ===');
  console.log('Contains "YOU ARE MARIA":', character.includes('YOU ARE MARIA'));
  console.log('Contains "HUMAN YOU\'RE TALKING TO IS CHRIS":', character.includes("HUMAN YOU'RE TALKING TO IS CHRIS"));
  console.log('Contains "DO NOT act as Chris":', character.includes('DO NOT act as Chris'));
  console.log('Contains "Cucina Bella":', character.includes('Cucina Bella'));

  // Test placeholder replacement
  const placeholder = session.template?.metadata?.entity_placeholder as string || '[ENTITY_NAME]';
  const escapedPlaceholder = escapeRegex(placeholder);
  const entityName = session.entity_name || 'the subject';

  console.log('\n=== PLACEHOLDER TEST ===');
  console.log('Placeholder:', placeholder);
  console.log('Escaped:', escapedPlaceholder);
  console.log('Entity name:', entityName);

  const testString = 'Hello [ENTITY_NAME], welcome to the class!';
  const replaced = testString.replace(new RegExp(escapedPlaceholder, 'g'), entityName);
  console.log('Test input:', testString);
  console.log('Test output:', replaced);
}

testChrisPrompt().catch(console.error);
