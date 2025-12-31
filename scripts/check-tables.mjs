import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check for glossary table
  const { data: glossary, error: gErr } = await supabase
    .from('glossary')
    .select('term, definition')
    .limit(3);

  console.log('Glossary table:', gErr ? `NOT FOUND (${gErr.message})` : `EXISTS (${glossary?.length} sample rows)`);

  // Check for contexts table
  const { data: contexts, error: cErr } = await supabase
    .schema('founder_os')
    .from('contexts')
    .select('name, description')
    .limit(5);

  console.log('Contexts table:', cErr ? `NOT FOUND (${cErr.message})` : `EXISTS (${contexts?.length} sample rows)`);

  if (contexts?.length > 0) {
    console.log('\nSample contexts:');
    contexts.forEach(c => console.log(`  - ${c.name}: ${c.description?.substring(0, 50)}...`));
  }
}

main().catch(console.error);
