/**
 * Test region assignment trigger
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('Testing region assignment trigger...\n');

  const client = createClient(NEW_URL, NEW_KEY);

  // Test by inserting a new contact
  const testContact = {
    owner_id: 'c553726a-aebe-48ac-a789-2c6a11b8dd0e',
    name: 'Test Contact for Region',
    location: 'Raleigh, North Carolina, United States',
  };

  console.log('Inserting test contact with location:', testContact.location);

  const { data: inserted, error: insertErr } = await client
    .schema('gft')
    .from('contacts')
    .insert(testContact)
    .select('id, name, location, region_id');

  if (insertErr) {
    console.error('Insert error:', insertErr);
    return;
  }

  console.log('Inserted contact:', JSON.stringify(inserted?.[0], null, 2));

  if (inserted?.[0]?.region_id) {
    const { data: region } = await client
      .schema('gft')
      .from('regions')
      .select('display_name')
      .eq('id', inserted[0].region_id)
      .single();

    console.log('\nRegion assigned:', region?.display_name);
  } else {
    console.log('\nNo region was assigned - trigger may not be working');

    // Try calling the function directly via SQL
    console.log('\nTrying direct function call...');
    const { data: regions } = await client
      .schema('gft')
      .from('regions')
      .select('*');

    console.log('Available regions:', regions?.map(r => r.name).join(', '));
  }

  // Clean up test contact
  if (inserted?.[0]?.id) {
    await client
      .schema('gft')
      .from('contacts')
      .delete()
      .eq('id', inserted[0].id);
    console.log('\nTest contact deleted.');
  }
}

main().catch(console.error);
