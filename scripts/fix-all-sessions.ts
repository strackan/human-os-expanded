/**
 * Fix all sculptor sessions to use storage-based context
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

// Mapping of access codes to their correct entity_slug
const SESSION_FIXES = [
  { access_code: 'sc_chris_szalaj', entity_slug: 'chris-szalaj', use_premier: true },
  { access_code: 'sc_chris-szalaj', entity_slug: 'chris-szalaj', use_premier: true },
  { access_code: 'sc_scottleese', entity_slug: 'scott', use_premier: true }, // Scott's CHARACTER.md has The Sculptor
  { access_code: 'yogibill69', entity_slug: 'hippie-bill', use_premier: true }, // Bill's CHARACTER.md has The Hippie
];

async function fixAllSessions() {
  // Get premier template ID
  const { data: premierTemplate } = await supabase
    .from('sculptor_templates')
    .select('id')
    .eq('slug', 'premier')
    .single();

  if (!premierTemplate) {
    console.error('Premier template not found');
    return;
  }

  console.log('Premier template ID:', premierTemplate.id);
  console.log('\nFixing sessions...\n');

  for (const fix of SESSION_FIXES) {
    const update: Record<string, any> = {
      entity_slug: fix.entity_slug,
    };

    if (fix.use_premier) {
      update.template_id = premierTemplate.id;
    }

    const { data, error } = await supabase
      .from('sculptor_sessions')
      .update(update)
      .eq('access_code', fix.access_code)
      .select('access_code, entity_name, entity_slug');

    if (error) {
      console.error(`✗ ${fix.access_code}: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✓ ${fix.access_code} → entity_slug='${fix.entity_slug}'`);
    } else {
      console.log(`- ${fix.access_code} (not found)`);
    }
  }

  // Show final state
  console.log('\n\nFinal session state:');
  const { data: sessions } = await supabase
    .from('sculptor_sessions')
    .select('access_code, entity_name, entity_slug, template:sculptor_templates(slug)')
    .order('created_at', { ascending: false });

  console.log('\n| Access Code | Entity Name | Entity Slug | Template |');
  console.log('|-------------|-------------|-------------|----------|');
  for (const s of sessions || []) {
    console.log(`| ${s.access_code?.padEnd(11)} | ${(s.entity_name || 'NULL').padEnd(11)} | ${(s.entity_slug || 'NULL').padEnd(11)} | ${((s.template as any)?.slug || 'NULL').padEnd(8)} |`);
  }
}

fixAllSessions().catch(console.error);
