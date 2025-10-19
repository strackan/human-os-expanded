import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get or create Renubu company
  let { data: renubu } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', 'Renubu')
    .maybeSingle();

  if (!renubu) {
    console.log('Creating Renubu company...');
    const { data: created, error } = await supabase
      .from('companies')
      .insert({ name: 'Renubu', domain: 'renubu.com' })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error creating Renubu:', error);
      process.exit(1);
    }
    renubu = created;
  }

  console.log('Renubu Company ID:', renubu!.id);

  // Update all profiles without a company to belong to Renubu
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ company_id: renubu!.id })
    .is('company_id', null)
    .select('id, email');

  if (updateError) {
    console.error('Error updating profiles:', updateError);
  } else {
    console.log(`Updated ${updated?.length || 0} profiles to Renubu company`);
  }
}

main();
