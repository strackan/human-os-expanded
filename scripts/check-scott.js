const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

async function main() {
  // Find Scott's entity
  const { data: scottEntities, error: e1 } = await supabase
    .from('entities')
    .select('*')
    .ilike('slug', '%scott%');
  console.log('\nScott Entities:');
  scottEntities?.forEach(e => {
    console.log(`  - ${e.slug}: ${e.id}`);
    console.log(`    source: ${e.source_system}`);
    if (e.metadata?.email) console.log(`    email: ${e.metadata.email}`);
  });

  // Find Scott's contact
  const { data: scottContacts, error: e2 } = await supabase
    .from('contacts')
    .select('*')
    .ilike('name', '%scott%');
  console.log('\nScott Contacts:');
  scottContacts?.forEach(c => {
    console.log(`  - ${c.name}: ${c.id}`);
    console.log(`    email: ${c.email || 'none'}`);
    console.log(`    linkedin: ${c.linkedin_url || 'none'}`);
  });

  // Find the B744 activation key
  const { data: scottKey, error: e3 } = await supabase
    .from('activation_keys')
    .select('*')
    .ilike('code', '%B744%')
    .single();
  console.log('\nActivation Key B744:');
  if (scottKey) {
    console.log(`  code: ${scottKey.code}`);
    console.log(`  product: ${scottKey.product}`);
    console.log(`  user_id: ${scottKey.user_id || 'null'}`);
    console.log(`  session_id: ${scottKey.session_id || 'null'}`);
    console.log(`  expires_at: ${scottKey.expires_at}`);
    console.log(`  metadata:`, JSON.stringify(scottKey.metadata, null, 4));
  } else {
    console.log('  Not found! Error:', e3?.message);
  }

  // Check founder_os schema for any additional data
  try {
    const { data: founderKeys, error: e4 } = await supabase
      .schema('founder_os')
      .from('activation_keys')
      .select('*')
      .limit(5);
    console.log('\nfounder_os activation keys:', founderKeys?.length || 0);
    if (founderKeys?.length) {
      founderKeys.forEach(k => console.log(`  - ${k.code}`));
    }
  } catch (e) {
    console.log('\nfounder_os schema error:', e.message);
  }

  // List all existing auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  console.log('\nAuth users count:', authUsers?.users?.length || 0);
  if (authUsers?.users?.length) {
    console.log('Users with email containing "scott":');
    authUsers.users.filter(u => u.email?.toLowerCase().includes('scott')).forEach(u => {
      console.log(`  - ${u.email}: ${u.id}`);
    });
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
