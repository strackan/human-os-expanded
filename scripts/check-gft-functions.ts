/**
 * Check for functions/triggers in OLD GFT database related to regions
 */

import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3h2cXRxamlub2Fnd2NweHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxOTMzNCwiZXhwIjoyMDc0Mjk1MzM0fQ.gNQ-Puth3WfHahtGu8lSoP4jh_3LTBljyEd3Ki_S7Rw';

async function main() {
  console.log('Checking for region-related functions in OLD database...\n');

  const client = createClient(OLD_URL, OLD_KEY);

  // Check how contacts are linked to regions
  console.log('=== CONTACTS WITH REGIONS ===');
  const { data: contactsWithRegion, error: crErr } = await client
    .from('contacts')
    .select('id, name, location, location_raw, region_id')
    .not('region_id', 'is', null)
    .limit(10);

  if (crErr) {
    console.log('Error:', crErr.message);
  } else {
    console.log(`${contactsWithRegion?.length} contacts have region_id set`);
    contactsWithRegion?.slice(0, 5).forEach(c => {
      console.log(`  - ${c.name}: "${c.location}" -> region_id: ${c.region_id}`);
    });
  }

  // Check region distribution
  console.log('\n=== REGION DISTRIBUTION ===');
  const { data: regions } = await client.from('regions').select('id, name, display_name');

  for (const region of regions || []) {
    const { count } = await client
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('region_id', region.id);

    if (count && count > 0) {
      console.log(`  ${region.display_name}: ${count} contacts`);
    }
  }

  // Check personas
  console.log('\n=== PERSONAS ===');
  const { data: personas, error: pErr } = await client
    .from('personas')
    .select('*');

  if (pErr) {
    console.log('Error:', pErr.message);
  } else {
    console.log(`Found ${personas?.length} personas:`);
    personas?.forEach(p => {
      console.log(`  - ${p.persona_name} (${p.persona_slug})`);
      console.log(`    Keywords: ${p.search_keywords?.slice(0, 3).join(', ')}`);
      console.log(`    Description: ${p.description?.substring(0, 100)}`);
    });
  }

  // Check persona distribution
  console.log('\n=== PERSONA DISTRIBUTION ===');
  for (const persona of personas || []) {
    const { count } = await client
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', persona.id);

    if (count && count > 0) {
      console.log(`  ${persona.persona_name}: ${count} contacts`);
    }
  }

  // Check tiers and relationship_types (referenced in contacts)
  console.log('\n=== CHECKING FOR TIERS TABLE ===');
  const { data: tiers, error: tErr } = await client.from('tiers').select('*');
  if (tErr) {
    console.log('No tiers table found');
  } else {
    console.log(`Found ${tiers?.length} tiers`);
    tiers?.forEach(t => console.log(`  - ${JSON.stringify(t)}`));
  }

  console.log('\n=== CHECKING FOR RELATIONSHIP_TYPES TABLE ===');
  const { data: relTypes, error: rtErr } = await client.from('relationship_types').select('*');
  if (rtErr) {
    console.log('No relationship_types table found');
  } else {
    console.log(`Found ${relTypes?.length} relationship types`);
    relTypes?.forEach(t => console.log(`  - ${JSON.stringify(t)}`));
  }
}

main().catch(console.error);
