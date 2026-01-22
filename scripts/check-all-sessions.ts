/**
 * Check all sculptor sessions and their entity_slug status
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function checkAllSessions() {
  const { data, error } = await supabase
    .from('sculptor_sessions')
    .select('id, access_code, entity_name, entity_slug, status, template:sculptor_templates(slug, name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All Sculptor Sessions:\n');
  console.log('| Entity Name | Access Code | Entity Slug | Template | Status |');
  console.log('|-------------|-------------|-------------|----------|--------|');

  for (const session of data || []) {
    const entitySlug = session.entity_slug || 'NULL';
    const template = (session.template as any)?.slug || 'NULL';
    console.log(`| ${session.entity_name?.padEnd(11) || 'NULL'.padEnd(11)} | ${session.access_code?.padEnd(11)} | ${entitySlug.padEnd(11)} | ${template.padEnd(8)} | ${session.status?.padEnd(6)} |`);
  }

  // Show which need fixing
  const needsFix = (data || []).filter(s => !s.entity_slug && s.entity_name);
  if (needsFix.length > 0) {
    console.log('\n\nSessions that need entity_slug set:');
    for (const s of needsFix) {
      console.log(`- ${s.entity_name} (${s.access_code})`);
    }
  }
}

checkAllSessions().catch(console.error);
